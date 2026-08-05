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
  key          text primary key,
  name_th      text,
  color        text,
  tagline      text,
  sort_order   int default 0,
  intro_url    text,               -- ตอนที่ 1 ฉากปัญหาของสายนั้น
  intro_job_id text,
  hero_url     text,               -- ตอนที่ 2 ทีมมาจัดการ (เล่นต่อจากตอนที่ 1)
  hero_job_id  text
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
  vote       text,                   -- ok | revise (ของเดิม ตอนนี้ใช้แค่คอมเมนต์)
  message    text,
  created_at timestamptz default now(),
  done       boolean default false,  -- ติ๊กว่าคอมเมนต์นี้จัดการไปแล้ว
  done_by    text,
  done_at    timestamptz
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

-- ให้มีได้แค่เวอร์ชันล่าสุดเวอร์ชันเดียวที่รอรีวิว
-- พอ insert เวอร์ชันใหม่ เวอร์ชันเก่าที่ยัง draft จะกลายเป็น rejected เอง
-- (เวอร์ชันที่ approved ไปแล้วไม่ถูกแตะ)
create or replace function clips_supersede_old_drafts() returns trigger as $$
begin
  update clips
     set status = 'rejected'
   where member_id = new.member_id
     and id <> new.id
     and version < new.version
     and status = 'draft';
  return null;
end $$ language plpgsql;

drop trigger if exists trg_clips_supersede on clips;
create trigger trg_clips_supersede
after insert on clips
for each row execute function clips_supersede_old_drafts();
