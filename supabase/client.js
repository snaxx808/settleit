// lib/supabase.js
// Drop this in your src/ folder alongside settleit.jsx
// npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: username } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── DISPUTES ─────────────────────────────────────────────────────────────────

export async function getDisputes({ category, filter = 'hot', limit = 20, offset = 0 }) {
  let query = supabase
    .from('disputes_with_details')
    .select('*')
    .eq('is_removed', false)
    .gt('expires_at', new Date().toISOString())
    .range(offset, offset + limit - 1);

  if (category && category !== '🔥 All') {
    query = query.eq('category', category);
  }

  if (filter === 'hot') {
    query = query.order('total_votes', { ascending: false });
  } else if (filter === 'new') {
    query = query.order('created_at', { ascending: false });
  } else if (filter === 'settled') {
    query = query.eq('settled', true).order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getFollowingDisputes(userId, limit = 20) {
  // Get IDs of people the user follows
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = follows?.map(f => f.following_id) || [];
  if (!followingIds.length) return [];

  const { data, error } = await supabase
    .from('disputes_with_details')
    .select('*')
    .in('author_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function createDispute({ title, type, category, tags, options, mediaUrl, mediaCaption, mediaType, contentWarning, expiresAt, authorId }) {
  // Insert dispute
  const { data: dispute, error: dErr } = await supabase
    .from('disputes')
    .insert({
      title, type, category, tags,
      media_url: mediaUrl,
      media_caption: mediaCaption,
      media_type: mediaType,
      content_warning: contentWarning,
      expires_at: expiresAt,
      author_id: authorId,
    })
    .select()
    .single();
  if (dErr) throw dErr;

  // Insert options
  const optionRows = options.map((o, i) => ({
    dispute_id: dispute.id,
    option_key: o.id,
    label: o.label,
    color: o.color || '#e85d26',
    media_url: o.media?.url || null,
    media_caption: o.media?.caption || null,
    position: i,
  }));

  const { error: oErr } = await supabase.from('options').insert(optionRows);
  if (oErr) throw oErr;

  return dispute;
}

export async function settleDispute(disputeId, verdict) {
  const { data, error } = await supabase
    .from('disputes')
    .update({
      settled: true,
      verdict_winner: verdict.winner,
      verdict_reasoning: verdict.reasoning,
      verdict_confidence: verdict.confidence,
      verdict_fun_fact: verdict.funFact,
    })
    .eq('id', disputeId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── VOTES ────────────────────────────────────────────────────────────────────

export async function castVote(disputeId, optionId, userId) {
  const { data, error } = await supabase
    .from('votes')
    .insert({ dispute_id: disputeId, option_id: optionId, user_id: userId })
    .select()
    .single();
  // If unique constraint error → already voted
  if (error?.code === '23505') return { alreadyVoted: true };
  if (error) throw error;
  return data;
}

export async function getUserVote(disputeId, userId) {
  const { data } = await supabase
    .from('votes')
    .select('option_id')
    .eq('dispute_id', disputeId)
    .eq('user_id', userId)
    .single();
  return data?.option_id || null;
}

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

export async function getComments(disputeId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`*, profiles(username, display_name, avatar, verified)`)
    .eq('dispute_id', disputeId)
    .eq('is_removed', false)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addComment(disputeId, userId, text, isAI = false) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ dispute_id: disputeId, user_id: userId, text, is_ai: isAI })
    .select(`*, profiles(username, display_name, avatar, verified)`)
    .single();
  if (error) throw error;
  return data;
}

// ─── REACTIONS ────────────────────────────────────────────────────────────────

export async function toggleReaction(disputeId, userId, emoji) {
  // Check if exists
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('dispute_id', disputeId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .single();

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id);
    return { added: false };
  } else {
    await supabase.from('reactions').insert({ dispute_id: disputeId, user_id: userId, emoji });
    return { added: true };
  }
}

export async function getReactions(disputeId) {
  const { data } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('dispute_id', disputeId);
  // Group by emoji
  const counts = {};
  data?.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
  return counts;
}

// ─── BOOKMARKS ────────────────────────────────────────────────────────────────

export async function toggleBookmark(disputeId, userId) {
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('dispute_id')
    .eq('dispute_id', disputeId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase.from('bookmarks').delete().eq('dispute_id', disputeId).eq('user_id', userId);
    return false;
  } else {
    await supabase.from('bookmarks').insert({ dispute_id: disputeId, user_id: userId });
    return true;
  }
}

export async function getBookmarkedDisputes(userId) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`dispute_id, disputes_with_details(*)`)
    .eq('user_id', userId);
  if (error) throw error;
  return data?.map(b => b.disputes_with_details) || [];
}

// ─── FOLLOWS ──────────────────────────────────────────────────────────────────

export async function toggleFollow(followerId, followingId) {
  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (existing) {
    await supabase.from('follows').delete()
      .eq('follower_id', followerId).eq('following_id', followingId);
    return false;
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
    return true;
  }
}

export async function getFollowing(userId) {
  const { data } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  return data?.map(f => f.following_id) || [];
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function markNotificationsRead(userId) {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}

// ─── REALTIME ─────────────────────────────────────────────────────────────────

export function subscribeToDispute(disputeId, onVote, onComment) {
  const channel = supabase
    .channel(`dispute:${disputeId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'votes',
      filter: `dispute_id=eq.${disputeId}`,
    }, payload => onVote(payload.new))
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'comments',
      filter: `dispute_id=eq.${disputeId}`,
    }, payload => onComment(payload.new))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribeToNotifications(userId, onNotif) {
  const channel = supabase
    .channel(`notifs:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, payload => onNotif(payload.new))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────

export async function searchDisputes(query, { category, settled, limit = 20 } = {}) {
  let q = supabase
    .from('disputes_with_details')
    .select('*')
    .or(`title.ilike.%${query}%,tags.cs.{${query}}`)
    .limit(limit);

  if (category && category !== '🔥 All') q = q.eq('category', category);
  if (settled !== undefined) q = q.eq('settled', settled);

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

export async function fileReport({ reporterId, disputeId, commentId, reason, detail }) {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    dispute_id: disputeId || null,
    comment_id: commentId || null,
    reason,
    detail,
  });
  if (error) throw error;
  // Increment report count on dispute
  if (disputeId) {
    await supabase.rpc('increment', { table: 'disputes', id: disputeId, column: 'report_count' });
  }
}

// ─── AI PROXY ─────────────────────────────────────────────────────────────────
// Replaces direct Anthropic calls — routes through your Vercel proxy

export async function callAI(prompt, maxTokens = 700) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error('AI unavailable');
  const { text } = await res.json();
  return text;
}

export async function callAIJson(prompt, maxTokens = 600) {
  const text = await callAI(prompt, maxTokens);
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}
