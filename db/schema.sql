-- ============================================================
--  KSME27 G3 Production Hub — schema
--  รันไฟล์นี้ครั้งเดียวใน Neon SQL Editor ก่อน แล้วค่อยรัน seed.sql
-- ============================================================

drop table if exists edits cascade;
drop table if exists feedback cascade;
drop table if exists clips cascade;
drop table if exists assets cascade;
drop table if exists members cascade;
drop table if exists teams cascade;
drop table if exists script_sections cascade;

create table teams (
  key         text primary key,
  name_th     text,
  color       text,
  tagline     text,
  sort_order  int default 0
);

create table members (
  id           text primary key,
  team         text references teams(key),
  sort_order   int default 0,
  code         text,                -- รหัสสมาชิก K SME เช่น BK27057
  company_th   text,
  company_en   text,
  owner_name   text,
  nickname     text,
  gender       text,
  is_leader    boolean default false,
  business     text,                -- ทำธุรกิจอะไร
  highlight    text,                -- ⭐ จุดเด่น (หัวใจของงานนี้)
  benefit      text,                -- ลูกค้าได้อะไร
  products     text,                -- สินค้า/บริการหลัก
  scene_idea   text,                -- signature move สำหรับคลิป
  dialogue_th  text,                -- บทพูดไทยในคลิป
  contact      text,
  portrait_url text,
  logo_url     text,
  note         text,
  status       text default 'todo', -- todo | drafted | approved
  updated_at   timestamptz default now()
);

create table assets (
  member_id text references members(id) on delete cascade,
  kind      text,                   -- face | side | logo | product | ecard
  has_it    boolean default false,
  primary key (member_id, kind)
);

create table clips (
  id          serial primary key,
  member_id   text references members(id) on delete cascade,
  version     int default 1,
  job_id      text,
  video_url   text,
  scene_th    text,
  dialogue_th text,
  prompt_en   text,
  status      text default 'draft',  -- draft | approved | rejected
  created_at  timestamptz default now()
);

create table feedback (
  id         serial primary key,
  member_id  text references members(id) on delete cascade,
  clip_id    int,
  author     text not null,
  vote       text,                   -- ok | revise
  message    text,
  created_at timestamptz default now()
);

-- log ว่าใครแก้ข้อมูลอะไรไปบ้าง (ทุกคนแก้ได้ แต่ย้อนดูได้)
create table edits (
  id         serial primary key,
  member_id  text,
  author     text,
  field      text,
  old_value  text,
  new_value  text,
  created_at timestamptz default now()
);

create table script_sections (
  id         serial primary key,
  key        text unique,
  title_th   text,
  body       text,
  sort_order int default 0,
  updated_at timestamptz default now()
);

create index on feedback (member_id, created_at desc);
create index on clips (member_id, version desc);
create index on members (team, sort_order);
