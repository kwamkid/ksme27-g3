import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  ไม่พบ DATABASE_URL — ใส่ใน .env.local หรือ Environment Variables ของ Vercel");
}

export const sql = neon(process.env.DATABASE_URL);
