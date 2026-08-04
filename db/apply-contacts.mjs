// ข้อมูลติดต่อของสมาชิก (เบอร์/อีเมล) ไม่ขึ้น git เพราะ repo เป็น public
// เก็บไว้ที่ db/contacts.local.json (อยู่ใน .gitignore) แล้วยิงเข้าฐานข้อมูลด้วยไฟล์นี้
//
// ใช้:  DATABASE_URL='postgresql://…' node db/apply-contacts.mjs
// (จำเป็นเฉพาะตอน seed ฐานข้อมูลใหม่ — ของเดิมในฐานข้อมูลไม่ได้ถูกลบ)
import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const path = new URL("contacts.local.json", import.meta.url);
if (!existsSync(path)) {
  console.error("✗ ไม่พบ db/contacts.local.json — ไฟล์นี้ไม่ขึ้น git ต้องขอจากเครื่องที่มี");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("✗ ต้องตั้ง DATABASE_URL ก่อน (ดูใน .env.local)");
  process.exit(1);
}

const contacts = JSON.parse(readFileSync(path, "utf8"));
const sql = neon(process.env.DATABASE_URL);

let n = 0;
for (const [id, contact] of Object.entries(contacts)) {
  if (id.startsWith("_") || !contact) continue;
  const rows = await sql`update members set contact = ${contact} where id = ${id} returning id`;
  n += rows.length;
}
console.log(`✅ ใส่ข้อมูลติดต่อกลับเข้าฐานข้อมูล ${n} กิจการ`);
