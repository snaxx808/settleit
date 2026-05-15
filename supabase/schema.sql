-- SettleIt Database Schema
-- Run this in your Supabase SQL editor: https://app.supabase.com

-- ─── EXTENSIONS ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null default '',
  bio text default '',
  avatar text default '🫵',
  country text default '🇺🇸 USA',
  is_private boolean default false,
  safe_mode boolean default false,
  verified text check (verified in ('identity','notable','expert','official')) default null,
  streak integer default 0,
  last_voted_at date default null,
  vote_count integer default 0,
  follower_count integer default 0,
  following_count integer default 0,
  created_at timestamptz default now()
);

-- ─── FOLLOWS ──────────────────────────────────────────────────────────────────
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- ─── DISPUTES ─────────────────────────────────────────────────────────────────
create table public.disputes (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  type text default 'text' check (type in ('text','image','image_vs_image','video','gif','url')),
  category text not null default '🌍 Society',
  tags text[] default '{}',
  media_url text default null,
  media_caption text default null,
  media_type text default null,
  content_warning text default null,
  hot_streak boolean default false,
  is_sponsored boolean default false,
  sponsor_name text default null,
  expires_at timestamptz not null,
  settled boolean default false,
  verdict_winner text default null,
  verdict_reasoning text default null,
  verdict_confidence text default null,
  verdict_fun_fact text default null,
  report_count integer default 0,
  is_removed boolean default false,
  created_at timestamptz default now()
);

-- ─── OPTIONS (vote sides) ─────────────────────────────────────────────────────
create table public.options (
  id uuid default uuid_generate_v4() primary key,
  dispute_id uuid references public.disputes(id) on delete cascade not null,
  option_key text not null,           -- 'A', 'B', 'C' etc
  label text not null,
  color text default '#e85d26',
  media_url text default null,
  media_caption text default null,
  vote_count integer default 0,
  position integer default 0
);

-- ─── VOTES ────────────────────────────────────────────────────────────────────
create table public.votes (
  id uuid default uuid_generate_v4() primary key,
  dispute_id uuid references public.disputes(id) on delete cascade not null,
  option_id uuid references public.options(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (dispute_id, user_id)  -- one vote per dispute per user
);

-- ─── COMMENTS ─────────────────────────────────────────────────────────────────
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  dispute_id uuid references public.disputes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  is_ai boolean default false,
  like_count integer default 0,
  is_reported boolean default false,
  is_removed boolean default false,
  created_at timestamptz default now()
);

-- ─── COMMENT LIKES ────────────────────────────────────────────────────────────
create table public.comment_likes (
  comment_id uuid references public.comments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (comment_id, user_id)
);

-- ─── REACTIONS ────────────────────────────────────────────────────────────────
create table public.reactions (
  id uuid default uuid_generate_v4() primary key,
  dispute_id uuid references public.disputes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique (dispute_id, user_id, emoji)
);

-- ─── BOOKMARKS ────────────────────────────────────────────────────────────────
create table public.bookmarks (
  dispute_id uuid references public.disputes(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (dispute_id, user_id)
);

-- ─── BADGES ───────────────────────────────────────────────────────────────────
create table public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id text not null,
  earned_at timestamptz default now(),
  unique (user_id, badge_id)
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('verdict','comment','mention','vote','follow','badge','report')),
  title text not null,
  body text not null,
  dispute_id uuid references public.disputes(id) on delete set null default null,
  actor_id uuid references public.profiles(id) on delete set null default null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ─── REPORTS ──────────────────────────────────────────────────────────────────
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  dispute_id uuid references public.disputes(id) on delete cascade default null,
  comment_id uuid references public.comments(id) on delete cascade default null,
  reason text not null,
  detail text default '',
  status text default 'pending' check (status in ('pending','reviewed','dismissed')),
  created_at timestamptz default now()
);

-- ─── BLOCKS ───────────────────────────────────────────────────────────────────
create table public.blocks (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

-- ─── VOTE SNAPSHOTS (for sparklines) ─────────────────────────────────────────
create table public.vote_snapshots (
  id uuid default uuid_generate_v4() primary key,
  dispute_id uuid references public.disputes(id) on delete cascade not null,
  total_votes integer not null,
  snapped_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.disputes enable row level security;
alter table public.options enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.reactions enable row level security;
alter table public.bookmarks enable row level security;
alter table public.user_badges enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.vote_snapshots enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Profiles are publicly readable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Disputes: public read, authenticated write own
create policy "Disputes are publicly readable" on public.disputes for select using (is_removed = false);
create policy "Authenticated users can create disputes" on public.disputes for insert with check (auth.uid() = author_id);
create policy "Users can update own disputes" on public.disputes for update using (auth.uid() = author_id);

-- Options: public read
create policy "Options are publicly readable" on public.options for select using (true);
create policy "Authors can insert options" on public.options for insert with check (
  auth.uid() = (select author_id from public.disputes where id = dispute_id)
);

-- Votes: public read, authenticated insert (one per user per dispute enforced by unique)
create policy "Votes are publicly readable" on public.votes for select using (true);
create policy "Authenticated users can vote" on public.votes for insert with check (auth.uid() = user_id);

-- Comments: public read, authenticated write
create policy "Comments are publicly readable" on public.comments for select using (is_removed = false);
create policy "Authenticated users can comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- Comment likes
create policy "Comment likes are publicly readable" on public.comment_likes for select using (true);
create policy "Users can like comments" on public.comment_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike comments" on public.comment_likes for delete using (auth.uid() = user_id);

-- Reactions
create policy "Reactions are publicly readable" on public.reactions for select using (true);
create policy "Authenticated users can react" on public.reactions for insert with check (auth.uid() = user_id);
create policy "Users can remove own reactions" on public.reactions for delete using (auth.uid() = user_id);

-- Bookmarks: private (only owner sees their bookmarks)
create policy "Users can see own bookmarks" on public.bookmarks for select using (auth.uid() = user_id);
create policy "Users can add bookmarks" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "Users can remove bookmarks" on public.bookmarks for delete using (auth.uid() = user_id);

-- Badges: public read
create policy "Badges are publicly readable" on public.user_badges for select using (true);

-- Notifications: private
create policy "Users can see own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- Follows: public read
create policy "Follows are publicly readable" on public.follows for select using (true);
create policy "Users can follow" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- Reports: only reporter can see their own
create policy "Users can see own reports" on public.reports for select using (auth.uid() = reporter_id);
create policy "Users can file reports" on public.reports for insert with check (auth.uid() = reporter_id);

-- Blocks: private
create policy "Users can see own blocks" on public.blocks for select using (auth.uid() = blocker_id);
create policy "Users can block" on public.blocks for insert with check (auth.uid() = blocker_id);
create policy "Users can unblock" on public.blocks for delete using (auth.uid() = blocker_id);

-- Vote snapshots: public read
create policy "Vote snapshots are publicly readable" on public.vote_snapshots for select using (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Increment vote count on options when vote is cast
create or replace function public.handle_vote_cast()
returns trigger language plpgsql security definer as $$
begin
  -- Increment option vote count
  update public.options set vote_count = vote_count + 1 where id = new.option_id;
  -- Increment user vote count
  update public.profiles set vote_count = vote_count + 1 where id = new.user_id;
  -- Update streak
  update public.profiles set
    streak = case
      when last_voted_at = current_date - interval '1 day' then streak + 1
      when last_voted_at = current_date then streak
      else 1
    end,
    last_voted_at = current_date
  where id = new.user_id;
  -- Snapshot vote total for sparkline (every 10 votes)
  insert into public.vote_snapshots (dispute_id, total_votes)
  select new.dispute_id, sum(vote_count)
  from public.options
  where dispute_id = new.dispute_id
  having sum(vote_count) % 10 = 0;
  return new;
end;
$$;

create trigger on_vote_cast
  after insert on public.votes
  for each row execute procedure public.handle_vote_cast();

-- Update follower/following counts
create or replace function public.handle_follow()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles set follower_count = follower_count + 1 where id = new.following_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    -- Notify the followed user
    insert into public.notifications (user_id, type, title, body, actor_id)
    values (new.following_id, 'follow', 'New follower!',
      (select display_name from public.profiles where id = new.follower_id) || ' started following you',
      new.follower_id);
  elsif TG_OP = 'DELETE' then
    update public.profiles set follower_count = follower_count - 1 where id = old.following_id;
    update public.profiles set following_count = following_count - 1 where id = old.follower_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger on_follow_change
  after insert or delete on public.follows
  for each row execute procedure public.handle_follow();

-- Notify on new comment
create or replace function public.handle_new_comment()
returns trigger language plpgsql security definer as $$
declare
  dispute_author uuid;
  commenter_name text;
  dispute_title text;
begin
  select author_id, title into dispute_author, dispute_title
  from public.disputes where id = new.dispute_id;
  select display_name into commenter_name
  from public.profiles where id = new.user_id;
  if dispute_author != new.user_id then
    insert into public.notifications (user_id, type, title, body, dispute_id, actor_id)
    values (dispute_author, 'comment', commenter_name || ' commented',
      '"' || left(new.text, 60) || '"', new.dispute_id, new.user_id);
  end if;
  return new;
end;
$$;

create trigger on_new_comment
  after insert on public.comments
  for each row execute procedure public.handle_new_comment();

-- Mark dispute as hot streak (100+ votes in 1 hour)
create or replace function public.check_hot_streak()
returns trigger language plpgsql security definer as $$
declare
  recent_votes integer;
begin
  select count(*) into recent_votes
  from public.votes
  where dispute_id = new.dispute_id
    and created_at > now() - interval '1 hour';
  if recent_votes >= 100 then
    update public.disputes set hot_streak = true where id = new.dispute_id;
  end if;
  return new;
end;
$$;

create trigger on_vote_hot_streak
  after insert on public.votes
  for each row execute procedure public.check_hot_streak();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS (useful for frontend queries)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Disputes with vote counts and author info
create or replace view public.disputes_with_details as
select
  d.*,
  p.username as author_username,
  p.display_name as author_display_name,
  p.avatar as author_avatar,
  p.verified as author_verified,
  coalesce(sum(o.vote_count), 0) as total_votes,
  json_agg(
    json_build_object(
      'id', o.id,
      'option_key', o.option_key,
      'label', o.label,
      'color', o.color,
      'vote_count', o.vote_count,
      'media_url', o.media_url,
      'media_caption', o.media_caption
    ) order by o.position
  ) as options
from public.disputes d
join public.profiles p on p.id = d.author_id
left join public.options o on o.dispute_id = d.id
where d.is_removed = false
group by d.id, p.id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES (performance)
-- ═══════════════════════════════════════════════════════════════════════════════
create index idx_disputes_author on public.disputes(author_id);
create index idx_disputes_category on public.disputes(category);
create index idx_disputes_created on public.disputes(created_at desc);
create index idx_disputes_expires on public.disputes(expires_at);
create index idx_votes_dispute on public.votes(dispute_id);
create index idx_votes_user on public.votes(user_id);
create index idx_comments_dispute on public.comments(dispute_id);
create index idx_notifications_user on public.notifications(user_id, is_read);
create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);
