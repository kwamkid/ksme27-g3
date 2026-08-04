import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// ฟิลด์ที่ทุกคนแก้ได้
const EDITABLE = [
  "company_th", "company_en", "owner_name", "nickname", "gender", "code",
  "business", "highlight", "benefit", "products",
  "scene_idea", "dialogue_th", "contact", "note", "status",
];

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const author = (body.author || "ไม่ระบุชื่อ").slice(0, 60);

    const rows = await sql`select * from members where id = ${id}`;
    if (!rows.length) return Response.json({ error: "ไม่พบกิจการนี้" }, { status: 404 });
    const before = rows[0];

    const changed = [];
    for (const f of EDITABLE) {
      if (f in body && String(body[f] ?? "") !== String(before[f] ?? "")) {
        changed.push([f, before[f], body[f]]);
      }
    }
    if (!changed.length) return Response.json({ ok: true, changed: 0 });

    for (const [field, oldV, newV] of changed) {
      // ชื่อคอลัมน์ปลอดภัยเพราะกรองด้วย EDITABLE แล้ว ส่วนค่าใช้ placeholder
      // (@neondatabase/serverless v1 ต้องเรียก sql.query สำหรับ query ที่ไม่ใช่ tagged template)
      await sql.query(`update members set ${field} = $1, updated_at = now() where id = $2`, [newV, id]);
      await sql`insert into edits (member_id, author, field, old_value, new_value)
                values (${id}, ${author}, ${field}, ${oldV}, ${newV})`;
    }

    const [after] = await sql`select * from members where id = ${id}`;
    return Response.json({ ok: true, changed: changed.length, member: after });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
