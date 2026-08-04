// เขียนบทพูดจาก db/dialogue.json ลง db/members.json (ต้นทาง) แล้วรายงานผล
// ใช้:  node db/apply-dialogue.mjs        แล้วตามด้วย  npm run seed:gen
import { readFileSync, writeFileSync } from "node:fs";

const dir = new URL(".", import.meta.url);
const membersPath = new URL("members.json", dir);

const lines = JSON.parse(readFileSync(new URL("dialogue.json", dir), "utf8"));
const members = JSON.parse(readFileSync(membersPath, "utf8"));

let changed = 0;
const unknown = new Set(Object.keys(lines).filter((k) => !k.startsWith("_")));

for (const m of members) {
  unknown.delete(m.id);
  const next = lines[m.id];
  if (!next) {
    console.log(`⚠️  ไม่มีบทพูดให้ ${m.id}`);
    continue;
  }
  if (m.dialogue_th !== next) {
    m.dialogue_th = next;
    changed++;
  }
}

if (unknown.size) console.log(`⚠️  id ที่ไม่มีใน members.json: ${[...unknown].join(", ")}`);

writeFileSync(membersPath, JSON.stringify(members, null, 2) + "\n");
console.log(`✅ อัปเดตบทพูด ${changed} กิจการ ลง db/members.json แล้ว`);
console.log("   ขั้นต่อไป: npm run seed:gen  (สร้าง db/seed.sql ใหม่)");
