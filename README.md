# ⚡ G3 Avengers — Production Hub

เว็บติดตามงาน VDO เปิดตัว **K SME Care #27 กลุ่ม 3** (30 กิจการ)
ทุกคนในกลุ่มเข้ามาดูความคืบหน้า **แก้ข้อมูลกิจการตัวเอง** และ **คอมเมนต์คลิป** ได้

Next.js 15 · Neon Postgres · deploy บน Vercel · ไม่มี login (กรอกชื่อครั้งเดียว เก็บในเครื่อง)

---

## เริ่มใช้งาน (4 ขั้น)

### 1. ตั้งฐานข้อมูลบน Neon

เข้า Neon Console → SQL Editor → วางแล้วรันทีละไฟล์

1. `db/schema.sql` — สร้างตาราง
2. `db/seed.sql` — ใส่ข้อมูล 30 กิจการ + คลิปที่ทำแล้ว + สคริปต์

> `db/seed.sql` ถูกสร้างจาก `db/members.json` ถ้าแก้ JSON แล้วอยากสร้างใหม่ให้รัน `npm run seed:gen`

### 2. รันในเครื่อง

```bash
npm install
cp .env.example .env.local     # แล้วใส่ connection string ของ Neon
npm run dev                    # http://localhost:3000
```

### 3. ขึ้น GitHub

```bash
git init
git add -A
git commit -m "G3 production hub"
git branch -M main
git remote add origin https://github.com/kwamkid/ksme27-g3.git
git push -u origin main
```

### 4. Deploy บน Vercel

vercel.com → Add New Project → เลือก repo `ksme27-g3` → ใส่ Environment Variable:

| Key | Value |
|---|---|
| `DATABASE_URL` | connection string จาก Neon |

กด Deploy แล้วส่งลิงก์ให้เพื่อนในกลุ่มได้เลย

---

## รูปภาพในเว็บ

รูปทั้งหมดใน `public/` ถูกแปลงมาจากโฟลเดอร์งาน (PNG/JPG 42MB → WebP 1.6MB) ด้วย

```bash
bash scripts/build-assets.sh     # ต้องมี cwebp: brew install webp
```

| โฟลเดอร์ | มาจาก | ใช้ที่ไหน |
|---|---|---|
| `public/avatar/<id>.webp` | `2-Production/5.1 Characters/v2-characters/` | รูปตัวละครบนการ์ด (25/30) |
| `public/owner/<id>.webp` | `1-Teams/**/face_*` | รูปเจ้าของตัวจริง วงกลมบนการ์ด (25/30) |
| `public/logo/<id>.webp` | `1-Teams/**/logo_*` | โลโก้กิจการ บนชิปขาว (25/30) |
| `public/hero/<TEAM>.webp` | `v2-characters/0-main/` | ภาพจาง ๆ แทนกิจการที่ยังไม่มีตัวละคร |

มีรูปเพิ่ม → เติมบรรทัดใน mapping ท้าย `scripts/build-assets.sh` แล้วรันใหม่ + เติม id ใน `lib/assets.js`
คอลัมน์สุดท้ายของ mapping คือองศาหมุน (ใส่ไว้เพราะ cwebp ไม่อ่าน EXIF — เช่น Foilmaster ต้อง `270`)

## บทพูดในคลิป

แก้ที่ `db/dialogue.json` ที่เดียว แล้ว

```bash
node db/apply-dialogue.mjs   # เขียนลง db/members.json
npm run seed:gen             # สร้าง db/seed.sql ใหม่
```

จากนั้นอัปเดตฐานข้อมูลจริง (หรือแก้ทีละกิจการผ่านหน้าเว็บก็ได้)

## หน้าเว็บ

| หน้า | ทำอะไร |
|---|---|
| `/` | ทำเนียบ 30 กิจการ — ค้นหา/กรองตามทีม, การ์ดพร้อมตัวละคร+รูปเจ้าของ+โลโก้, กดดูคลิปเป็น lightbox (เทียบได้หลายเวอร์ชัน), สลับเป็น "ตารางเช็กของ" ดูว่าใครมี/ขาดอะไร |
| `/member/[id]` | หน้าหลัก — แก้ข้อมูลกิจการ, ดูคลิปทุกเวอร์ชัน, โหวต 👍/🔧 และคอมเมนต์ |
| `/script` | สไตล์ภาพที่ล็อกไว้ + ฉากปัญหา + บทพูดครบ 30 กิจการ |

## API

| Method | Path | ใช้ทำอะไร |
|---|---|---|
| GET | `/api/data` | ดึงทุกอย่าง (teams, members + assets + clips + feedback, script) |
| PATCH | `/api/members/[id]` | แก้ข้อมูลกิจการ (บันทึกลง `edits` ว่าใครแก้อะไร) |
| POST | `/api/feedback` | ส่งโหวต/คอมเมนต์ |
| POST | `/api/clips` | เพิ่มคลิปเวอร์ชันใหม่ |
| PATCH | `/api/clips` | เปลี่ยนสถานะคลิป (`draft` / `approved` / `rejected`) |

---

## โครงฐานข้อมูล

| ตาราง | เก็บอะไร |
|---|---|
| `teams` | 6 ทีม + สีประจำทีม |
| `members` | 30 กิจการ — **`highlight` คือหัวใจ** (จุดเด่นที่ใช้เขียนบทคลิป) |
| `assets` | ติดตามว่าแต่ละกิจการมีรูปหน้า/รูปข้าง/โลโก้/รูปสินค้า/e-card แล้วหรือยัง |
| `clips` | คลิปแยกเวอร์ชัน — regen กี่รอบก็เก็บครบ เทียบย้อนหลังได้ |
| `feedback` | โหวตและคอมเมนต์รายคน |
| `edits` | log ว่าใครแก้ฟิลด์ไหน จากอะไรเป็นอะไร |
| `script_sections` | สไตล์ภาพ เสียง โครงเรื่อง ฉากปัญหา |

---

## ที่มาของข้อมูล

`db/members.json` แกะมาจาก **e-card แนะนำตัวจริงทั้ง 30 ใบ** (`0-Docs/02_ภาพงานจริงแต่ละบริษัท/`)
ร่วมกับรูปสินค้าในโฟลเดอร์ `1-Teams/` — มีทั้งชื่อจริง ชื่อเล่น รหัสสมาชิก เบอร์ติดต่อ และจุดขายที่เจ้าของเขียนเอง

## สิ่งที่ยังต้องตามต่อ

- **SP Engineering** และ **L'EVIYA** — ยังไม่มีรูปหน้า/โลโก้/รูปสินค้าในโฟลเดอร์ (มีแต่ e-card)
- **Absolute 65**, **KBank SME** — ยังไม่มีรูปหน้าคน
- **จตุรงค์** — ยังไม่มีโลโก้และรูปสินค้า
- **Quality Flexpack** — คลิปเดิมทำเป็นซองอาหาร แต่ธุรกิจจริงคือกระสอบ/ถุงจัมโบ้ ต้อง regen
- **ศิรายุทธ**, **Broroma** — เพศเจ้าของใน e-card ไม่ตรงกับรูปในโฟลเดอร์ ต้องเช็ก
