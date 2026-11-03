-- IMAGIX+ initial schema
create table if not exists users (
  id serial primary key,
  username text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);
create unique index if not exists users_username_lower on users (lower(username));

create table if not exists "session" (
  sid varchar not null primary key,
  sess json not null,
  expire timestamp(6) not null
);
create index if not exists session_expire_idx on "session" (expire);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  filename text not null default '',
  mime text not null,
  size integer not null default 0,
  storage text not null check (storage in ('database','cloudinary')),
  data bytea,
  url text,
  public_id text,
  created_at timestamptz not null default now()
);

create table if not exists ideas (
  id serial primary key,
  title text not null,
  description text not null default '',
  image_url text not null default '',
  category text not null default '',
  stage text not null default 'Concept',
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id serial primary key,
  name text not null,
  slug text not null unique,
  short_description text not null default '',
  description text not null default '',
  status text not null default 'Concept',
  status_note text not null default '',
  cover_image text not null default '',
  technologies text[] not null default '{}',
  capabilities text[] not null default '{}',
  future_plans text[] not null default '{}',
  url text not null default '',
  url_label text not null default '',
  is_flagship boolean not null default false,
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists portfolio (
  id serial primary key,
  name text not null,
  description text not null default '',
  cover_image text not null default '',
  gallery text[] not null default '{}',
  technologies text[] not null default '{}',
  status text not null default 'Concept',
  category text not null default '',
  url text not null default '',
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists founders (
  id serial primary key,
  name text not null,
  designation text not null default 'Founder',
  intro text not null default '',
  photo_url text not null default '',
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  contributions text[] not null default '{}',
  social_links jsonb not null default '[]',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists updates (
  id serial primary key,
  title text not null,
  slug text not null unique,
  summary text not null default '',
  content text not null default '',
  cover_image text not null default '',
  category text not null default 'Company',
  author text not null default '',
  featured boolean not null default false,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists updates_pub_idx on updates (published, published_at desc);
