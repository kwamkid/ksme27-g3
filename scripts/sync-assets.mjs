// สแกนโฟลเดอร์ 1-Teams/ ของจริง แล้วอัปเดตตาราง assets ให้ตรง
// ตาราง assets ถูกบันทึกครั้งเดียวตอน seed พอมีคนส่งรูปเพิ่มทีหลัง หน้าเว็บก็ยังขึ้นว่า "ขาด" อยู่
//
// ใช้:  DATABASE_URL='postgresql://…' node scripts/sync-assets.mjs
//       เติม --dry เพื่อดูว่าจะเปลี่ยนอะไรบ้างโดยไม่เขียนจริง
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const ROOT = new URL("../../1-Teams/", import.meta.url).pathname;
const DRY = process.argv.includes("--dry");

// member_id → โฟลเดอร์ใน 1-Teams/
const FOLDERS = {
  "build-sirayooth": "1-BUILD/1.1-ศิรายุทธ",
  "build-sp-engineering": "1-BUILD/1.2-SP-Engineering",
  "build-broroma": "1-BUILD/1.3-Broroma",
  "build-nps-plus": "1-BUILD/1.4-NPS-Plus",
  "build-absolute65": "1-BUILD/1.5-Absolute65",
  "build-leo-residence": "1-BUILD/1.6-LEO-Residence",
  "make-pc-foil": "2-MAKE/2.1-PC-Foil",
  "make-foilmaster": "2-MAKE/2.2-Foilmaster",
  "make-quality-flexpack": "2-MAKE/2.3-Quality-Flexpack",
  "make-mastercrafts": "2-MAKE/2.4-Mastercrafts",
  "move-aps-commerce": "3-MOVE/3.1-APS-Commerce",
  "move-tpi": "3-MOVE/3.2-TPI",
  "move-atn": "3-MOVE/3.3-ATN",
  "move-jaturong": "3-MOVE/3.4-จตุรงค์",
  "move-ch-pattana": "3-MOVE/3.5-ช.พัฒนา",
  "grow-forth-smart": "4-GROW/4.1-Forth-Smart",
  "grow-kbank-sme": "4-GROW/4.2-KBank-SME",
  "grow-kbank-wealth": "4-GROW/4.3-KBank-Wealth",
  "grow-profess-rent": "4-GROW/4.4-Profess-Rent",
  "grow-tower-tactic": "4-GROW/4.5-Tower-Tactic",
  "live-damrong": "5-LIVE/5.1-กุ้งดำรงค์",
  "live-yoksod": "5-LIVE/5.2-หยกสด",
  "live-sirichai": "5-LIVE/5.3-ตราศิริชัย",
  "live-vejpong": "5-LIVE/5.4-เวชพงศ์",
  "live-aday-fresh": "5-LIVE/5.5-aDay-Fresh",
  "live-pchw": "5-LIVE/5.6-ปตท.ปากช่องไฮเวย์",
  "thrive-winds": "6-THRIVE/6.1-Winds-Hospital",
  "thrive-rebalance": "6-THRIVE/6.2-Rebalance",
  "thrive-joyous": "6-THRIVE/6.3-Joyous",
  "thrive-leviya": "6-THRIVE/6.4-LEVIYA",
};

const KINDS = ["face", "side", "logo", "product", "ecard"];

// ชื่อไฟล์ที่นับ: ขึ้นต้นด้วยชนิด แล้วตามด้วยอะไรก็ได้ที่ไม่ใช่ตัวอักษร
// ครอบทั้ง "face_x.jpg", "face 1_x.png", "Side 1_x.jpg", "LOGO Absolute65.png"
const matches = (name, kind) => new RegExp(`^${kind}[^a-z0-9ก-๙]`, "i").test(name);

const scan = (dir) => {
  const found = Object.fromEntries(KINDS.map((k) => [k, false]));
  if (!existsSync(dir)) return found;
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    for (const k of KINDS) if (matches(name, k)) found[k] = true;
  }
  return found;
};

if (!process.env.DATABASE_URL) {
  console.error("✗ ต้องตั้ง DATABASE_URL ก่อน (ดูใน .env.local)");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

const current = await sql`select member_id, kind, has_it from assets`;
const now = new Map(current.map((r) => [`${r.member_id}|${r.kind}`, r.has_it]));

const changes = [];
for (const [id, folder] of Object.entries(FOLDERS)) {
  const found = scan(join(ROOT, folder));
  for (const kind of KINDS) {
    const was = now.get(`${id}|${kind}`);
    if (was !== found[kind]) changes.push({ id, kind, was, next: found[kind] });
  }
}

if (!changes.length) {
  console.log("✅ ตาราง assets ตรงกับโฟลเดอร์จริงอยู่แล้ว ไม่มีอะไรต้องแก้");
  process.exit(0);
}

const TH = { face: "รูปหน้า", side: "รูปข้าง", logo: "โลโก้", product: "รูปสินค้า", ecard: "e-card" };
console.log(`พบ ${changes.length} จุดที่ไม่ตรง:`);
for (const c of changes) {
  console.log(`  ${c.next ? "＋" : "－"} ${c.id.padEnd(24)} ${TH[c.kind]}  (${c.was ? "เคยมี" : "เคยไม่มี"} → ${c.next ? "มีจริง" : "ไม่มีจริง"})`);
}

if (DRY) {
  console.log("\n(--dry ไม่ได้เขียนอะไรลงฐานข้อมูล)");
  process.exit(0);
}

for (const c of changes) {
  await sql`
    insert into assets (member_id, kind, has_it) values (${c.id}, ${c.kind}, ${c.next})
    on conflict (member_id, kind) do update set has_it = excluded.has_it`;
}
console.log(`\n✅ อัปเดต assets ${changes.length} รายการแล้ว`);
