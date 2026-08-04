import { neon } from "@neondatabase/serverless";

// สร้าง client ตอนถูกเรียกใช้จริง ไม่ใช่ตอน import
// เพราะ `next build` จะ import ไฟล์ route ทุกตัวตอน "Collecting page data"
// ถ้าสร้างตอน import แล้ว DATABASE_URL หาย/ผิด จะพัง build ทั้งก้อน
// (แทนที่จะเป็นแค่ API ตัวนั้นตอบ error ตอน runtime)
let cached;

function client() {
  if (cached) return cached;

  // เผื่อกรณีวางค่าใน Vercel แล้วติดเครื่องหมายคำพูดมาด้วย เช่น 'postgresql://…'
  const url = (process.env.DATABASE_URL || "").trim().replace(/^['"]|['"]$/g, "");

  if (!url) {
    throw new Error(
      "ยังไม่ได้ตั้ง DATABASE_URL — ใส่ใน .env.local (เครื่องตัวเอง) หรือ Settings → Environment Variables ของ Vercel"
    );
  }
  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error(
      "DATABASE_URL ไม่ใช่ connection string ที่ถูกต้อง — ต้องขึ้นต้นด้วย postgresql:// และห้ามมีเครื่องหมายคำพูดครอบ"
    );
  }

  cached = neon(url);
  return cached;
}

// ใช้ได้ทั้งแบบ tagged template  sql`select …`
// และแบบ query ที่มี placeholder  sql.query("… $1", [v])
export function sql(strings, ...values) {
  return client()(strings, ...values);
}
sql.query = (text, params) => client().query(text, params);
