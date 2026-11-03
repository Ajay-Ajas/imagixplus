-- IMAGIX+ update: people (core founders + team), richer projects, contact messages.
-- Safe on existing data: only adds columns/tables and upgrades the original seeded rows.

-- ---------- People ----------
alter table founders add column if not exists slug text;
alter table founders add column if not exists is_core boolean not null default false;
alter table founders add column if not exists category text not null default 'Team';
alter table founders add column if not exists bio text not null default '';
alter table founders add column if not exists qualification text not null default '';
alter table founders add column if not exists aim text not null default '';
alter table founders add column if not exists email text not null default '';
alter table founders add column if not exists archived boolean not null default false;

-- The four permanent main founders (upgrades the original short-name rows, keeps any edits to other fields)
update founders set name = 'Audlin Sanjay U N', slug = 'audlin-sanjay-u-n', sort_order = 0 where is_core = false and lower(name) in ('sanjay', 'audlin sanjay u n');
update founders set name = 'ABIN K A',          slug = 'abin-k-a',          sort_order = 1 where is_core = false and lower(name) in ('abin', 'abin k a');
update founders set name = 'JESWIN C S',        slug = 'jeswin-c-s',        sort_order = 2 where is_core = false and lower(name) in ('jeswin', 'jeswin c s');
update founders set name = 'AJAY L',            slug = 'ajay-l',            sort_order = 3 where is_core = false and lower(name) in ('ajay', 'ajay l');
update founders set is_core = true, category = 'Main Founder', published = true, archived = false
  where slug in ('audlin-sanjay-u-n', 'abin-k-a', 'jeswin-c-s', 'ajay-l');

update founders set slug = trim(both '-' from lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || id where slug is null;
create unique index if not exists founders_slug_key on founders (slug);

-- Database-level guard: core founders cannot be deleted, hidden, archived or demoted, whatever the application does.
create or replace function protect_core_founders() returns trigger as $$
begin
  if tg_op = 'DELETE' then
    if old.is_core then raise exception 'Main founders are permanent and cannot be deleted' using errcode = 'P0001'; end if;
    return old;
  end if;
  if old.is_core and (not new.is_core or not new.published or new.archived) then
    raise exception 'Main founders cannot be hidden, archived or demoted' using errcode = 'P0001';
  end if;
  return new;
end;
$$ language plpgsql;
drop trigger if exists trg_protect_core_founders on founders;
create trigger trg_protect_core_founders before update or delete on founders
  for each row execute function protect_core_founders();

-- ---------- Projects ----------
alter table projects add column if not exists status_label text not null default '';
alter table projects add column if not exists badges text[] not null default '{}';
alter table projects add column if not exists category text not null default '';
alter table projects add column if not exists links jsonb not null default '[]';
alter table projects add column if not exists archived boolean not null default false;

update projects set name = 'AI Powered House Monitoring', status_label = 'Prototype Developed · Under Development',
  badges = '{"Prototype","In development"}', category = 'Smart monitoring',
  status_note = case when status_note = 'Further development in progress.' then '' else status_note end
  where slug = 'ai-house-monitoring' and status_label = '';
update projects set name = 'AI Powered Non-Intrusive Electrical Device Monitoring', status_label = 'Prototype Developed · Under Development',
  badges = '{"Prototype","In development"}', category = 'Smart monitoring',
  status_note = case when status_note = 'Further development in progress.' then '' else status_note end
  where slug = 'ai-electrical-device-monitoring' and status_label = '';
update projects set name = 'CivicMind AI — Government Civic Complaint Management Platform',
  status_label = 'Currently Developed · Under Fine-Tuning · Seeking Deployment',
  badges = '{"Fine-tuning","Seeking deployment"}', category = 'Civic technology',
  status_note = case when status_note = 'Undergoing fine-tuning, testing and preparation for deployment.' then '' else status_note end
  where slug = 'civicmind-ai' and status_label = '';
update portfolio set name = 'AI Powered House Monitoring' where name = 'AI-Powered House Monitoring System';
update portfolio set name = 'AI Powered Non-Intrusive Electrical Device Monitoring' where name = 'AI-Powered Non-Intrusive Electrical Device Monitoring';
update portfolio set name = 'CivicMind AI — Government Civic Complaint Management Platform' where name = 'CivicMind AI';

-- ---------- Contact messages ----------
create table if not exists contact_messages (
  id serial primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  emailed boolean not null default false,
  email_error text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_created_idx on contact_messages (created_at desc);

-- ---------- Settings defaults that changed ----------
update site_settings set value = jsonb_set(value, '{tagline}', '"Moving Towards the Future"')
  where key = 'home' and value->>'tagline' = 'Moving Towards the Future.';
update site_settings set value = jsonb_set(value, '{email}', '"contact@civicmindai.in"')
  where key = 'contact' and coalesce(value->>'email', '') = '';
