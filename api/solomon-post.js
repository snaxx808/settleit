// api/solomon-post.js
// Vercel cron — every 30 min, Claude drafts a fresh debate-worthy dispute
// and inserts it into Supabase under the "Solomon" profile.

import { createClient } from '@supabase/supabase-js';

const CATEGORIES = ['🍕 Food', '🏠 Life', '🎮 Culture', '💼 Work', '🌍 Society', '📸 Visual'];

export default async function handler(req, res) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!apiKey || !supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing env vars' });
    }

    const prompt = `Generate a fun, debate-worthy dispute for a social voting app. Make it current, relatable, and slightly polarizing — the kind of thing friends actually argue about. Pick a category that fits. Return ONLY valid JSON, no markdown fences, no commentary:

{
  "title": "A question that sparks debate, ends with ?, max 100 chars",
  "category": "exactly one of: 🍕 Food, 🏠 Life, 🎮 Culture, 💼 Work, 🌍 Society, 📸 Visual",
  "options": [
    { "id": "A", "label": "First side, max 30 chars", "color": "#e85d26" },
    { "id": "B", "label": "Opposing side, max 30 chars", "color": "#2a7bd4" }
  ],
  "tags": ["3-5", "lowercase", "single-word", "tags"]
}`;

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('Anthropic error:', errText);
      return res.status(502).json({ error: 'AI unavailable' });
    }

    const aiData = await aiResp.json();
    const raw = aiData.content.map(i => i.text || '').join('').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('No JSON in AI response:', raw);
      return res.status(502).json({ error: 'Malformed AI output' });
    }

    let dispute;
    try {
      dispute = JSON.parse(match[0]);
    } catch (e) {
      console.error('JSON parse failed:', e, raw);
      return res.status(502).json({ error: 'Invalid AI JSON' });
    }

    if (!dispute.title || !Array.isArray(dispute.options) || dispute.options.length < 2) {
      return res.status(502).json({ error: 'Incomplete dispute' });
    }

    if (!CATEGORIES.includes(dispute.category)) dispute.category = '🌍 Society';

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: solomon } = await supabase
      .from('profiles')
      .select('id')
      .or('username.eq.Solomon,display_name.eq.Solomon')
      .limit(1)
      .maybeSingle();

    let title = dispute.title;
    let authorId = solomon?.id;

    if (!authorId) {
      title = `[Solomon AI – system] ${title}`;
      const { data: anyProfile } = await supabase
        .from('profiles')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      authorId = anyProfile?.id;
      if (!authorId) {
        return res.status(500).json({ error: 'No profile available to author dispute' });
      }
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: inserted, error: insertErr } = await supabase
      .from('disputes')
      .insert({
        author_id: authorId,
        title,
        category: dispute.category,
        tags: Array.isArray(dispute.tags) ? dispute.tags.slice(0, 8) : [],
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Dispute insert error:', insertErr);
      return res.status(500).json({ error: 'DB insert failed', detail: insertErr.message });
    }

    const optionRows = dispute.options.slice(0, 2).map((o, i) => ({
      dispute_id: inserted.id,
      option_key: o.id || (i === 0 ? 'A' : 'B'),
      label: String(o.label || '').slice(0, 60),
      color: o.color || (i === 0 ? '#e85d26' : '#2a7bd4'),
      position: i,
    }));

    const { error: optErr } = await supabase.from('options').insert(optionRows);
    if (optErr) {
      console.error('Options insert error:', optErr);
      return res.status(500).json({ error: 'Options insert failed', detail: optErr.message });
    }

    return res.status(200).json({
      id: inserted.id,
      title,
      category: dispute.category,
      tags: inserted.tags,
      expires_at: expiresAt,
    });
  } catch (e) {
    console.error('solomon-post error:', e);
    return res.status(500).json({ error: 'Internal server error', detail: String(e) });
  }
}
