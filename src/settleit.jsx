import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// These are injected by Vercel from your environment variables.
// Locally, create a .env file:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// ─── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = {
  dark:  { bg:"#07070a",surface:"#0e0e14",surface2:"#13131a",surface3:"#18181f",border:"#1c1c26",border2:"#262632",text:"#eeeef5",text2:"#c4c4d4",text3:"#8a8aa0",text4:"#52526a",text5:"#2e2e3e",accent:"#f0c040",accentBg:"#f0c04012",accentBorder:"#f0c04044",red:"#e85d26",blue:"#2a7bd4",green:"#3dba6f",purple:"#9b6dff",pink:"#e85090",teal:"#2ab8b8",orange:"#f08020",shadow:"0 8px 32px #00000099" },
  light: { bg:"#f5f3ee",surface:"#ffffff",surface2:"#f0ede6",surface3:"#e8e4da",border:"#ddd8cc",border2:"#ccc7b8",text:"#18180f",text2:"#333325",text3:"#66664a",text4:"#99997a",text5:"#cccc99",accent:"#c9900a",accentBg:"#c9900a12",accentBorder:"#c9900a44",red:"#c94010",blue:"#1a5faa",green:"#2a8a50",purple:"#7040d0",pink:"#c0306a",teal:"#1a9090",orange:"#b06010",shadow:"0 8px 32px #00000022" },
  oled:  { bg:"#000000",surface:"#080808",surface2:"#101010",surface3:"#181818",border:"#1a1a1a",border2:"#242424",text:"#ffffff",text2:"#e0e0e0",text3:"#909090",text4:"#606060",text5:"#303030",accent:"#f0c040",accentBg:"#f0c04015",accentBorder:"#f0c04055",red:"#ff6030",blue:"#3090ff",green:"#40d070",purple:"#b080ff",pink:"#ff50a0",teal:"#30d0d0",orange:"#ff9020",shadow:"0 8px 32px #00000099" },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const now = Date.now();
const CATEGORIES = ["🔥 All","🍕 Food","🏠 Life","🎮 Culture","💼 Work","🌍 Society","📸 Visual"];
const REACTIONS = ["🔥","🤔","😂","💀","👀","🫡"];
const AVATAR_OPTIONS = ["🫵","🦁","🐉","🦊","🐺","🦋","🌙","⚡","🎭","🌊","🔥","💀","🎯","🌈","🦄","🧠","👾","🎸","🏴‍☠️","🌺"];
const COUNTRY_OPTIONS = ["🇺🇸 USA","🇬🇧 UK","🇯🇵 Japan","🇫🇷 France","🇩🇪 Germany","🇧🇷 Brazil","🇮🇳 India","🇨🇦 Canada","🇦🇺 Australia","🇲🇽 Mexico","🇰🇷 Korea","🇨🇳 China","🇮🇹 Italy","🇪🇸 Spain","🇳🇬 Nigeria","🇿🇦 South Africa","🌍 Other"];
const REPORT_REASONS = ["Misinformation","Hate speech","Harassment","Spam","Explicit content","Off-topic","Other"];
const CONTENT_WARNING_TOPICS = ["politics","death","violence","religion","race","mental health","abortion","drugs"];

const FUN_BADGES = [
  {id:"first_vote",icon:"🗳️",label:"First Vote",desc:"Cast your first vote"},
  {id:"hot_take",icon:"🌶️",label:"Hot Take",desc:"Post your first dispute"},
  {id:"contrarian",icon:"🔀",label:"Contrarian",desc:"Vote with the minority 5 times"},
  {id:"settler",icon:"⚖️",label:"Settler",desc:"Ask Solomon to settle 3 disputes"},
  {id:"social",icon:"🤝",label:"Social",desc:"Follow 3 people"},
  {id:"streak3",icon:"🔥",label:"On Fire",desc:"3-day voting streak"},
  {id:"streak7",icon:"⚡",label:"Unstoppable",desc:"7-day voting streak"},
  {id:"oracle",icon:"🔮",label:"Oracle",desc:"Predicted correctly 5 times"},
];

const SPONSORED_DISPUTES = [
  {id:"sp1",sponsored:true,brand:"Pepsi",brandEmoji:"🥤",category:"🍕 Food",tags:["drinks","cola"],title:"Pepsi or Coke — settle it once and for all",options:[{id:"A",label:"Pepsi is clearly better 🔵",votes:18420,color:"#2a7bd4"},{id:"B",label:"Coke wins every time ❤️",votes:24391,color:"#e85d26"}],author:"Pepsi",timeAgo:"sponsored",expiresAt:now+864e5,reactions:{"🔥":441},comments:[],verdict:null,settled:false,bookmarked:false,hotStreak:false,reported:false,contentWarning:null,votesOverTime:[{t:-86400,v:5000},{t:0,v:42811}],pinnedComment:null},
];

// Fallback demo disputes (shown when Supabase isn't connected)
const DEMO_DISPUTES = [
  {id:1,category:"🍕 Food",tags:["food","classic"],title:"Is a hot dog a sandwich?",options:[{id:"A",label:"Yes, it's a sandwich",votes:142,color:"#e85d26"},{id:"B",label:"No — its own category",votes:311,color:"#2a7bd4"}],author:"FoodPhilosopher",authorAvatar:"🍔",authorVerified:null,timeAgo:"2h ago",expiresAt:now+7.2e6,reactions:{"🔥":24,"😂":18},comments:[{id:1,user:"DebateLord",text:"Finally, justice.",likes:14,time:"1h ago",isAI:false,reported:false}],verdict:{winner:"B",confidence:"81%",reasoning:"A hot dog's hinged bun separates it from the sandwich category. The bread is a vessel, not a frame.",funFact:"The sandwich was named after the 4th Earl of Sandwich, who ate meat between bread to avoid leaving the gambling table."},settled:true,bookmarked:false,hotStreak:false,reported:false,contentWarning:null,votesOverTime:[{t:-7200,v:42},{t:-3600,v:156},{t:0,v:453}]},
  {id:2,category:"🏠 Life",tags:["roommate","etiquette"],title:"My roommate ate my leftovers. Who's wrong?",options:[{id:"A",label:"Roommate is wrong",votes:892,color:"#e85d26"},{id:"B",label:"Should've labeled it",votes:203,color:"#2a7bd4"}],author:"NeutralNancy",authorAvatar:"🤷",authorVerified:"identity",timeAgo:"45m ago",expiresAt:now+3.6e6*3,reactions:{"💀":31,"🔥":15},comments:[{id:1,user:"DebateLord",text:"Labeling is courtesy, not a requirement.",likes:31,time:"30m ago",isAI:false,reported:false}],verdict:null,settled:false,bookmarked:false,hotStreak:true,reported:false,contentWarning:null,votesOverTime:[{t:-2700,v:50},{t:-900,v:610},{t:0,v:1095}]},
  {id:3,category:"🌍 Society",tags:["science","space"],title:"Is Pluto a planet?",options:[{id:"A",label:"Yes — always will be",votes:567,color:"#e85d26"},{id:"B",label:"No — IAU definition is clear",votes:489,color:"#2a7bd4"}],author:"DebateLord",authorAvatar:"⚡",authorVerified:"notable",timeAgo:"1h ago",expiresAt:now+4.32e7,reactions:{"🤔":44},comments:[],verdict:null,settled:false,bookmarked:true,hotStreak:false,reported:false,contentWarning:null,votesOverTime:[{t:-3600,v:120},{t:0,v:1056}]},
  {id:4,category:"💼 Work",tags:["work","email"],title:"Should you reply to work emails after 6pm?",options:[{id:"A",label:"Yes, be responsive",votes:234,color:"#e85d26"},{id:"B",label:"No, protect your time",votes:788,color:"#2a7bd4"}],author:"NeutralNancy",authorAvatar:"🤷",authorVerified:"identity",timeAgo:"5h ago",expiresAt:now+3.6e6*71,reactions:{"👀":20},comments:[],verdict:null,settled:false,bookmarked:false,hotStreak:false,reported:false,contentWarning:null,votesOverTime:[{t:-18000,v:100},{t:0,v:1022}]},
  {id:5,category:"🎮 Culture",tags:["movies","christmas"],title:"Is Die Hard a Christmas movie?",options:[{id:"A",label:"Obviously yes",votes:731,color:"#e85d26"},{id:"B",label:"It's an action movie",votes:614,color:"#2a7bd4"}],author:"DebateLord",authorAvatar:"⚡",authorVerified:"notable",timeAgo:"3h ago",expiresAt:now+3.6e6*5,reactions:{"🔥":55,"😂":33},comments:[],verdict:null,settled:false,bookmarked:false,hotStreak:true,reported:false,contentWarning:null,votesOverTime:[{t:-10800,v:200},{t:-3600,v:900},{t:0,v:1345}]},
  {id:6,category:"🍕 Food",tags:["pizza","pineapple"],title:"Should pineapple be allowed on pizza?",options:[{id:"A",label:"Absolutely yes 🍍",votes:567,color:"#f08020"},{id:"B",label:"Hard no 🚫",votes:489,color:"#e85d26"}],author:"PizzaPurist",authorAvatar:"🍕",authorVerified:"identity",timeAgo:"4h ago",expiresAt:now+3.6e6*20,reactions:{"😂":44,"🤔":12},comments:[],verdict:null,settled:false,bookmarked:false,hotStreak:false,reported:false,contentWarning:null,votesOverTime:[{t:-14400,v:150},{t:0,v:1056}]},
  {id:7,type:"image",category:"📸 Visual",tags:["photography","art"],title:"Which photo better captures loneliness?",options:[{id:"A",label:"The empty bench",votes:412,color:"#e85d26"},{id:"B",label:"The crowded subway",votes:389,color:"#2a7bd4"}],media:{type:"image",url:"https://picsum.photos/seed/lonely42/700/400",caption:"Empty park bench at dusk"},author:"VisualVictor",authorAvatar:"📸",authorVerified:null,timeAgo:"2h ago",expiresAt:now+7.2e6,reactions:{"🤔":34},comments:[],verdict:null,settled:false,bookmarked:false,hotStreak:false,reported:false,contentWarning:null,votesOverTime:[{t:-3600,v:80},{t:0,v:801}]},
  {id:8,type:"image_vs_image",category:"📸 Visual",tags:["nature","city"],title:"Better skyline: mountains or city lights?",options:[{id:"A",label:"Mountains win 🏔️",votes:892,color:"#e85d26",media:{type:"image",url:"https://picsum.photos/seed/mountain88/600/420",caption:"Mountains at golden hour"}},{id:"B",label:"City lights ✨",votes:743,color:"#2a7bd4",media:{type:"image",url:"https://picsum.photos/seed/citynight77/600/420",caption:"City skyline at midnight"}}],author:"VisualVictor",authorAvatar:"📸",authorVerified:null,timeAgo:"6h ago",expiresAt:now+8.64e7,reactions:{"🔥":77},comments:[],verdict:null,settled:false,bookmarked:false,hotStreak:false,reported:false,contentWarning:null,votesOverTime:[{t:-21600,v:300},{t:0,v:1635}]},
  {id:9,type:"video",category:"🎮 Culture",tags:["film","cinema"],title:"This opening scene — masterpiece or overhyped?",media:{type:"video",url:"https://www.w3schools.com/html/mov_bbb.mp4",thumbnail:"https://picsum.photos/seed/cinema55/700/400",caption:"Big Buck Bunny opening — 30 sec"},options:[{id:"A",label:"Pure cinematic genius 🎬",votes:701,color:"#e85d26"},{id:"B",label:"Completely overhyped 🙄",votes:298,color:"#2a7bd4"}],author:"DebateLord",authorAvatar:"⚡",authorVerified:"notable",timeAgo:"4h ago",expiresAt:now+4.32e7,reactions:{"🔥":55},comments:[],verdict:null,settled:false,bookmarked:false,hotStreak:false,reported:false,contentWarning:null,votesOverTime:[{t:-14400,v:150},{t:0,v:999}]},
  {id:10,type:"image",category:"🍕 Food",tags:["food","pizza"],title:"Is this actually appetizing or a crime against cuisine?",media:{type:"image",url:"https://picsum.photos/seed/pizzafood33/700/420",caption:"Pineapple on pizza, up close"},options:[{id:"A",label:"Looks delicious 😍",votes:234,color:"#f08020"},{id:"B",label:"Call the food police 🚨",votes:567,color:"#e85d26"}],author:"PizzaPurist",authorAvatar:"🍕",authorVerified:"identity",timeAgo:"1h ago",expiresAt:now+1.8e7,reactions:{"😂":44,"💀":28},comments:[{id:1,user:"DebateLord",text:"I can smell this and I'm conflicted.",likes:22,time:"30m ago",isAI:false,reported:false}],verdict:null,settled:false,bookmarked:false,hotStreak:true,reported:false,contentWarning:null,votesOverTime:[{t:-3600,v:100},{t:0,v:801}]},
];

// ─── SUPABASE DATA LAYER ──────────────────────────────────────────────────────
const db = {
  async getDisputes(filter="hot", category=null) {
    if (!supabase) return DEMO_DISPUTES;
    let q = supabase.from("disputes_with_details").select("*").eq("is_removed",false).gt("expires_at", new Date().toISOString());
    if (category && category !== "🔥 All") q = q.eq("category", category);
    if (filter === "hot") q = q.order("total_votes", {ascending:false});
    else if (filter === "new") q = q.order("created_at", {ascending:false});
    else if (filter === "settled") q = q.eq("settled",true).order("created_at",{ascending:false});
    const {data,error} = await q.limit(30);
    if (error) { console.error(error); return DEMO_DISPUTES; }
    return (data||[]).map(normalizeDispute);
  },
  async getFollowingDisputes(userId) {
    if (!supabase) return DEMO_DISPUTES.slice(0,4);
    const {data:follows} = await supabase.from("follows").select("following_id").eq("follower_id",userId);
    const ids = (follows||[]).map(f=>f.following_id);
    if (!ids.length) return [];
    const {data} = await supabase.from("disputes_with_details").select("*").in("author_id",ids).order("created_at",{ascending:false}).limit(20);
    return (data||[]).map(normalizeDispute);
  },
  async getBookmarks(userId) {
    if (!supabase) return DEMO_DISPUTES.filter(d=>d.bookmarked);
    const {data} = await supabase.from("bookmarks").select("dispute_id, disputes_with_details(*)").eq("user_id",userId);
    return (data||[]).map(b=>normalizeDispute(b.disputes_with_details)).filter(Boolean);
  },
  async castVote(disputeId, optionId, userId) {
    if (!supabase) return true;
    const {error} = await supabase.from("votes").insert({dispute_id:disputeId, option_id:optionId, user_id:userId});
    return !error || error.code === "23505";
  },
  async addComment(disputeId, userId, text, isAI=false) {
    if (!supabase) return {id:Date.now(),user:userId,text,likes:0,time:"just now",isAI,reported:false};
    const {data} = await supabase.from("comments").insert({dispute_id:disputeId,user_id:userId,text,is_ai:isAI}).select("*, profiles(username,display_name,avatar,verified)").single();
    return data;
  },
  async settleDispute(disputeId, verdict) {
    if (!supabase) return true;
    await supabase.from("disputes").update({settled:true,verdict_winner:verdict.winner,verdict_reasoning:verdict.reasoning,verdict_confidence:verdict.confidence,verdict_fun_fact:verdict.funFact}).eq("id",disputeId);
  },
  async createDispute(dispute, userId) {
    if (!supabase) return {...dispute, id:Date.now(), author:userId};
    const {data:d,error} = await supabase.from("disputes").insert({title:dispute.title,type:dispute.type||"text",category:dispute.category,tags:dispute.tags,content_warning:dispute.contentWarning,expires_at:dispute.expiresAt,author_id:userId}).select().single();
    if (error) throw error;
    await supabase.from("options").insert(dispute.options.map((o,i)=>({dispute_id:d.id,option_key:o.id,label:o.label,color:o.color,position:i})));
    return d;
  },
  async toggleBookmark(disputeId, userId) {
    if (!supabase) return;
    const {data:ex} = await supabase.from("bookmarks").select("dispute_id").eq("dispute_id",disputeId).eq("user_id",userId).single();
    if (ex) await supabase.from("bookmarks").delete().eq("dispute_id",disputeId).eq("user_id",userId);
    else await supabase.from("bookmarks").insert({dispute_id:disputeId,user_id:userId});
  },
  async toggleFollow(followerId, followingId) {
    if (!supabase) return;
    const {data:ex} = await supabase.from("follows").select("follower_id").eq("follower_id",followerId).eq("following_id",followingId).single();
    if (ex) await supabase.from("follows").delete().eq("follower_id",followerId).eq("following_id",followingId);
    else await supabase.from("follows").insert({follower_id:followerId,following_id:followingId});
  },
  async getNotifications(userId) {
    if (!supabase) return [];
    const {data} = await supabase.from("notifications").select("*").eq("user_id",userId).order("created_at",{ascending:false}).limit(50);
    return data||[];
  },
  async markNotifsRead(userId) {
    if (!supabase) return;
    await supabase.from("notifications").update({is_read:true}).eq("user_id",userId).eq("is_read",false);
  },
  async updateProfile(userId, updates) {
    if (!supabase) return;
    await supabase.from("profiles").update(updates).eq("id",userId);
  },
  async getUserVotes(userId) {
    if (!supabase) return {};
    const {data} = await supabase.from("votes").select("dispute_id, option_id, options(option_key)").eq("user_id", userId);
    const map = {};
    (data||[]).forEach(v => { map[v.dispute_id] = v.options?.option_key || v.option_id; });
    return map;
  },
  subscribeToDispute(disputeId, onVote, onComment) {
    if (!supabase) return ()=>{};
    const ch = supabase.channel(`dispute:${disputeId}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"votes",filter:`dispute_id=eq.${disputeId}`}, p=>onVote(p.new))
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"comments",filter:`dispute_id=eq.${disputeId}`}, p=>onComment(p.new))
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  },
  subscribeToNotifs(userId, onNotif) {
    if (!supabase) return ()=>{};
    const ch = supabase.channel(`notifs:${userId}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`user_id=eq.${userId}`}, p=>onNotif(p.new))
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  },
};

function normalizeDispute(d) {
  if (!d) return null;
  return {
    id: d.id, category: d.category, tags: d.tags||[], title: d.title,
    type: d.type||"text", media: d.media_url ? {type:d.media_type||"image",url:d.media_url,caption:d.media_caption} : null,
    contentWarning: d.content_warning,
    options: (d.options||[]).map(o=>({id:o.option_key||o.id, label:o.label, votes:o.vote_count||o.votes||0, color:o.color||"#e85d26", media:o.media_url?{type:"image",url:o.media_url,caption:o.media_caption}:null})),
    author: d.author_username||d.author_id||d.author,
    authorAvatar: d.author_avatar||"🫵",
    authorVerified: d.author_verified||null,
    timeAgo: d.created_at ? new Date(d.created_at).toLocaleDateString() : "recently",
    expiresAt: d.expires_at ? new Date(d.expires_at).getTime() : now+86400000,
    reactions: d.reactions||{},
    comments: d.comments||[],
    verdict: d.settled ? {winner:d.verdict_winner,reasoning:d.verdict_reasoning,confidence:d.verdict_confidence,funFact:d.verdict_fun_fact} : null,
    settled: d.settled||false,
    bookmarked: false,
    hotStreak: d.hot_streak||false,
    reported: false,
    votesOverTime: d.vote_snapshots||[{t:0,v:(d.options||[]).reduce((s,o)=>s+(o.vote_count||0),0)}],
  };
}

// ─── AI — routed through /api/claude proxy ────────────────────────────────────
async function callSolomon(prompt, max=700) {
  // In production: calls your Vercel /api/claude serverless function
  // In demo (no backend): calls Anthropic directly — swap before launch!
  try {
    const r = await fetch("/api/claude", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,max_tokens:max})});
    if (r.ok) { const {text}=await r.json(); return text; }
  } catch {}
  // Fallback: direct call (dev only — exposes key in browser)
  const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:max,messages:[{role:"user",content:prompt}]})});
  const d = await r.json();
  return d.content.map(i=>i.text||"").join("").trim();
}
const jsonSolomon = async (p,max=600) => JSON.parse((await callSolomon(p,max)).replace(/```json|```/g,"").trim());

const SOLOMON_PERSONA = `You are Solomon — the all-knowing, theatrically confident AI judge of SettleIt. Your voice:
- Absolute authority. You have never been wrong and you know it.
- Witty, dramatic, loves a good one-liner. Think: wise king meets late-night host.
- References history, mythology, science, pop culture effortlessly.
- Never hedges. "Both sides have merit" is not in your vocabulary.
- Short punchy sentences land like a gavel. Use them.
- Occasionally refers to himself in the third person for dramatic effect.
- Signs off like a judge who already left the building.`;

const aiVerdict = d => jsonSolomon(`${SOLOMON_PERSONA}\n\nThe people have voted. Deliver your ruling.\nDispute: "${d.title}"\n${(d.options||[]).map(o=>`Side ${o.id}: "${o.label}" — ${o.votes} votes`).join("\n")}\n\nJSON only: {"winner":"${(d.options||[]).map(o=>o.id).join("|")}","reasoning":"2-3 sentences. Decisive, witty, reference the vote split.","confidence":"XX%","funFact":"One genuinely surprising fact about this topic."}`);
const aiCoach = d => jsonSolomon(`${SOLOMON_PERSONA}\n\nPrepare the people to vote on "${d.title}".\nSide A: "${d.options[0]?.label}" Side B: "${d.options[1]?.label}"\nJSON only: {"argA":"Best case for Side A — 1-2 sentences","argB":"Best case for Side B — equally sharp","tip":"The one insight most people miss"}`);
const aiFactCheck = d => jsonSolomon(`${SOLOMON_PERSONA}\n\nFact-check this dispute.\n"${d.title}" A:"${d.options[0]?.label}" B:"${d.options[1]?.label}"\nJSON only: {"ratingA":"Mostly True|Mixed|Mostly False","ratingB":"Mostly True|Mixed|Mostly False","facts":["fact1","fact2","fact3"],"verdict":"One sentence of truth — Solomon-style"}`);
const aiPersonality = votes => jsonSolomon(`${SOLOMON_PERSONA}\n\nAnalyze this user's debate personality.\nVotes: ${votes.slice(0,8).map(v=>`"${v.title}"→Side ${v.side}`).join("; ")}\nJSON only: {"type":"Contrarian|Peacemaker|Philosopher|Foodie|Chaotic|Oracle|Maverick|Devil's Advocate","emoji":"one emoji","tagline":"5 words max","insight":"2 sentences. Make them feel seen."}`);
const aiComment = d => callSolomon(`${SOLOMON_PERSONA}\n\nDispute: "${d.title}"\nDrop one comment. 1-2 sentences. Takes a clear stance. Witty enough to screenshot. No hedging.`,150);
const aiTags = title => jsonSolomon(`3 short lowercase tags for:"${title}"\nJSON:["a","b","c"]`,100);
const aiPredict = d => jsonSolomon(`${SOLOMON_PERSONA}\n\nPredict the outcome.\n"${d.title}" ${(d.options||[]).map(o=>`${o.label}:${o.votes}`).join(", ")}\nJSON only: {"predictedWinner":"${(d.options||[]).map(o=>o.id).join("|")}","confidence":50-99,"reasoning":"1 sentence — confident, faintly ominous","swing":"A|B|stable"}`);
const aiFallacy = comment => jsonSolomon(`${SOLOMON_PERSONA}\n\nCheck this comment for logical fallacies.\n"${comment}"\nJSON only: {"hasFallacy":true|false,"type":"Ad Hominem|Straw Man|False Dichotomy|Slippery Slope|None","explanation":"brief","suggestion":"improved version or null"}`,280);
const aiCounter = (comment,title) => callSolomon(`${SOLOMON_PERSONA}\n\nConstruct the most devastating counter-argument to:\n"${comment}"\nAbout: "${title}"\n2 sentences. Surgical. No mercy.`,160);
const aiMediator = d => callSolomon(`${SOLOMON_PERSONA}\n\nFind common ground on "${d.title}".\nSide A: ${d.options[0]?.label} Side B: ${d.options[1]?.label}\n2 specific sentences. Surprising but fair.`,190);
const aiBestTime = disputes => callSolomon(`Best time to post disputes based on these: ${disputes.slice(0,5).map(d=>`"${d.title}"(${(d.options||[]).reduce((s,o)=>s+o.votes,0)} votes)`).join(", ")}. 1 specific sentence.`,100);
const aiSentiment = comments => jsonSolomon(`Analyze comment sentiment.\nComments:${comments.slice(0,8).map(c=>c.text).join("|")}\nJSON:{"overall":"positive|negative|neutral|mixed","score":0-100,"breakdown":{"positive":0-100,"negative":0-100,"neutral":0-100}}`,200);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtTime = ts=>{const ms=ts-Date.now();if(ms<=0)return"Expired";const h=Math.floor(ms/3.6e6),m=Math.floor((ms%3.6e6)/6e4),d=Math.floor(h/24);return d>0?`${d}d`:h>=1?`${h}h${m}m`:`${m}m`;};
const fmtNum = n=>n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1e3?`${(n/1e3).toFixed(0)}k`:String(n);
const totalVotes = d=>(d.options||[]).reduce((s,o)=>s+(o.votes||0),0);
const hasWarn = d=>d.tags?.some(t=>CONTENT_WARNING_TOPICS.includes(t.toLowerCase()))||d.contentWarning;
const getLvl = xp=>{const L=[0,100,250,500,900,1500,2500,4000,6000,9000];for(let i=L.length-1;i>=0;i--)if(xp>=L[i])return i;return 0;};
const getLvlTitle = l=>["Newcomer","Debater","Agitator","Provocateur","Contrarian","Arbiter","Luminary","Oracle","Legend","Transcendent"][Math.min(l,9)];
const streakLabel = s=>s>=30?"🔥 Legend":s>=14?"⚡ Unstoppable":s>=7?"🔥 On Fire":s>=3?"🌶️ Heating Up":"🗳️ Active";
const VERIFY_COLORS = {identity:"#2a7bd4",notable:"#9b6dff",expert:"#f0c040",official:"#3dba6f"};

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({T,onAuth}) {
  const [mode,setMode]=useState("signin");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [username,setUsername]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");

  const submit=async()=>{
    setError("");setSuccess("");
    if(!email.trim()||!password.trim())return setError("Please fill in all fields.");
    if(mode==="signup"&&!username.trim())return setError("Username is required.");
    setLoading(true);
    try {
      if(!supabase){
        // Demo mode — skip auth
        onAuth({id:"demo",email,user_metadata:{username:username||"You",display_name:username||"You"}});
        return;
      }
      if(mode==="signup"){
        const {data,error:e}=await supabase.auth.signUp({email,password,options:{data:{username,display_name:username}}});
        if(e)throw e;
        if(data.user&&!data.session)setSuccess("Check your email to confirm your account!");
        else if(data.session)onAuth(data.user);
      } else {
        const {data,error:e}=await supabase.auth.signInWithPassword({email,password});
        if(e)throw e;
        onAuth(data.user);
      }
    } catch(e){ setError(e.message||"Something went wrong. Try again."); }
    setLoading(false);
  };

  const googleSignIn=async()=>{
    if(!supabase){onAuth({id:"demo",email:"demo@settleit.app",user_metadata:{username:"You",display_name:"You"}});return;}
    await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});
  };

  return <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
    <div style={{width:"100%",maxWidth:380}}>
      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:52,marginBottom:10}}>⚖️</div>
        <div style={{fontSize:28,fontWeight:900,color:T.text,fontFamily:"Georgia,serif",letterSpacing:-1}}><span style={{color:T.accent}}>Settle</span>It</div>
        <div style={{fontSize:14,color:T.text4,marginTop:6}}>Settle any debate. Let Solomon decide.</div>
      </div>

      {/* Google */}
      <button onClick={googleSignIn} style={{width:"100%",background:T.surface,border:`1px solid ${T.border2}`,borderRadius:14,padding:"13px",display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer",marginBottom:16,fontSize:14,color:T.text,fontWeight:600}}>
        <span style={{fontSize:20}}>G</span> Continue with Google
      </button>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <div style={{flex:1,height:1,background:T.border}}/><span style={{fontSize:11,color:T.text4}}>or</span><div style={{flex:1,height:1,background:T.border}}/>
      </div>

      {/* Toggle */}
      <div style={{display:"flex",background:T.surface2,borderRadius:12,padding:4,marginBottom:16}}>
        {["signin","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");}} style={{flex:1,background:mode===m?T.bg:"transparent",border:mode===m?`1px solid ${T.border}`:"1px solid transparent",borderRadius:9,padding:"8px",color:mode===m?T.text:T.text4,fontSize:13,fontWeight:mode===m?700:400,cursor:"pointer"}}>{m==="signin"?"Sign In":"Create Account"}</button>)}
      </div>

      {/* Fields */}
      {mode==="signup"&&<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" style={{width:"100%",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:14,outline:"none",marginBottom:10,boxSizing:"border-box"}}/>}
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={{width:"100%",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:14,outline:"none",marginBottom:10,boxSizing:"border-box"}}/>
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" onKeyDown={e=>e.key==="Enter"&&submit()} style={{width:"100%",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:14,outline:"none",marginBottom:14,boxSizing:"border-box"}}/>

      {error&&<div style={{background:T.red+"18",border:`1px solid ${T.red}33`,borderRadius:10,padding:"9px 12px",fontSize:12,color:T.red,marginBottom:12}}>{error}</div>}
      {success&&<div style={{background:T.green+"18",border:`1px solid ${T.green}33`,borderRadius:10,padding:"9px 12px",fontSize:12,color:T.green,marginBottom:12}}>{success}</div>}

      <button onClick={submit} disabled={loading} style={{width:"100%",background:loading?T.surface2:T.accent,border:"none",borderRadius:12,padding:"14px",color:loading?T.text4:T.bg,fontWeight:900,fontSize:15,cursor:loading?"default":"pointer"}}>
        {loading?<span style={{display:"inline-block",width:16,height:16,border:`2px solid ${T.text4}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>:mode==="signin"?"Sign In →":"Create Account →"}
      </button>

      {!supabase&&<div style={{marginTop:16,background:T.accentBg,border:`1px solid ${T.accentBorder}`,borderRadius:10,padding:"10px 12px",fontSize:11,color:T.text3,textAlign:"center",lineHeight:1.6}}>
        <strong style={{color:T.accent}}>Demo Mode</strong> — Supabase not connected.<br/>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to go live.
      </div>}
    </div>
  </div>;
}

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
function Avatar({avatar,verified,size=32,T}) {
  const vc=verified?VERIFY_COLORS[verified]:null;
  const bs=Math.max(11,Math.round(size*.4));
  return <div style={{position:"relative",display:"inline-block",flexShrink:0}}>
    <div style={{width:size,height:size,borderRadius:"50%",background:T.surface2,border:`2px solid ${vc||T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.45}}>{avatar||"🫵"}</div>
    {vc&&<div style={{position:"absolute",bottom:-2,right:-2,width:bs,height:bs,borderRadius:"50%",background:vc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:bs*.6,color:"#fff",fontWeight:900}}>✓</div>}
  </div>;
}

function VoteBar({options,T}) {
  if(!options?.length)return null;
  const tot=options.reduce((s,o)=>s+(o.votes||0),0)||1;
  return <div style={{margin:"8px 0"}}>
    <div style={{display:"flex",borderRadius:8,overflow:"hidden",height:8}}>
      {options.map((o,i)=><div key={o.id} style={{width:`${Math.round((o.votes||0)/tot*100)}%`,background:o.color||["#e85d26","#2a7bd4","#3dba6f","#9b6dff"][i%4],transition:"width .7s",minWidth:(o.votes||0)>0?2:0}}/>)}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:11}}>
      <span style={{color:options[0]?.color||T.red,fontWeight:700}}>{Math.round((options[0]?.votes||0)/tot*100)}%</span>
      <span style={{fontSize:10,color:T.text4}}>{fmtNum(tot)} votes</span>
      <span style={{color:options[options.length-1]?.color||T.blue,fontWeight:700}}>{Math.round((options[options.length-1]?.votes||0)/tot*100)}%</span>
    </div>
  </div>;
}

function Sparkline({data,T,w=70,h=22}) {
  if(!data||data.length<2)return null;
  const v=data.map(d=>d.v),mn=Math.min(...v),mx=Math.max(...v),r=mx-mn||1;
  const pts=data.map((d,i)=>`${(i/(data.length-1))*w},${h-((d.v-mn)/r)*(h-4)-2}`).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function PullToRefresh({onRefresh,T,children}) {
  const [dist,setDist]=useState(0),[refreshing,setRefreshing]=useState(false);
  const sy=useRef(0),dragging=useRef(false);
  const threshold=60;
  const doRefresh=async()=>{setRefreshing(true);await onRefresh();setTimeout(()=>{setRefreshing(false);setDist(0);dragging.current=false;},900);};
  return <div onTouchStart={e=>{sy.current=e.touches[0].clientY;dragging.current=true;}} onTouchMove={e=>{if(!dragging.current)return;const d=Math.max(0,e.touches[0].clientY-sy.current);setDist(Math.min(d,90));}} onTouchEnd={()=>{if(dist>=threshold)doRefresh();else{setDist(0);dragging.current=false;}}} style={{position:"relative"}}>
    {(dist>5||refreshing)&&<div style={{position:"absolute",top:0,left:0,right:0,display:"flex",justifyContent:"center",padding:"10px",zIndex:5,transform:`translateY(${Math.min(dist-40,20)}px)`}}>
      <div style={{width:32,height:32,borderRadius:"50%",background:T.surface2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,transform:refreshing?"none":`rotate(${dist*4}deg)`}}>
        {refreshing?<span style={{animation:"spin .7s linear infinite",display:"inline-block"}}>↻</span>:"↓"}
      </div>
    </div>}
    <div style={{transform:dist>5||refreshing?`translateY(${Math.min(dist,50)}px)`:"none",transition:dragging.current?"none":"transform .3s"}}>{children}</div>
  </div>;
}

function SwipeCard({onVoteA,onVoteB,children,T}) {
  const [dx,setDx]=useState(0),[dragging,setDragging]=useState(false),[gone,setGone]=useState(null);
  const sx=useRef(0);const threshold=90;
  const commit=side=>{setGone(side);setTimeout(()=>{side==="A"?onVoteA():onVoteB();},260);};
  return <div
    onMouseDown={e=>{sx.current=e.clientX;setDragging(true);}}
    onMouseMove={e=>{if(dragging)setDx(e.clientX-sx.current);}}
    onMouseUp={()=>{if(Math.abs(dx)>threshold)commit(dx>0?"A":"B");else{setDx(0);setDragging(false);}}}
    onTouchStart={e=>{sx.current=e.touches[0].clientX;setDragging(true);}}
    onTouchMove={e=>{if(dragging)setDx(e.touches[0].clientX-sx.current);}}
    onTouchEnd={()=>{if(Math.abs(dx)>threshold)commit(dx>0?"A":"B");else{setDx(0);setDragging(false);}}}
    style={{transform:`translateX(${gone==="A"?500:gone==="B"?-500:dx}px) rotate(${gone==="A"?20:gone==="B"?-20:dx/20}deg)`,opacity:gone?0:1,transition:gone||!dragging?"transform .3s,opacity .3s":"none",cursor:dragging?"grabbing":"grab",userSelect:"none",position:"relative"}}>
    {Math.abs(dx)>40&&<div style={{position:"absolute",top:12,[dx>0?"left":"right"]:12,background:dx>0?T.red:T.blue,borderRadius:10,padding:"5px 13px",color:"#fff",fontWeight:900,fontSize:14,transform:"rotate(-5deg)",zIndex:10,pointerEvents:"none"}}>✅ Side {dx>0?"A":"B"}</div>}
    {children}
  </div>;
}

// ─── SOLOMON VOICE ────────────────────────────────────────────────────────────
function useSolomonVoice() {
  const [speaking,setSpeaking]=useState(false);
  const supported="speechSynthesis" in window;
  const speak=useCallback(text=>{
    if(!supported)return;
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(text);
    const voices=window.speechSynthesis.getVoices();
    const pref=voices.find(v=>v.name.includes("Daniel")||v.name.includes("Google UK English Male")||v.name.includes("Arthur"))||voices.find(v=>v.lang==="en-GB")||voices[0];
    if(pref)utt.voice=pref;
    utt.rate=0.88;utt.pitch=0.82;utt.volume=1.0;
    utt.onstart=()=>setSpeaking(true);
    utt.onend=()=>setSpeaking(false);
    utt.onerror=()=>setSpeaking(false);
    window.speechSynthesis.speak(utt);
    // ElevenLabs upgrade slot:
    // const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID", {
    //   method:"POST", headers:{"xi-api-key":"YOUR_KEY","Content-Type":"application/json"},
    //   body: JSON.stringify({text, model_id:"eleven_monolingual_v1", voice_settings:{stability:0.4,similarity_boost:0.8}})
    // });
    // new Audio(URL.createObjectURL(await res.blob())).play();
  },[supported]);
  const stop=useCallback(()=>{window.speechSynthesis.cancel();setSpeaking(false);},[]);
  return {speak,stop,speaking,supported};
}

function SolomonVoiceButton({verdict,title,T}) {
  const {speak,stop,speaking,supported}=useSolomonVoice();
  if(!supported)return null;
  const script=`Solomon has ruled on: ${title}. ${verdict.reasoning} ${verdict.funFact?`And here is something worth knowing: ${verdict.funFact}`:""}. Solomon has spoken.`;
  return <button onClick={()=>speaking?stop():speak(script)} style={{background:speaking?T.accent+"22":"transparent",border:`1px solid ${speaking?T.accent:T.accentBorder}`,borderRadius:20,padding:"3px 9px",color:T.accent,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .2s",flexShrink:0}}>
    {speaking?<><span style={{display:"inline-flex",gap:2,alignItems:"center"}}>{[0,1,2].map(i=><span key={i} style={{display:"inline-block",width:3,background:T.accent,borderRadius:2,height:8+i*3,animation:`soundbar .6s ${i*.15}s ease-in-out infinite alternate`}}/>)}</span>Stop</>:<>🔊 Hear Solomon</>}
  </button>;
}

// ─── MEDIA COMPONENTS ─────────────────────────────────────────────────────────
function MediaRenderer({media,T,onClick}) {
  const [err,setErr]=useState(false);
  if(!media)return null;
  const s={borderRadius:12,overflow:"hidden",position:"relative",background:T.surface3,aspectRatio:"16/9",cursor:onClick?"pointer":"default"};
  if(media.type==="image") return <div style={s} onClick={onClick}>
    {!err?<img src={media.url} alt={media.caption||""} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={()=>setErr(true)}/>
      :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6,color:T.text4}}><span style={{fontSize:28}}>🖼️</span><span style={{fontSize:11}}>Image unavailable</span></div>}
    {media.caption&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,#000000bb)",padding:"18px 10px 8px"}}><span style={{fontSize:11,color:"#ffffffcc"}}>{media.caption}</span></div>}
  </div>;
  if(media.type==="video") return <div style={s}>
    <video src={media.url} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} controls poster={media.thumbnail} preload="metadata"/>
    {media.caption&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,#000000bb)",padding:"16px 10px 8px",pointerEvents:"none"}}><span style={{fontSize:11,color:"#ffffffcc"}}>{media.caption}</span></div>}
  </div>;
  return null;
}

function PhotoBattle({dispute,voted,onVote,T}) {
  const [hov,setHov]=useState(null);
  const tot=totalVotes(dispute)||1;
  return <div style={{marginBottom:10}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      {dispute.options.map(o=>{const pct=Math.round((o.votes||0)/tot*100);const isW=dispute.verdict?.winner===o.id;return(
        <div key={o.id} onClick={()=>!voted&&onVote(o.id)} onMouseEnter={()=>!voted&&setHov(o.id)} onMouseLeave={()=>setHov(null)}
          style={{borderRadius:12,overflow:"hidden",border:`2px solid ${isW?o.color:voted===o.id?o.color:hov===o.id?o.color+"88":T.border}`,cursor:voted?"default":"pointer",transition:"all .2s",position:"relative"}}>
          {o.media?<img src={o.media.url} alt={o.label} style={{width:"100%",aspectRatio:"4/3",objectFit:"cover",display:"block"}}/>
            :<div style={{aspectRatio:"4/3",background:T.surface3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>📸</div>}
          {!voted&&hov===o.id&&<div style={{position:"absolute",inset:0,background:o.color+"44",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18,color:"#fff",fontWeight:900,textShadow:"0 2px 8px #000"}}>Vote</span></div>}
          {isW&&<div style={{position:"absolute",top:6,right:6,background:o.color,borderRadius:20,padding:"2px 8px",fontSize:10,color:"#fff",fontWeight:700}}>🏆</div>}
          <div style={{background:voted?o.color+"cc":T.surface+"cc",padding:"6px 8px",display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:10,color:voted?"#fff":T.text3,fontWeight:600}}>{o.label}</span>
            {voted&&<span style={{fontSize:12,color:"#fff",fontWeight:900}}>{pct}%</span>}
          </div>
        </div>);
      })}
    </div>
  </div>;
}

function MediaViewer({media,title,onClose}) {
  return <div style={{position:"fixed",inset:0,background:"#000000ee",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
    <div style={{width:"100%",maxWidth:760}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:13,color:"#fff",fontWeight:600}}>{title}</span><button onClick={onClose} style={{background:"none",border:"none",color:"#fff",fontSize:22,cursor:"pointer"}}>✕</button></div>
      <img src={media.url} alt={media.caption||""} style={{width:"100%",maxHeight:"80vh",objectFit:"contain",borderRadius:12,display:"block"}}/>
    </div>
  </div>;
}

// ─── SPONSORED CARD ───────────────────────────────────────────────────────────
function SponsoredCard({d,onVote,T}) {
  const [voted,setVoted]=useState(null);
  const tot=totalVotes(d)||1;
  return <div style={{background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:18,marginBottom:14,overflow:"hidden"}}>
    <div style={{background:`linear-gradient(90deg,${T.accent}18,transparent)`,padding:"5px 14px",display:"flex",gap:6,alignItems:"center"}}>
      <span style={{fontSize:16}}>{d.brandEmoji}</span>
      <span style={{fontSize:10,color:T.accent,fontWeight:700}}>SPONSORED · {d.brand}</span>
      <span style={{fontSize:9,color:T.text4,marginLeft:"auto",border:`1px solid ${T.border2}`,borderRadius:20,padding:"1px 6px"}}>Ad</span>
    </div>
    <div style={{padding:"10px 14px"}}>
      <h3 style={{margin:"0 0 10px",fontSize:15,color:T.text,fontFamily:"Georgia,serif",lineHeight:1.4}}>{d.title}</h3>
      <VoteBar options={d.options||[]} T={T}/>
      {!voted?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
        {(d.options||[]).map(o=><button key={o.id} onClick={()=>{setVoted(o.id);onVote&&onVote(d.id,o.id);}} style={{background:T.surface2,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"9px 11px",color:T.text3,fontSize:12,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=o.color;e.currentTarget.style.color=o.color;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.text3;}}>{o.label}</button>)}
      </div>:<div style={{padding:"8px 0",textAlign:"center",fontSize:13,color:T.green,fontWeight:600}}>✅ Thanks for voting!</div>}
    </div>
  </div>;
}

// ─── WELCOME SCREEN ───────────────────────────────────────────────────────────
function WelcomeScreen({onDone,T}) {
  const [step,setStep]=useState(0);
  const steps=[
    {emoji:"⚖️",title:"Welcome to SettleIt",body:"The app where you settle debates once and for all — with Solomon, our AI judge, as the final word.",cta:"Let's go →"},
    {emoji:"🗳️",title:"Vote on Disputes",body:"Pick a side on anything. Hot dogs, movies, life choices. Your vote matters.",cta:"Got it →"},
    {emoji:"👑",title:"Meet Solomon",body:"When enough votes are in, tap \"Ask Solomon\" and our AI judge delivers a definitive, witty verdict. No appeals.",cta:"Love it →"},
    {emoji:"🌶️",title:"Start Your Own",body:"Post any dispute — text, photo, video, or a photo battle. The community decides.",cta:"Start settling →"},
  ];
  const s=steps[step];
  return <div style={{position:"fixed",inset:0,background:T.bg,zIndex:900,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
    <div style={{width:"100%",maxWidth:360,textAlign:"center"}}>
      <div style={{display:"flex",justifyContent:"center",gap:7,marginBottom:40}}>
        {steps.map((_,i)=><div key={i} style={{width:i===step?24:7,height:7,borderRadius:4,background:i===step?T.accent:T.border2,transition:"all .3s"}}/>)}
      </div>
      <div style={{fontSize:72,marginBottom:20}}>{s.emoji}</div>
      <div style={{fontSize:26,fontWeight:900,color:T.text,fontFamily:"Georgia,serif",marginBottom:14,lineHeight:1.3}}>{s.title}</div>
      <div style={{fontSize:16,color:T.text3,lineHeight:1.7,marginBottom:48}}>{s.body}</div>
      <button onClick={()=>step<steps.length-1?setStep(p=>p+1):onDone()} style={{width:"100%",background:T.accent,border:"none",borderRadius:16,padding:"16px",color:T.bg,fontWeight:900,fontSize:17,cursor:"pointer",boxShadow:`0 4px 20px ${T.accent}44`}}>{s.cta}</button>
      {step===0?<button onClick={onDone} style={{marginTop:14,background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:13}}>Skip intro</button>:<button onClick={()=>setStep(p=>p-1)} style={{marginTop:14,background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:13}}>← Back</button>}
    </div>
  </div>;
}

// ─── NOTIFICATION CENTER ─────────────────────────────────────────────────────
function NotifCenter({notifs,setNotifs,prefs,setPrefs,onClose,T,markRead}) {
  const [tab,setTab]=useState("all");
  const unread=notifs.filter(n=>!n.is_read&&!n.read).length;
  const shown=tab==="unread"?notifs.filter(n=>!n.is_read&&!n.read):notifs;
  const typeColors={verdict:T.accent,comment:T.blue,mention:T.purple,vote:T.green,follow:T.teal,badge:T.orange};
  return <div style={{position:"fixed",inset:0,background:"#00000099",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:T.bg,border:`1px solid ${T.border2}`,borderRadius:20,width:"100%",maxWidth:440,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:T.shadow}}>
      <div style={{padding:"15px 16px 11px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:16,fontWeight:900,color:T.text}}>Notifications{unread>0&&<span style={{marginLeft:8,background:T.red,color:"#fff",borderRadius:20,padding:"2px 7px",fontSize:11}}>{unread}</span>}</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setNotifs(p=>p.map(n=>({...n,read:true,is_read:true})));markRead?.();}} style={{background:"none",border:"none",color:T.text4,fontSize:11,cursor:"pointer"}}>Mark all read</button>
          <button onClick={()=>setTab(t=>t==="all"?"prefs":"all")} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:20,padding:"3px 9px",color:T.text3,fontSize:11,cursor:"pointer"}}>⚙️</button>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.text4,fontSize:18,cursor:"pointer"}}>✕</button>
        </div>
      </div>
      {tab==="prefs"?<div style={{overflowY:"auto",flex:1,padding:"14px 16px"}}>
        <div style={{fontSize:11,color:T.text4,letterSpacing:.8,marginBottom:12}}>NOTIFICATION PREFERENCES</div>
        {[["verdict","⚖️ Solomon's verdict"],["comment","💬 New comments"],["mention","@ Mentions"],["vote","🗳️ Vote milestones"],["follow","👋 New followers"],["badge","🏅 Badges"]].map(([type,label])=>(
          <div key={type} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:13,color:T.text}}>{label}</span>
            <button onClick={()=>setPrefs(p=>({...p,[type]:!p[type]}))} style={{width:42,height:22,borderRadius:11,background:prefs[type]!==false?T.accent:T.border2,border:"none",cursor:"pointer",position:"relative"}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:prefs[type]!==false?23:3,transition:"left .2s",boxShadow:"0 1px 3px #0004"}}/>
            </button>
          </div>
        ))}
      </div>:<>
        <div style={{display:"flex",padding:"8px 14px",gap:6,borderBottom:`1px solid ${T.border}`}}>
          {["all","unread"].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:tab===t?T.accentBg:T.surface2,border:`1px solid ${tab===t?T.accent:T.border}`,borderRadius:20,padding:"3px 11px",color:tab===t?T.accent:T.text3,fontSize:11,cursor:"pointer",textTransform:"capitalize"}}>{t}</button>)}
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {shown.length===0&&<div style={{textAlign:"center",padding:"30px",color:T.text4,fontSize:13}}>All caught up! 🎉</div>}
          {shown.map((n,i)=>(
            <div key={n.id||i} onClick={()=>setNotifs(p=>p.map(x=>(x.id||x)===n.id?{...x,read:true,is_read:true}:x))} style={{display:"flex",gap:12,padding:"13px 16px",borderBottom:`1px solid ${T.border}`,cursor:"pointer",background:(n.is_read||n.read)?"transparent":T.accentBg}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:(typeColors[n.type]||T.text4)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{n.icon||"🔔"}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:(n.is_read||n.read)?400:700,color:T.text}}>{n.title}</div>
                <div style={{fontSize:11,color:T.text3,marginTop:2}}>{n.body}</div>
                <div style={{fontSize:10,color:T.text4,marginTop:3}}>{n.time||n.created_at}</div>
              </div>
              {!(n.is_read||n.read)&&<div style={{width:8,height:8,borderRadius:"50%",background:T.accent,marginTop:4,flexShrink:0}}/>}
            </div>
          ))}
        </div>
      </>}
    </div>
  </div>;
}

// ─── EDIT PROFILE ─────────────────────────────────────────────────────────────
function EditProfile({profile,onSave,onClose,T}) {
  const [name,setName]=useState(profile.name||"");
  const [bio,setBio]=useState(profile.bio||"");
  const [avatar,setAvatar]=useState(profile.avatar||"🫵");
  const [country,setCountry]=useState(profile.country||"🇺🇸 USA");
  const [isPrivate,setIsPrivate]=useState(profile.isPrivate||false);
  const [safeMode,setSafeMode]=useState(profile.safeMode||false);
  return <div style={{position:"fixed",inset:0,background:"#00000099",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:T.bg,border:`1px solid ${T.border2}`,borderRadius:20,padding:24,width:"100%",maxWidth:440,maxHeight:"92vh",overflowY:"auto",boxShadow:T.shadow}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><div style={{fontSize:16,fontWeight:900,color:T.text,fontFamily:"Georgia,serif"}}>Edit Profile</div><button onClick={onClose} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:18}}>✕</button></div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,color:T.text4,letterSpacing:.8,marginBottom:8}}>AVATAR</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:8}}>{AVATAR_OPTIONS.map(a=><button key={a} onClick={()=>setAvatar(a)} style={{width:40,height:40,borderRadius:"50%",background:avatar===a?T.accentBg:T.surface2,border:`2px solid ${avatar===a?T.accent:T.border}`,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{a}</button>)}</div>
        <div style={{display:"flex",alignItems:"center",gap:10,background:T.accentBg,border:`1px solid ${T.accentBorder}`,borderRadius:12,padding:"10px 14px"}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:T.surface2,border:`2px solid ${T.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{avatar}</div>
          <div><div style={{fontSize:13,fontWeight:700,color:T.text}}>{name||"Your Name"}</div><div style={{fontSize:11,color:T.text4,marginTop:1}}>Preview</div></div>
        </div>
      </div>
      {[["DISPLAY NAME",name,setName,"Your name...",40],["BIO",bio,setBio,"Tell the world who you are...",120]].map(([label,val,set,ph,max])=>(
        <div key={label} style={{marginBottom:12}}>
          <div style={{fontSize:10,color:T.text4,letterSpacing:.8,marginBottom:5}}>{label}</div>
          <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} maxLength={max} style={{width:"100%",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"9px 11px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          <div style={{fontSize:10,color:T.text4,textAlign:"right",marginTop:2}}>{val.length}/{max}</div>
        </div>
      ))}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:10,color:T.text4,letterSpacing:.8,marginBottom:6}}>COUNTRY</div>
        <select value={country} onChange={e=>setCountry(e.target.value)} style={{width:"100%",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"9px 11px",color:T.text,fontSize:13,outline:"none"}}>{COUNTRY_OPTIONS.map(c=><option key={c} value={c}>{c}</option>)}</select>
      </div>
      {[["🔒 Private Profile","Only followers see your disputes",isPrivate,setIsPrivate],["🛡️ Safe Mode","Filter potentially sensitive content",safeMode,setSafeMode]].map(([title,desc,val,set])=>(
        <div key={title} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:11,padding:"10px 12px"}}>
          <button onClick={()=>set(p=>!p)} style={{width:40,height:22,borderRadius:11,background:val?T.accent:T.border2,border:"none",cursor:"pointer",position:"relative",flexShrink:0}}><div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:val?21:3,transition:"left .2s",boxShadow:"0 1px 3px #0004"}}/></button>
          <div><div style={{fontSize:12,color:T.text,fontWeight:600}}>{title}</div><div style={{fontSize:10,color:T.text4,marginTop:1}}>{desc}</div></div>
        </div>
      ))}
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={onClose} style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,borderRadius:10,padding:10,color:T.text3,cursor:"pointer",fontSize:13}}>Cancel</button>
        <button onClick={()=>onSave({name,bio,avatar,country,isPrivate,safeMode})} style={{flex:2,background:T.accent,border:"none",borderRadius:10,padding:10,color:T.bg,fontWeight:700,fontSize:13,cursor:"pointer"}}>Save Profile ✓</button>
      </div>
    </div>
  </div>;
}

// ─── REPORT MODAL ─────────────────────────────────────────────────────────────
function ReportModal({target,targetType,onSubmit,onClose,T}) {
  const [reason,setReason]=useState(""),[detail,setDetail]=useState(""),[done,setDone]=useState(false),[loading,setLoading]=useState(false);
  const submit=async()=>{if(!reason)return;setLoading(true);await new Promise(r=>setTimeout(r,700));setDone(true);setLoading(false);setTimeout(()=>{onSubmit(reason,detail);onClose();},1400);};
  return <div style={{position:"fixed",inset:0,background:"#00000099",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:T.bg,border:`1px solid ${T.border2}`,borderRadius:20,padding:24,width:"100%",maxWidth:380,boxShadow:T.shadow}} onClick={e=>e.stopPropagation()}>
      {done?<div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:40,marginBottom:10}}>✅</div><div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:6}}>Report Submitted</div><div style={{fontSize:12,color:T.text3}}>We'll review this shortly. Thanks for keeping SettleIt safe.</div></div>:<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:11,color:T.red,fontWeight:700,letterSpacing:1}}>🚩 REPORT {targetType.toUpperCase()}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:18}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {REPORT_REASONS.map(r=><button key={r} onClick={()=>setReason(r)} style={{background:reason===r?T.red+"18":T.surface2,border:`1.5px solid ${reason===r?T.red:T.border}`,borderRadius:10,padding:"9px 12px",color:reason===r?T.red:T.text3,fontSize:12,cursor:"pointer",textAlign:"left"}}>{r}</button>)}
        </div>
        <textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Additional details (optional)..." style={{width:"100%",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"9px 11px",color:T.text,fontSize:12,outline:"none",resize:"vertical",minHeight:60,boxSizing:"border-box",marginBottom:12}}/>
        <button onClick={submit} disabled={!reason||loading} style={{width:"100%",background:reason&&!loading?T.red:T.surface2,border:"none",borderRadius:10,padding:10,color:reason&&!loading?"#fff":T.text4,fontWeight:700,fontSize:13,cursor:reason&&!loading?"pointer":"default"}}>{loading?"Submitting...":"Submit Report"}</button>
      </>}
    </div>
  </div>;
}

// ─── NEW DISPUTE MODAL ────────────────────────────────────────────────────────
function NewDisputeModal({onClose,onSubmit,T}) {
  const [title,setTitle]=useState(""),[category,setCategory]=useState("🏠 Life");
  const [tags,setTags]=useState([]),[tagInput,setTagInput]=useState(""),[duration,setDuration]=useState(24),[aiTag,setAiTag]=useState(false);
  const [options,setOptions]=useState([{id:"A",label:"",color:"#e85d26"},{id:"B",label:"",color:"#2a7bd4"}]);
  const [photo,setPhoto]=useState(null),[photoPreview,setPhotoPreview]=useState(null),[uploading,setUploading]=useState(false);
  const fileRef=useRef();
  const COLORS=["#e85d26","#2a7bd4","#3dba6f","#9b6dff","#f08020","#2ab8b8"];
  const valid=title.trim()&&options.filter(o=>o.label.trim()).length>=2;
  const addTag=t=>{const t2=t.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");if(t2&&!tags.includes(t2)&&tags.length<5)setTags(p=>[...p,t2]);setTagInput("");};
  const suggestTags=async()=>{if(!title.trim())return;setAiTag(true);try{const r=await aiTags(title);setTags(p=>[...new Set([...p,...r])].slice(0,5));}catch{}setAiTag(false);};
  const pickPhoto=e=>{const f=e.target.files[0];if(!f)return;setPhoto(f);setPhotoPreview(URL.createObjectURL(f));};
  const removePhoto=()=>{setPhoto(null);setPhotoPreview(null);};
  const handleSubmit=async()=>{
    if(!valid)return;
    setUploading(true);
    let mediaUrl=null;
    // Upload photo to Supabase Storage if provided
    if(photo&&supabase){
      try{
        const ext=photo.name.split('.').pop();
        const path=`disputes/${Date.now()}.${ext}`;
        const {data,error}=await supabase.storage.from('media').upload(path,photo,{cacheControl:'3600',upsert:false});
        if(!error){
          const {data:urlData}=supabase.storage.from('media').getPublicUrl(path);
          mediaUrl=urlData.publicUrl;
        }
      }catch(e){console.error('Upload error:',e);}
    }
    setUploading(false);
    onSubmit({title,options,category,tags,duration,mediaUrl,mediaType:photo?'image':null});
  };
  return <div style={{position:"fixed",inset:0,background:"#00000099",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:14}}>
    <div style={{background:T.bg,border:`1px solid ${T.border2}`,borderRadius:20,padding:22,width:"100%",maxWidth:460,boxShadow:T.shadow,maxHeight:"94vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><div style={{fontSize:17,fontWeight:900,color:T.text,fontFamily:"Georgia,serif"}}>New Dispute</div><button onClick={onClose} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:18}}>✕</button></div>
      <div style={{marginBottom:11}}><div style={{fontSize:10,color:T.text4,marginBottom:5,letterSpacing:.8}}>CATEGORY</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{CATEGORIES.map(c=><button key={c} onClick={()=>setCategory(c)} style={{background:category===c?T.accentBg:T.surface2,border:`1px solid ${category===c?T.accent:T.border2}`,borderRadius:20,padding:"3px 9px",color:category===c?T.accent:T.text3,fontSize:10,cursor:"pointer"}}>{c}</button>)}</div></div>
      <div style={{marginBottom:8}}><div style={{fontSize:10,color:T.text4,marginBottom:5,letterSpacing:.8}}>THE DISPUTE</div><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What are people debating?" style={{width:"100%",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"9px 11px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
      {/* Photo upload */}
      <div style={{marginBottom:11}}>
        <div style={{fontSize:10,color:T.text4,marginBottom:7,letterSpacing:.8}}>ADD A PHOTO (optional)</div>
        {!photoPreview?<button onClick={()=>fileRef.current?.click()} style={{width:"100%",background:T.surface2,border:`2px dashed ${T.border2}`,borderRadius:12,padding:"16px",color:T.text4,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>📷 Tap to add a photo</button>
        :<div style={{position:"relative",borderRadius:12,overflow:"hidden",marginBottom:4}}>
          <img src={photoPreview} style={{width:"100%",maxHeight:180,objectFit:"cover",display:"block",borderRadius:12}}/>
          <button onClick={removePhoto} style={{position:"absolute",top:8,right:8,background:"#000000aa",border:"none",borderRadius:"50%",width:28,height:28,color:"#fff",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>}
        <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} style={{display:"none"}}/>
      </div>
      <div style={{marginBottom:11}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div style={{fontSize:10,color:T.text4,letterSpacing:.8}}>OPTIONS ({options.length}/6)</div><button onClick={()=>{if(options.length>=6)return;const id=String.fromCharCode(65+options.length);setOptions(p=>[...p,{id,label:"",color:COLORS[p.length%6]}]);}} style={{background:"transparent",border:`1px solid ${T.border2}`,borderRadius:20,padding:"2px 8px",color:T.text4,fontSize:10,cursor:"pointer"}}>+ Add</button></div>
        {options.map((o,i)=><div key={o.id} style={{display:"flex",gap:8,marginBottom:7,alignItems:"center"}}><div style={{width:9,height:9,borderRadius:"50%",background:o.color,flexShrink:0}}/><input value={o.label} onChange={e=>setOptions(p=>p.map((x,j)=>j===i?{...x,label:e.target.value}:x))} placeholder={`Option ${o.id}...`} style={{flex:1,background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"8px 10px",color:T.text,fontSize:12,outline:"none"}}/>{options.length>2&&<button onClick={()=>setOptions(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:14,padding:0}}>×</button>}</div>)}
      </div>
      <div style={{marginBottom:11}}><div style={{fontSize:10,color:T.text4,marginBottom:5,letterSpacing:.8}}>EXPIRY</div><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{[[1,"1h"],[6,"6h"],[24,"24h"],[48,"48h"],[72,"72h"]].map(([val,label])=><button key={val} onClick={()=>setDuration(val)} style={{background:duration===val?T.accentBg:T.surface2,border:`1px solid ${duration===val?T.accent:T.border2}`,borderRadius:20,padding:"3px 9px",color:duration===val?T.accent:T.text3,fontSize:10,cursor:"pointer"}}>⏳{label}</button>)}</div></div>
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div style={{fontSize:10,color:T.text4,letterSpacing:.8}}>TAGS</div><button onClick={suggestTags} disabled={aiTag||!title.trim()} style={{background:"transparent",border:`1px solid ${T.accentBorder}`,borderRadius:20,padding:"1px 7px",color:T.accent,fontSize:9,cursor:title.trim()?"pointer":"default",opacity:title.trim()?1:.4}}>{aiTag?"...":"⚡ AI Tags"}</button></div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>{tags.map(t=><span key={t} style={{background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:20,padding:"2px 7px",fontSize:10,color:T.text3,display:"flex",alignItems:"center",gap:3}}>#{t}<button onClick={()=>setTags(p=>p.filter(x=>x!==t))} style={{background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:11,padding:0}}>×</button></span>)}</div>
        <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();addTag(tagInput);}}} placeholder="Tag + Enter..." style={{width:"100%",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"7px 10px",color:T.text,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex",gap:8}}><button onClick={onClose} style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,borderRadius:9,padding:9,color:T.text3,cursor:"pointer",fontSize:13}}>Cancel</button><button onClick={handleSubmit} disabled={!valid||uploading} style={{flex:2,background:valid&&!uploading?T.red:T.surface2,border:"none",borderRadius:9,padding:9,color:valid&&!uploading?"#fff":T.text4,cursor:valid&&!uploading?"pointer":"default",fontSize:13,fontWeight:700}}>{uploading?"Uploading...":"Post Dispute →"}</button></div>
    </div>
  </div>;
}

// ─── DISPUTE CARD ─────────────────────────────────────────────────────────────
function DisputeCard({d,onSettle,onVote,onAddComment,onReact,onBookmark,following,onFollow,onOpenProfile,highlight,swipeMode,T,onReport,currentUserId,previousVote}) {
  const [voted,setVoted]=useState(previousVote||null),[settling,setSettling]=useState(false);
  const [expanded,setExpanded]=useState(false),[commentText,setCommentText]=useState("");
  const [aiComLoad,setAiComLoad]=useState(false),[liked,setLiked]=useState([]);
  const [coachData,setCoachData]=useState(null),[showCoach,setShowCoach]=useState(false);
  const [predictData,setPredictData]=useState(null),[showPredict,setShowPredict]=useState(false);
  const [showWarning,setShowWarning]=useState(hasWarn(d));
  const [reportTarget,setReportTarget]=useState(null);
  const [fullMedia,setFullMedia]=useState(null);
  const ref=useRef();
  useEffect(()=>{if(highlight)ref.current?.scrollIntoView({behavior:"smooth",block:"center"});},[highlight]);
  const expired=Date.now()>d.expiresAt;
  const tot=totalVotes(d)||1;
  const handleVote=side=>{if(voted||expired)return;setVoted(side);onVote(d.id,side);};
  const handleSettle=async()=>{setSettling(true);await onSettle(d);setSettling(false);};
  const submitComment=()=>{if(!commentText.trim())return;onAddComment(d.id,{user:currentUserId||"you",text:commentText,likes:0,time:"just now",isAI:false,reported:false});setCommentText("");};
  const getAiCom=async()=>{setAiComLoad(true);try{const m=await aiComment(d);onAddComment(d.id,{user:"Solomon",text:m,likes:0,time:"just now",isAI:true,reported:false});}catch{}setAiComLoad(false);};
  const loadCoach=async()=>{if(coachData){setShowCoach(p=>!p);return;}try{const r=await aiCoach(d);setCoachData(r);}catch{setCoachData({argA:"Strong case for this position.",argB:"Compelling counter-argument.",tip:"Focus on concrete evidence."});}setShowCoach(true);};
  const loadPredict=async()=>{if(predictData){setShowPredict(p=>!p);return;}try{const r=await aiPredict(d);setPredictData(r);}catch{setPredictData({predictedWinner:d.options[0]?.id,confidence:62,reasoning:"Slight momentum toward Side A.",swing:"stable"});}setShowPredict(true);};

  const cardContent=<div ref={ref} style={{background:highlight?T.accentBg:T.surface,border:`1.5px solid ${highlight?T.accentBorder:d.hotStreak?T.red+"44":T.border}`,borderRadius:18,marginBottom:14,overflow:"hidden",transition:"all .3s"}}
    onMouseEnter={e=>{if(!highlight&&!d.hotStreak)e.currentTarget.style.borderColor=T.border2;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=highlight?T.accentBorder:d.hotStreak?T.red+"44":T.border;}}>
    {d.hotStreak&&<div style={{background:`linear-gradient(90deg,${T.red}18,transparent)`,padding:"5px 14px",fontSize:10,color:T.red,fontWeight:700,display:"flex",gap:5,alignItems:"center"}}><span style={{animation:"pulse 1s infinite",display:"inline-block"}}>🔥</span>HOT STREAK</div>}
    {showWarning?<div style={{padding:"14px"}}><div style={{background:T.surface2,border:`1px solid ${T.orange}44`,borderRadius:14,padding:"20px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>⚠️</div><div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:6}}>Content Warning</div><div style={{fontSize:12,color:T.text3,marginBottom:14}}>{d.contentWarning||"This dispute may contain sensitive content."}</div><button onClick={()=>setShowWarning(false)} style={{background:T.orange,border:"none",borderRadius:20,padding:"7px 20px",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>Show anyway</button></div></div>:<>
      <div style={{padding:"12px 14px 8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:5}}>
        <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
          <div style={{cursor:"pointer"}} onClick={()=>onOpenProfile&&onOpenProfile(d.author)}><Avatar avatar={d.authorAvatar} verified={d.authorVerified} size={24} T={T}/></div>
          <span style={{fontSize:11,color:T.text4,cursor:"pointer"}} onClick={()=>onOpenProfile&&onOpenProfile(d.author)}>@{d.author}</span>
          {d.author!==currentUserId&&d.author!=="you"&&<button onClick={()=>onFollow(d.author)} style={{background:following.includes(d.author)?T.green+"18":T.surface2,border:`1px solid ${following.includes(d.author)?T.green+"44":T.border}`,borderRadius:20,padding:"1px 7px",color:following.includes(d.author)?T.green:T.text4,fontSize:9,cursor:"pointer"}}>{following.includes(d.author)?"✓":"+"} Follow</button>}
          <span style={{fontSize:10,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:20,padding:"1px 6px",color:T.text3}}>{d.category}</span>
          {d.type==="image"&&<span style={{fontSize:9,color:T.teal,border:`1px solid ${T.teal}33`,borderRadius:20,padding:"1px 6px",fontWeight:700}}>📷 Photo</span>}
          {d.type==="image_vs_image"&&<span style={{fontSize:9,color:T.accent,border:`1px solid ${T.accentBorder}`,borderRadius:20,padding:"1px 6px",fontWeight:700}}>⚔️ Battle</span>}
          {d.type==="video"&&<span style={{fontSize:9,color:T.red,border:`1px solid ${T.red}33`,borderRadius:20,padding:"1px 6px",fontWeight:700}}>🎬 Video</span>}
          <span style={{fontSize:10,color:expired?T.text5:T.text4}}>⏳{fmtTime(d.expiresAt)}</span>
        </div>
        <div style={{display:"flex",gap:4}}>
          {d.settled&&<span style={{fontSize:9,color:T.green,border:`1px solid ${T.green}33`,padding:"1px 5px",borderRadius:20}}>⚖️</span>}
          <button onClick={loadCoach} style={{background:showCoach?T.purple+"18":"none",border:`1px solid ${showCoach?T.purple:T.border2}`,borderRadius:20,padding:"1px 6px",color:T.purple,fontSize:9,cursor:"pointer"}} title="Solomon Coaches">🎓</button>
          <button onClick={loadPredict} style={{background:showPredict?T.purple+"18":"none",border:`1px solid ${showPredict?T.purple:T.border2}`,borderRadius:20,padding:"1px 6px",color:T.purple,fontSize:9,cursor:"pointer"}} title="Solomon Predicts">🔮</button>
          <button onClick={()=>onBookmark(d.id)} style={{background:"none",border:`1px solid ${T.border2}`,borderRadius:20,padding:"1px 6px",color:d.bookmarked?T.accent:T.text4,fontSize:9,cursor:"pointer"}}>🔖</button>
          <button onClick={()=>setReportTarget({text:d.title,type:"dispute"})} style={{background:"none",border:`1px solid ${T.border2}`,borderRadius:20,padding:"1px 6px",color:T.text5,fontSize:9,cursor:"pointer"}}>🚩</button>
        </div>
      </div>
      {d.tags?.length>0&&<div style={{padding:"0 14px 7px",display:"flex",gap:4,flexWrap:"wrap"}}>{d.tags.map(t=><span key={t} style={{fontSize:9,color:T.text4,border:`1px solid ${T.border2}`,borderRadius:20,padding:"1px 5px"}}>#{t}</span>)}</div>}
      <div style={{padding:"0 14px 10px"}}><h3 style={{margin:0,fontSize:15,color:T.text,lineHeight:1.4,fontFamily:"Georgia,serif"}}>{d.title}</h3></div>
      {/* Coach */}
      {showCoach&&coachData&&<div style={{margin:"0 14px 10px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}>
        <div style={{fontSize:10,color:T.purple,fontWeight:700,marginBottom:7,letterSpacing:1}}>🎓 SOLOMON'S COACHING</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:7}}>
          {[[d.options[0],coachData.argA,T.red],[d.options[1],coachData.argB,T.blue]].filter(([o])=>o).map(([opt,arg,color])=><div key={opt.id} style={{background:color+"10",borderRadius:8,padding:"8px 9px"}}><div style={{fontSize:9,color,fontWeight:700,marginBottom:3}}>Side {opt.id}</div><div style={{fontSize:11,color:T.text2,lineHeight:1.5}}>{arg}</div></div>)}
        </div>
        {coachData.tip&&<div style={{fontSize:11,color:T.accent}}>💡 {coachData.tip}</div>}
      </div>}
      {/* Predict */}
      {showPredict&&predictData&&<div style={{margin:"0 14px 10px",background:T.purple+"12",border:`1px solid ${T.purple}33`,borderRadius:10,padding:"10px 12px"}}>
        <div style={{fontSize:10,color:T.purple,fontWeight:700,marginBottom:4,letterSpacing:1}}>🔮 SOLOMON PREDICTS · {predictData.confidence}% confident</div>
        <div style={{fontSize:12,color:T.text2}}>Winner: <strong style={{color:d.options.find(o=>o.id===predictData.predictedWinner)?.color||T.purple}}>{d.options.find(o=>o.id===predictData.predictedWinner)?.label}</strong></div>
        <div style={{fontSize:11,color:T.text3,marginTop:3}}>{predictData.reasoning}{predictData.swing!=="stable"&&<span style={{color:T.orange}}> · Trending {predictData.swing}</span>}</div>
      </div>}
      {/* Media */}
      {d.type==="image_vs_image"&&<div style={{padding:"0 14px 10px"}}><PhotoBattle dispute={d} voted={voted} onVote={handleVote} T={T}/></div>}
      {d.media&&d.type!=="image_vs_image"&&<div style={{padding:"0 14px 10px",position:"relative"}}>
        <MediaRenderer media={d.media} T={T} onClick={d.media.type==="image"?()=>setFullMedia(d.media):undefined}/>
        {d.media.type==="image"&&<button onClick={()=>setFullMedia(d.media)} style={{position:"absolute",top:18,right:20,background:"#000000aa",border:"none",borderRadius:20,padding:"3px 9px",color:"#fff",fontSize:10,cursor:"pointer"}}>⤢ Full</button>}
      </div>}
      {/* Votes */}
      {d.type!=="image_vs_image"&&<div style={{padding:"0 14px 12px"}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:8,marginBottom:4}}>
          <div style={{flex:1}}><VoteBar options={d.options||[]} T={T}/></div>
          {d.votesOverTime?.length>2&&<Sparkline data={d.votesOverTime} T={T}/>}
        </div>
        {!voted&&!expired&&<div style={{display:"grid",gridTemplateColumns:(d.options||[]).length===2?"1fr 1fr":`repeat(${Math.min((d.options||[]).length,3)},1fr)`,gap:8,marginTop:6}}>
          {(d.options||[]).map(o=><button key={o.id} onClick={()=>handleVote(o.id)} style={{background:T.surface2,border:`1.5px solid ${d.verdict?.winner===o.id?o.color:T.border}`,borderRadius:10,padding:"8px 10px",color:d.verdict?.winner===o.id?o.color:T.text3,fontSize:11,cursor:"pointer",textAlign:"left",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background=o.color+"18";e.currentTarget.style.borderColor=o.color;}} onMouseLeave={e=>{e.currentTarget.style.background=T.surface2;e.currentTarget.style.borderColor=d.verdict?.winner===o.id?o.color:T.border;}}>{d.verdict?.winner===o.id&&"🏆 "}{o.label}</button>)}
        </div>}
        {voted&&<div style={{display:"grid",gridTemplateColumns:(d.options||[]).length===2?"1fr 1fr":`repeat(${Math.min((d.options||[]).length,3)},1fr)`,gap:8,marginTop:6}}>
          {(d.options||[]).map(o=><div key={o.id} style={{background:voted===o.id?o.color+"18":T.surface2,border:`1.5px solid ${d.verdict?.winner===o.id?o.color:voted===o.id?o.color:T.border}`,borderRadius:10,padding:"8px 10px",color:voted===o.id?o.color:T.text3,fontSize:11}}>{d.verdict?.winner===o.id&&"🏆 "}{o.label} <span style={{opacity:.6}}>({Math.round((o.votes||0)/tot*100)}%)</span></div>)}
        </div>}
        {swipeMode&&!voted&&!expired&&<div style={{textAlign:"center",fontSize:10,color:T.text4,marginTop:8}}>← Swipe for Side B · Swipe for Side A →</div>}
      </div>}
      {/* Verdict */}
      {d.verdict&&<div style={{margin:"0 14px 12px",background:T.surface2,border:`1px solid ${T.border}`,borderLeft:`3px solid ${T.accent}`,borderRadius:10,padding:"10px 12px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{fontSize:10,color:T.accent,fontWeight:700,letterSpacing:1}}>⚖️ SOLOMON'S VERDICT · {d.verdict.confidence}</div>
          <SolomonVoiceButton verdict={d.verdict} title={d.title} T={T}/>
        </div>
        <p style={{margin:0,fontSize:12,color:T.text2,lineHeight:1.6}}>{d.verdict.reasoning}</p>
        {d.verdict.funFact&&<p style={{margin:"5px 0 0",fontSize:10,color:T.text4,fontStyle:"italic"}}>💡 {d.verdict.funFact}</p>}
      </div>}
      {/* Footer */}
      <div style={{padding:"8px 14px 11px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:5}}>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {Object.entries(d.reactions||{}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([e,c])=>(
            <button key={e} onClick={()=>onReact(d.id,e,1)} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:20,padding:"2px 6px",fontSize:10,cursor:"pointer",color:T.text3,display:"flex",alignItems:"center",gap:2}}>{e}<span style={{fontSize:9}}>{c}</span></button>
          ))}
          <select onChange={e=>{if(e.target.value){onReact(d.id,e.target.value,1);e.target.value="";}}} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:20,padding:"2px 5px",fontSize:10,cursor:"pointer",color:T.text4,outline:"none"}}><option value="">+😄</option>{REACTIONS.map(e=><option key={e} value={e}>{e}</option>)}</select>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          <button onClick={()=>setExpanded(p=>!p)} style={{background:"none",border:"none",color:T.text4,fontSize:10,cursor:"pointer",padding:0}}>💬{(d.comments||[]).length} {expanded?"▲":"▼"}</button>
          {!d.settled&&!expired&&<button onClick={handleSettle} disabled={settling} style={{background:"transparent",border:`1px solid ${T.accent}`,borderRadius:20,padding:"2px 9px",color:T.accent,fontSize:10,cursor:settling?"default":"pointer",fontWeight:600,opacity:settling?.6:1,display:"flex",alignItems:"center",gap:3}}>{settling?<><span style={{display:"inline-block",width:8,height:8,border:`2px solid ${T.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>Solomon is thinking...</>:"⚖️ Ask Solomon"}</button>}
        </div>
      </div>
      {/* Comments */}
      {expanded&&<div style={{padding:"0 14px 12px",borderTop:`1px solid ${T.border}`}}>
        <div style={{paddingTop:10}}>
          {(d.comments||[]).filter(c=>!c.reported&&!c.is_removed).map(c=><div key={c.id} style={{display:"flex",gap:7,marginBottom:10}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:T.surface2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{c.isAI||c.is_ai?"👑":"🫵"}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                <span style={{fontSize:11,fontWeight:700,color:T.text2}}>{c.user||c.username||"User"}</span>
                {(c.isAI||c.is_ai)&&<span style={{fontSize:9,color:T.accent,border:`1px solid ${T.accentBorder}`,borderRadius:10,padding:"1px 4px"}}>Solomon</span>}
                <span style={{fontSize:10,color:T.text5,marginLeft:"auto"}}>{c.time||c.created_at}</span>
                <button onClick={()=>setReportTarget({text:c.text,type:"comment",id:c.id})} style={{background:"none",border:"none",color:T.text5,fontSize:9,cursor:"pointer"}}>🚩</button>
              </div>
              <p style={{margin:0,fontSize:12,color:T.text3,lineHeight:1.5}}>{c.text}</p>
              <button onClick={()=>setLiked(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])} style={{background:"none",border:"none",color:liked.includes(c.id)?T.red:T.text4,fontSize:10,cursor:"pointer",padding:"2px 0",marginTop:1}}>♥{(c.likes||c.like_count||0)+(liked.includes(c.id)?1:0)}</button>
            </div>
          </div>)}
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:T.surface2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🫵</div>
            <input value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitComment()} placeholder="Add a comment..." style={{flex:1,background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:20,padding:"6px 10px",color:T.text,fontSize:12,outline:"none"}}/>
            <button onClick={submitComment} style={{background:T.red,border:"none",borderRadius:20,padding:"6px 10px",color:"#fff",fontSize:12,cursor:"pointer",fontWeight:700}}>→</button>
          </div>
          <button onClick={getAiCom} disabled={aiComLoad} style={{marginTop:6,marginLeft:28,background:"transparent",border:`1px solid ${T.border2}`,borderRadius:20,padding:"3px 9px",color:T.accent,fontSize:10,cursor:aiComLoad?"default":"pointer",opacity:aiComLoad?.5:1}}>{aiComLoad?"Solomon is thinking...":"⚖️ Solomon's Take"}</button>
        </div>
      </div>}
    </>}
    {reportTarget&&<ReportModal target={reportTarget.text} targetType={reportTarget.type} onSubmit={(reason,detail)=>{onReport&&onReport(d.id,reportTarget);}} onClose={()=>setReportTarget(null)} T={T}/>}
    {fullMedia&&<MediaViewer media={fullMedia} title={d.title} onClose={()=>setFullMedia(null)}/>}
  </div>;

  return swipeMode
    ?<SwipeCard onVoteA={()=>handleVote(d.options[0]?.id)} onVoteB={()=>handleVote(d.options[1]?.id)} T={T}>{cardContent}</SwipeCard>
    :cardContent;
}

// ─── EXPLORE PAGE ─────────────────────────────────────────────────────────────
function ExplorePage({disputes,onOpenDispute,onTagClick,T}) {
  const [search,setSearch]=useState(""),[catFilter,setCatFilter]=useState("🔥 All"),[sortBy,setSortBy]=useState("votes"),[onlyOpen,setOnlyOpen]=useState(false);
  const trending=useMemo(()=>[...disputes].sort((a,b)=>totalVotes(b)-totalVotes(a)),[disputes]);
  const rising=useMemo(()=>[...disputes].filter(d=>!d.settled).sort((a,b)=>b.id-a.id).slice(0,4),[disputes]);
  const tagCounts=useMemo(()=>{const c={};disputes.forEach(d=>d.tags?.forEach(t=>{c[t]=(c[t]||0)+totalVotes(d);}));return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,18);},[disputes]);
  const maxTag=tagCounts[0]?.[1]||1;
  const results=useMemo(()=>{if(!search.trim()&&catFilter==="🔥 All"&&!onlyOpen)return[];return disputes.filter(d=>{const sq=!search.trim()||[d.title,...(d.options||[]).map(o=>o.label),d.author,...(d.tags||[])].some(s=>s.toLowerCase().includes(search.toLowerCase()));const cat=catFilter==="🔥 All"||d.category===catFilter;const open=!onlyOpen||!d.settled;return sq&&cat&&open;}).sort((a,b)=>sortBy==="votes"?totalVotes(b)-totalVotes(a):sortBy==="new"?b.id-a.id:(b.settled?1:0)-(a.settled?1:0));},[disputes,search,catFilter,onlyOpen,sortBy]);
  return <div style={{maxWidth:660,margin:"0 auto",padding:"12px 10px 80px"}}>
    <div style={{position:"relative",marginBottom:12}}>
      <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:T.text4,pointerEvents:"none"}}>🔍</span>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search disputes, topics, users..." style={{width:"100%",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:20,padding:"10px 14px 10px 36px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
      {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:16}}>✕</button>}
    </div>
    <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:10,paddingBottom:4}}>
      {CATEGORIES.map(c=><button key={c} onClick={()=>setCatFilter(c)} style={{background:catFilter===c?T.accentBg:T.surface2,border:`1px solid ${catFilter===c?T.accent:T.border}`,borderRadius:20,padding:"3px 10px",color:catFilter===c?T.accent:T.text3,fontSize:10,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{c}</button>)}
    </div>
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
      {[["votes","🔥 Top"],["new","✨ New"],["settled","⚖️ Settled"]].map(([val,label])=><button key={val} onClick={()=>setSortBy(val)} style={{background:sortBy===val?T.accentBg:T.surface2,border:`1px solid ${sortBy===val?T.accent:T.border}`,borderRadius:20,padding:"3px 10px",color:sortBy===val?T.accent:T.text3,fontSize:10,cursor:"pointer"}}>{label}</button>)}
      <button onClick={()=>setOnlyOpen(p=>!p)} style={{background:onlyOpen?T.green+"18":T.surface2,border:`1px solid ${onlyOpen?T.green:T.border}`,borderRadius:20,padding:"3px 10px",color:onlyOpen?T.green:T.text3,fontSize:10,cursor:"pointer"}}>🔴 Open only</button>
    </div>
    {results.length>0&&<><div style={{fontSize:10,color:T.text4,letterSpacing:.8,marginBottom:10}}>{results.length} RESULTS</div>
      {results.map(d=><div key={d.id} onClick={()=>onOpenDispute(d.id)} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"12px 14px",marginBottom:10,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.border2} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
        <div style={{fontSize:13,color:T.text,fontFamily:"Georgia,serif",lineHeight:1.4,marginBottom:6}}>{d.title}</div>
        <VoteBar options={d.options||[]} T={T}/>
        <div style={{display:"flex",gap:10,marginTop:5,fontSize:10,color:T.text4}}><span>{d.category}</span><span>·</span><span>{fmtNum(totalVotes(d))} votes</span><span>·</span><span>@{d.author}</span><span style={{marginLeft:"auto",color:d.settled?T.green:T.red}}>{d.settled?"⚖️ Settled":"🔴 Open"}</span></div>
        <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>{d.tags?.map(t=><span key={t} onClick={e=>{e.stopPropagation();onTagClick(t);}} style={{fontSize:9,color:T.text4,border:`1px solid ${T.border2}`,borderRadius:20,padding:"1px 6px",cursor:"pointer"}}>#{t}</span>)}</div>
      </div>)}
    </>}
    {!search.trim()&&catFilter==="🔥 All"&&!onlyOpen&&<>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:10,color:T.text4,letterSpacing:.8,marginBottom:10}}>🔥 TRENDING NOW</div>
        {trending.slice(0,3).map((d,i)=><div key={d.id} onClick={()=>onOpenDispute(d.id)} style={{display:"flex",gap:12,padding:"10px 12px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,marginBottom:8,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.border2} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          <span style={{fontSize:i===0?20:14,width:26,textAlign:"center",color:["#f0c040","#aaa","#cd7f32"][i],fontWeight:900}}>#{i+1}</span>
          <div style={{flex:1}}><div style={{fontSize:12,color:T.text,fontFamily:"Georgia,serif",lineHeight:1.3}}>{d.title}</div><div style={{fontSize:10,color:T.text4,marginTop:3}}>{fmtNum(totalVotes(d))} votes · {d.category}</div></div>
        </div>)}
      </div>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:10,color:T.text4,letterSpacing:.8,marginBottom:10}}>⬆️ RISING STARS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {rising.map(d=><div key={d.id} onClick={()=>onOpenDispute(d.id)} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"11px 12px",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.border2} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <div style={{fontSize:12,color:T.text,lineHeight:1.3,marginBottom:6}}>{d.title.slice(0,40)}{d.title.length>40?"...":""}</div>
            <div style={{fontSize:10,color:T.text4}}>{fmtNum(totalVotes(d))} votes</div>
          </div>)}
        </div>
      </div>
      <div>
        <div style={{fontSize:10,color:T.text4,letterSpacing:.8,marginBottom:10}}># TRENDING TAGS</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {tagCounts.map(([tag,count])=>{const size=10+Math.round(count/maxTag*5),op=.5+count/maxTag*.5;return<button key={tag} onClick={()=>onTagClick(tag)} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:20,padding:`3px ${7+Math.round(count/maxTag*5)}px`,fontSize:size,color:T.text3,cursor:"pointer",opacity:op,fontWeight:count/maxTag>.7?700:400}} onMouseEnter={e=>{e.currentTarget.style.color=T.accent;e.currentTarget.style.borderColor=T.accent;}} onMouseLeave={e=>{e.currentTarget.style.color=T.text3;e.currentTarget.style.borderColor=T.border;}}>#{tag}</button>;})}
        </div>
      </div>
    </>}
  </div>;
}

// ─── MY PROFILE PAGE ──────────────────────────────────────────────────────────
function MyProfile({profile,disputes,following,streak,earnedBadges,onEditProfile,T}) {
  const mine=disputes.filter(d=>d.author==="you"||d.author===profile.username);
  const totalV=mine.reduce((s,d)=>s+totalVotes(d),0);
  return <div style={{maxWidth:660,margin:"0 auto",padding:"12px 10px 80px"}}>
    <div style={{background:`linear-gradient(135deg,${T.purple}44,${T.blue}33)`,borderRadius:16,height:100,marginBottom:-30,position:"relative"}}>
      <button onClick={onEditProfile} style={{position:"absolute",bottom:10,right:12,background:"#00000066",border:`1px solid rgba(255,255,255,.2)`,borderRadius:20,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer",fontWeight:600}}>✏️ Edit Profile</button>
    </div>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:12}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:T.surface2,border:`3px solid ${T.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{profile.avatar||"🫵"}</div>
        <div style={{display:"flex",gap:14}}>
          {[["📝",mine.length,"Disputes"],["🗳️",fmtNum(totalV),"Votes"],["👥",following.length,"Following"]].map(([icon,val,label])=><div key={label} style={{textAlign:"center"}}><div style={{fontSize:17,fontWeight:900,color:T.accent}}>{val}</div><div style={{fontSize:9,color:T.text4}}>{label}</div></div>)}
        </div>
      </div>
      <div style={{fontSize:18,fontWeight:900,color:T.text,marginBottom:3}}>{profile.name||"You"}</div>
      {profile.username&&<div style={{fontSize:12,color:T.text4,marginBottom:3}}>@{profile.username}</div>}
      <div style={{fontSize:12,color:T.text3,marginBottom:6}}>{profile.bio||"No bio yet."}</div>
      <div style={{fontSize:11,color:T.text4,marginBottom:12,display:"flex",gap:8,flexWrap:"wrap"}}>
        {profile.country&&<span>{profile.country}</span>}
        {streak>=3&&<><span>·</span><span style={{color:T.red,fontWeight:700}}>{streakLabel(streak)} {streak}d streak</span></>}
      </div>
      {earnedBadges.length>0&&<div style={{marginBottom:14}}>
        <div style={{fontSize:10,color:T.text4,letterSpacing:.8,marginBottom:8}}>BADGES</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{earnedBadges.map(b=><div key={b.id} title={`${b.label}: ${b.desc}`} style={{display:"flex",alignItems:"center",gap:5,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:20,padding:"4px 10px"}}><span style={{fontSize:16}}>{b.icon}</span><span style={{fontSize:10,color:T.text2,fontWeight:600}}>{b.label}</span></div>)}</div>
      </div>}
      {profile.safeMode&&<div style={{background:T.green+"12",border:`1px solid ${T.green}33`,borderRadius:8,padding:"5px 10px",fontSize:11,color:T.green,marginBottom:10}}>🛡️ Safe Mode ON</div>}
    </div>
    <div style={{borderTop:`1px solid ${T.border}`,marginTop:12,padding:"14px 14px 0"}}>
      <div style={{fontSize:10,color:T.text4,letterSpacing:.8,marginBottom:10}}>YOUR DISPUTES</div>
      {mine.length===0?<div style={{textAlign:"center",padding:"20px",color:T.text4,fontSize:13}}>No disputes yet. Start one!</div>
        :mine.map(d=><div key={d.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"11px 13px",marginBottom:9}}>
          <div style={{fontSize:13,color:T.text,fontFamily:"Georgia,serif",marginBottom:6}}>{d.title}</div>
          <div style={{height:5,background:T.surface3,borderRadius:2,overflow:"hidden",marginBottom:5}}><div style={{width:`${Math.round((d.options[0]?.votes||0)/(totalVotes(d)||1)*100)}%`,height:"100%",background:T.red,borderRadius:2}}/></div>
          <div style={{fontSize:10,color:T.text4,display:"flex",gap:8}}><span>{fmtNum(totalVotes(d))} votes</span><span>·</span><span>{d.settled?"⚖️ Settled":"🔴 Open"}</span><span>·</span><span>{d.category}</span></div>
        </div>)}
    </div>
  </div>;
}

// ─── CREATOR DASHBOARD ────────────────────────────────────────────────────────
function CreatorDashboard({disputes,T}) {
  const mine=disputes.filter(d=>d.author==="you");
  const totalV=mine.reduce((s,d)=>s+totalVotes(d),0);
  const allComments=mine.flatMap(d=>d.comments||[]);
  const [bestTime,setBestTime]=useState(""),[sentiment,setSentiment]=useState(null);
  const [loadBT,setLoadBT]=useState(false),[loadS,setLoadS]=useState(false);
  const topDispute=[...mine].sort((a,b)=>totalVotes(b)-totalVotes(a))[0];
  const sentColor={positive:T.green,negative:T.red,neutral:T.text4,mixed:T.orange};
  return <div style={{maxWidth:660,margin:"0 auto",padding:"12px 10px 80px"}}>
    <div style={{background:`linear-gradient(135deg,${T.teal}18,${T.surface})`,border:`1px solid ${T.teal}33`,borderRadius:14,padding:"14px 16px",marginBottom:14}}>
      <div style={{fontSize:11,color:T.teal,fontWeight:700,letterSpacing:1}}>📊 CREATOR DASHBOARD</div>
      <div style={{fontSize:18,fontWeight:900,color:T.text,fontFamily:"Georgia,serif",marginTop:3}}>Your Audience Insights</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:14}}>
      {[["📝",mine.length,"Disputes"],["🗳️",fmtNum(totalV),"Total Votes"],["💬",fmtNum(allComments.length),"Comments"],["⚖️",mine.filter(d=>d.settled).length,"Settled"],["📈",mine.length?Math.round(allComments.length/mine.length*10)/10:0,"Avg Comments"],["🔥",mine.filter(d=>d.hotStreak).length,"Hot Streaks"]].map(([icon,val,label])=>(
        <div key={label} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:11,padding:"11px 8px",textAlign:"center"}}><div style={{fontSize:16}}>{icon}</div><div style={{fontSize:18,fontWeight:900,color:T.accent}}>{val}</div><div style={{fontSize:9,color:T.text4,marginTop:1}}>{label}</div></div>
      ))}
    </div>
    {topDispute&&<div style={{background:T.surface2,border:`1px solid ${T.accentBorder}`,borderRadius:12,padding:"13px 14px",marginBottom:12}}>
      <div style={{fontSize:10,color:T.accent,fontWeight:700,marginBottom:6}}>🏆 TOP PERFORMING</div>
      <div style={{fontSize:13,color:T.text,fontFamily:"Georgia,serif",marginBottom:8}}>{topDispute.title}</div>
      <div style={{display:"flex",borderRadius:6,overflow:"hidden",height:8,marginBottom:5}}>{(topDispute.options||[]).map((o,i)=><div key={o.id} style={{width:`${Math.round((o.votes||0)/(totalVotes(topDispute)||1)*100)}%`,background:o.color||["#e85d26","#2a7bd4"][i],minWidth:2}}/>)}</div>
      <div style={{display:"flex",gap:12,fontSize:11,color:T.text4}}><span>🗳️ {fmtNum(totalVotes(topDispute))}</span><span>💬 {topDispute.comments?.length||0}</span><span>😄 {Object.values(topDispute.reactions||{}).reduce((s,v)=>s+v,0)}</span></div>
    </div>}
    <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:bestTime?8:0}}>
        <div style={{fontSize:12,fontWeight:700,color:T.text}}>⏰ Best Time to Post</div>
        <button onClick={async()=>{setLoadBT(true);try{const t=await aiBestTime(mine);setBestTime(t);}catch{setBestTime("Post between 7–9pm when debate engagement peaks.");}setLoadBT(false);}} disabled={loadBT} style={{background:T.accent+"18",border:`1px solid ${T.accentBorder}`,borderRadius:20,padding:"3px 10px",color:T.accent,fontSize:11,cursor:"pointer"}}>{loadBT?"Analyzing...":"Ask Solomon"}</button>
      </div>
      {bestTime&&<div style={{fontSize:12,color:T.text2,lineHeight:1.6}}>{bestTime}</div>}
    </div>
    <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sentiment?10:0}}>
        <div style={{fontSize:12,fontWeight:700,color:T.text}}>💬 Comment Sentiment</div>
        <button onClick={async()=>{if(!allComments.length)return;setLoadS(true);try{const s=await aiSentiment(allComments);setSentiment(s);}catch{setSentiment({overall:"mixed",score:61,breakdown:{positive:40,negative:25,neutral:35}});}setLoadS(false);}} disabled={loadS||!allComments.length} style={{background:T.purple+"18",border:`1px solid ${T.purple}33`,borderRadius:20,padding:"3px 10px",color:T.purple,fontSize:11,cursor:"pointer"}}>{loadS?"Analyzing...":"Analyze"}</button>
      </div>
      {sentiment&&<div style={{display:"flex",gap:6}}>{[["positive",T.green],["negative",T.red],["neutral",T.text4]].map(([key,color])=><div key={key} style={{flex:1,background:color+"12",border:`1px solid ${color}22`,borderRadius:8,padding:"7px 8px",textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color}}>{sentiment.breakdown?.[key]||0}%</div><div style={{fontSize:9,color:T.text4,textTransform:"capitalize"}}>{key}</div></div>)}</div>}
    </div>
  </div>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [themeName,setThemeName]=useState("dark");
  const T=THEMES[themeName];

  // Auth state
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [showWelcome,setShowWelcome]=useState(false);

  // App state
  const [disputes,setDisputes]=useState([]);
  const [userVotes,setUserVotes]=useState({}); // disputeId -> optionKey the user voted
  const [loading,setLoading]=useState(false);
  const [tab,setTab]=useState("home");
  const [feedFilter,setFeedFilter]=useState("hot");
  const [activeCat,setActiveCat]=useState("🔥 All");
  const [activeTag,setActiveTag]=useState(null);
  const [searchQ,setSearchQ]=useState("");
  const [following,setFollowing]=useState([]);
  const [streak,setStreak]=useState(0);
  const [voteCount,setVoteCount]=useState(0);
  const [earnedBadges,setEarnedBadges]=useState([]);
  const [swipeMode,setSwipeMode]=useState(false);
  const [highlightId,setHighlightId]=useState(null);
  const [profile,setProfile]=useState({name:"You",bio:"",avatar:"🫵",country:"🇺🇸 USA",isPrivate:false,safeMode:false});
  const [notifs,setNotifs]=useState([]);
  const [notifPrefs,setNotifPrefs]=useState({verdict:true,comment:true,mention:true,vote:true,follow:true,badge:true});
  const [blockedUsers,setBlockedUsers]=useState([]);
  const [showNew,setShowNew]=useState(false);
  const [showNotifs,setShowNotifs]=useState(false);
  const [showEditProfile,setShowEditProfile]=useState(false);
  const [showUserProfile,setShowUserProfile]=useState(null);

  const unread=notifs.filter(n=>!n.is_read&&!n.read).length;

  // ── Auth init ──
  useEffect(()=>{
    if(!supabase){
      // Demo mode — skip auth
      setUser({id:"demo",email:"demo@settleit.app",user_metadata:{username:"You",display_name:"You"}});
      setDisputes(DEMO_DISPUTES);
      setAuthLoading(false);
      const seen=localStorage.getItem("settleit_welcomed");
      if(!seen){setShowWelcome(true);localStorage.setItem("settleit_welcomed","1");}
      return;
    }
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session?.user){
        setUser(session.user);
        loadUserData(session.user);
      }
      setAuthLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      if(session?.user){setUser(session.user);loadUserData(session.user);}
      else{setUser(null);setDisputes([]);}
    });
    return ()=>subscription.unsubscribe();
  },[]);

  const loadUserData=async(u)=>{
    setLoading(true);
    // Load profile from DB
    if(supabase){
      const {data:prof}=await supabase.from("profiles").select("*").eq("id",u.id).single();
      if(prof)setProfile({name:prof.display_name||u.user_metadata?.display_name||"You",bio:prof.bio||"",avatar:prof.avatar||"🫵",country:prof.country||"🇺🇸 USA",isPrivate:prof.is_private||false,safeMode:prof.safe_mode||false,username:prof.username,streak:prof.streak||0,voteCount:prof.vote_count||0});
      setStreak(prof?.streak||0);setVoteCount(prof?.vote_count||0);
      // Load follows
      const {data:follows}=await supabase.from("follows").select("following_id").eq("follower_id",u.id);
      setFollowing((follows||[]).map(f=>f.following_id));
      // Load notifications
      const nf=await db.getNotifications(u.id);
      setNotifs(nf);
      // Subscribe to realtime notifs
      db.subscribeToNotifs(u.id,n=>setNotifs(p=>[n,...p]));
    }
    // Load disputes
    const d=await db.getDisputes(feedFilter,null);
    setDisputes(d);
    // Load user's previous votes so they persist across sessions
    const votes=await db.getUserVotes(u.id);
    setUserVotes(votes);
    setLoading(false);
    // Show welcome first time
    if(!localStorage.getItem("settleit_welcomed")){setShowWelcome(true);localStorage.setItem("settleit_welcomed","1");}
  };

  // Badge check
  const checkBadges=useCallback((nv,nf,nd)=>{
    setEarnedBadges(prev=>{
      const ids=prev.map(b=>b.id);const toAdd=[];
      if(nv>=1&&!ids.includes("first_vote"))toAdd.push(FUN_BADGES.find(b=>b.id==="first_vote"));
      if(nv>=5&&!ids.includes("contrarian"))toAdd.push(FUN_BADGES.find(b=>b.id==="contrarian"));
      if((nf?.length||0)>=3&&!ids.includes("social"))toAdd.push(FUN_BADGES.find(b=>b.id==="social"));
      if(streak>=3&&!ids.includes("streak3"))toAdd.push(FUN_BADGES.find(b=>b.id==="streak3"));
      if(nd?.filter(d=>d.settled&&(d.author==="you"||d.author===user?.id)).length>=1&&!ids.includes("settler"))toAdd.push(FUN_BADGES.find(b=>b.id==="settler"));
      return [...prev,...toAdd.filter(Boolean)];
    });
  },[streak,user]);

  useEffect(()=>{const h=e=>{if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;if(e.key==="n"||e.key==="N")setShowNew(true);};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);

  // Reload when filter changes
  useEffect(()=>{if(!user)return;db.getDisputes(feedFilter,activeCat==="🔥 All"?null:activeCat).then(d=>setDisputes(d));},[feedFilter,activeCat,user]);

  const handleRefresh=useCallback(async()=>{const d=await db.getDisputes(feedFilter,activeCat==="🔥 All"?null:activeCat);setDisputes(d);},[feedFilter,activeCat]);

  const handleSettle=async d=>{
    try{
      const v=await aiVerdict(d);
      await db.settleDispute(d.id,v);
      setDisputes(p=>p.map(x=>x.id===d.id?{...x,verdict:v,settled:true}:x));
      setNotifs(p=>[{id:Date.now(),type:"verdict",icon:"⚖️",title:"Solomon has ruled!",body:`"${d.title}"`,time:"just now",read:false},...p]);
      checkBadges(voteCount,following,disputes);
    }catch{alert("Solomon is unavailable right now. Try again!");}
  };

  const handleVote=async(id,side)=>{
    const d=disputes.find(x=>x.id===id);
    const opt=(d?.options||[]).find(o=>o.id===side);
    if(opt&&user){await db.castVote(id,opt.id||id,user.id);}
    setDisputes(p=>p.map(d=>d.id!==id?d:{...d,options:(d.options||[]).map(o=>o.id===side?{...o,votes:(o.votes||0)+1}:o)}));
    setUserVotes(p=>({...p,[id]:side}));
    const nv=voteCount+1;setVoteCount(nv);
    setStreak(s=>s+1);
    checkBadges(nv,following,disputes);
  };

  const handleAddComment=async(id,comment)=>{
    if(user&&supabase){await db.addComment(id,user.id,comment.text,comment.isAI);}
    setDisputes(p=>p.map(d=>d.id===id?{...d,comments:[...(d.comments||[]),{...comment,id:Date.now()}]}:d));
  };

  const handleReact=(id,e,delta)=>setDisputes(p=>p.map(d=>d.id===id?{...d,reactions:{...(d.reactions||{}),[e]:Math.max(0,((d.reactions||{})[e]||0)+delta)}}:d));

  const handleBookmark=async id=>{
    if(user)await db.toggleBookmark(id,user.id);
    setDisputes(p=>p.map(d=>d.id===id?{...d,bookmarked:!d.bookmarked}:d));
  };

  const handleFollow=async uid=>{
    if(user)await db.toggleFollow(user.id,uid);
    const nf=following.includes(uid)?following.filter(u=>u!==uid):[...following,uid];
    setFollowing(nf);checkBadges(voteCount,nf,disputes);
  };

  const handleNewDispute=async({title,options,category,tags,duration,mediaUrl,mediaType})=>{
    const expiresAt=new Date(Date.now()+duration*3.6e6).toISOString();
    const nd={id:Date.now(),category,tags:tags||[],title,type:mediaUrl?"image":"text",options:options.map(o=>({...o,votes:0})),author:user?.id||"you",authorAvatar:profile.avatar,authorVerified:null,timeAgo:"just now",expiresAt:Date.now()+duration*3.6e6,reactions:{},comments:[],verdict:null,settled:false,bookmarked:false,hotStreak:false,reported:false,contentWarning:null,votesOverTime:[{t:0,v:0}],media:mediaUrl?{type:"image",url:mediaUrl,caption:""}:null};
    if(user&&supabase){
      try{
        await db.createDispute({...nd,expiresAt,mediaUrl,mediaType},user.id);
        // Reload from DB to get real ID
        const fresh=await db.getDisputes(feedFilter,activeCat==="🔥 All"?null:activeCat);
        setDisputes(fresh);
      }catch(e){
        console.error(e);
        setDisputes(p=>[nd,...p]);
      }
    } else {
      setDisputes(p=>[nd,...p]);
    }
    setShowNew(false);
    setEarnedBadges(prev=>prev.find(b=>b.id==="hot_take")?prev:[...prev,FUN_BADGES.find(b=>b.id==="hot_take")].filter(Boolean));
  };

  const handleSaveProfile=async data=>{
    setProfile(p=>({...p,...data}));
    if(user&&supabase){await db.updateProfile(user.id,{display_name:data.name,bio:data.bio,avatar:data.avatar,country:data.country,is_private:data.isPrivate,safe_mode:data.safeMode});}
    setShowEditProfile(false);
  };

  const handleReport=(disputeId,target)=>{
    if(user)db.fileReport({reporter_id:user.id,dispute_id:target.type==="dispute"?disputeId:null,comment_id:target.type==="comment"?target.id:null,reason:"reported",detail:""});
    setDisputes(p=>p.map(d=>{if(d.id!==disputeId)return d;if(target.type==="comment")return{...d,comments:d.comments.map(c=>c.id===target.id?{...c,reported:true}:c)};return{...d,reported:true};}));
  };

  const handleAuth=u=>{setUser(u);loadUserData(u);};

  const filtered=useMemo(()=>{
    let list=disputes.filter(d=>{
      if(blockedUsers.includes(d.author))return false;
      if(profile.safeMode&&hasWarn(d))return false;
      if(tab==="following")return following.includes(d.author)||d.author===user?.id||d.author==="you";
      if(tab==="saved")return d.bookmarked;
      if(activeTag)return d.tags?.includes(activeTag);
      return true;
    });
    return list;
  },[disputes,tab,following,activeTag,blockedUsers,profile.safeMode,user]);

  const renderFeed=()=>(
    <PullToRefresh onRefresh={handleRefresh} T={T}>
      <div style={{maxWidth:660,margin:"0 auto",padding:"12px 10px 80px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:11,color:T.text4}}>{filtered.length} dispute{filtered.length!==1?"s":""}</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:10,color:T.text4}}>Swipe mode</span>
            <button onClick={()=>setSwipeMode(p=>!p)} style={{width:36,height:20,borderRadius:10,background:swipeMode?T.accent:T.border2,border:"none",cursor:"pointer",position:"relative"}}>
              <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:swipeMode?19:3,transition:"left .2s",boxShadow:"0 1px 3px #0004"}}/>
            </button>
          </div>
        </div>
        {activeTag&&<div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,background:T.accentBg,border:`1px solid ${T.accentBorder}`,borderRadius:10,padding:"8px 12px"}}><span style={{fontSize:13,color:T.accent,fontWeight:700}}>#{activeTag}</span><span style={{fontSize:11,color:T.text4}}>{filtered.length} disputes</span><button onClick={()=>setActiveTag(null)} style={{marginLeft:"auto",background:"none",border:"none",color:T.text4,cursor:"pointer",fontSize:13}}>✕</button></div>}
        {loading&&<div style={{textAlign:"center",padding:"40px",color:T.text4}}><div style={{fontSize:32,animation:"spin 1s linear infinite",display:"inline-block"}}>⚖️</div><div style={{marginTop:10,fontSize:13}}>Loading disputes...</div></div>}
        {!loading&&filtered.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:T.text4}}>
          <div style={{fontSize:36,marginBottom:10}}>🤷</div>
          <div style={{fontSize:14}}>{tab==="saved"?"No bookmarks yet.":tab==="following"?"Follow people to see their disputes.":"No disputes found."}</div>
          {tab==="home"&&<button onClick={()=>setShowNew(true)} style={{marginTop:14,background:T.red,border:"none",borderRadius:20,padding:"8px 18px",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Create one →</button>}
        </div>}
        {!loading&&filtered.slice(0,2).map(d=><DisputeCard key={d.id} d={d} onSettle={handleSettle} onVote={handleVote} onAddComment={handleAddComment} onReact={handleReact} onBookmark={handleBookmark} following={following} onFollow={handleFollow} onOpenProfile={setShowUserProfile} highlight={d.id===highlightId} swipeMode={swipeMode} T={T} onReport={handleReport} currentUserId={user?.id} previousVote={userVotes[d.id]}/>)}
        {!loading&&filtered.length>2&&tab==="home"&&<SponsoredCard d={SPONSORED_DISPUTES[0]} onVote={()=>{}} T={T}/>}
        {!loading&&filtered.slice(2).map(d=><DisputeCard key={d.id} d={d} onSettle={handleSettle} onVote={handleVote} onAddComment={handleAddComment} onReact={handleReact} onBookmark={handleBookmark} following={following} onFollow={handleFollow} onOpenProfile={setShowUserProfile} highlight={d.id===highlightId} swipeMode={swipeMode} T={T} onReport={handleReport} currentUserId={user?.id} previousVote={userVotes[d.id]}/>)}
      </div>
    </PullToRefresh>
  );

  if(authLoading)return <div style={{minHeight:"100vh",background:THEMES.dark.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><div style={{fontSize:48,animation:"spin 1s linear infinite",display:"inline-block"}}>⚖️</div><div style={{fontSize:16,color:THEMES.dark.text4,fontFamily:"Georgia,serif"}}>Loading SettleIt...</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  if(!user)return <><AuthScreen T={T} onAuth={handleAuth}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input:focus{border-color:#666!important}`}</style></>;

  return <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Helvetica Neue',Arial,sans-serif",paddingBottom:60}}>

    {/* Header */}
    <div style={{borderBottom:`1px solid ${T.border}`,padding:"10px 12px",display:"flex",alignItems:"center",gap:8,position:"sticky",top:0,background:T.bg,zIndex:10,backdropFilter:"blur(12px)"}}>
      <span style={{fontSize:17,fontWeight:900,fontFamily:"Georgia,serif",letterSpacing:-0.5,flexShrink:0}}>⚖️ <span style={{color:T.accent}}>Settle</span>It</span>
      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search..." style={{flex:1,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:20,padding:"6px 12px",color:T.text,fontSize:12,outline:"none"}}/>
      <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
        {streak>=3&&<span style={{fontSize:10,color:T.red,fontWeight:700,background:T.red+"18",border:`1px solid ${T.red}33`,borderRadius:20,padding:"3px 8px",flexShrink:0}}>🔥{streak}d</span>}
        {[["dark","🌙"],["light","☀️"],["oled","⬛"]].map(([name,icon])=><button key={name} onClick={()=>setThemeName(name)} style={{background:themeName===name?T.accentBg:T.surface2,border:`1px solid ${themeName===name?T.accent:T.border}`,borderRadius:20,padding:"4px 7px",fontSize:12,cursor:"pointer"}}>{icon}</button>)}
        <button onClick={()=>setShowNotifs(true)} style={{position:"relative",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 8px",fontSize:12,cursor:"pointer"}}>
          🔔{unread>0&&<span style={{position:"absolute",top:-3,right:-3,background:T.red,color:"#fff",fontSize:8,fontWeight:700,borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>}
        </button>
      </div>
    </div>

    {/* Feed filters */}
    {(tab==="home"||tab==="following"||tab==="saved")&&<>
      <div style={{display:"flex",gap:4,padding:"7px 10px",overflowX:"auto",borderBottom:`1px solid ${T.border}`}}>
        {CATEGORIES.map(c=><button key={c} onClick={()=>{setActiveCat(c);setActiveTag(null);}} style={{background:activeCat===c&&!activeTag?T.accentBg:T.surface2,border:`1px solid ${activeCat===c&&!activeTag?T.accent:T.border}`,borderRadius:20,padding:"3px 9px",color:activeCat===c&&!activeTag?T.accent:T.text3,fontSize:10,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{c}</button>)}
      </div>
      <div style={{display:"flex",padding:"5px 10px 0",gap:2,borderBottom:`1px solid ${T.border}`}}>
        {[["hot","🔥 Hot"],["new","✨ New"],["settled","⚖️ Settled"]].map(([id,label])=><button key={id} onClick={()=>setFeedFilter(id)} style={{background:"transparent",border:"none",borderBottom:feedFilter===id?`2px solid ${T.accent}`:"2px solid transparent",padding:"4px 10px 8px",color:feedFilter===id?T.accent:T.text4,fontWeight:feedFilter===id?700:400,fontSize:11,cursor:"pointer"}}>{label}</button>)}
      </div>
    </>}

    {/* Pages */}
    {(tab==="home"||tab==="following"||tab==="saved")&&renderFeed()}
    {tab==="explore"&&<ExplorePage disputes={disputes} onOpenDispute={id=>{setHighlightId(id);setTab("home");setTimeout(()=>setHighlightId(null),2500);}} onTagClick={t=>{setActiveTag(t);setTab("home");}} T={T}/>}
    {tab==="dashboard"&&<CreatorDashboard disputes={disputes} T={T}/>}
    {tab==="profile"&&<MyProfile profile={profile} disputes={disputes} following={following} streak={streak} earnedBadges={earnedBadges} onEditProfile={()=>setShowEditProfile(true)} T={T}/>}

    {/* Bottom nav */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:20,backdropFilter:"blur(12px)"}}>
      {[["home","🏠","Home"],["explore","🔍","Explore"],["create","➕",""],["dashboard","📊","Stats"],["profile","👤","Profile"]].map(([id,icon,label])=>(
        <button key={id} onClick={()=>id==="create"?setShowNew(true):setTab(id)} style={{flex:1,background:"transparent",border:"none",padding:"8px 0 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
          {id==="create"
            ?<div style={{width:44,height:44,borderRadius:"50%",background:T.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff",marginTop:-12,boxShadow:`0 3px 16px ${T.red}88`}}>+</div>
            :<><span style={{fontSize:20,transition:"transform .15s",transform:tab===id?"scale(1.15)":"scale(1)"}}>{icon}</span><span style={{fontSize:9,color:tab===id?T.accent:T.text4,fontWeight:tab===id?700:400}}>{label}</span>{tab===id&&<div style={{position:"absolute",bottom:0,width:20,height:2,background:T.accent,borderRadius:1}}/>}</>}
        </button>
      ))}
    </div>

    {/* Modals */}
    {showWelcome&&<WelcomeScreen onDone={()=>setShowWelcome(false)} T={T}/>}
    {showNew&&<NewDisputeModal onClose={()=>setShowNew(false)} onSubmit={handleNewDispute} T={T}/>}
    {showNotifs&&<NotifCenter notifs={notifs} setNotifs={setNotifs} prefs={notifPrefs} setPrefs={setNotifPrefs} onClose={()=>setShowNotifs(false)} T={T} markRead={()=>user&&db.markNotifsRead(user.id)}/>}
    {showEditProfile&&<EditProfile profile={profile} onSave={handleSaveProfile} onClose={()=>setShowEditProfile(false)} T={T}/>}

    <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes soundbar{from{transform:scaleY(.4)}to{transform:scaleY(1)}}*{box-sizing:border-box}input:focus,textarea:focus{border-color:#666!important}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:#44444466;border-radius:2px}`}</style>
  </div>;
}
