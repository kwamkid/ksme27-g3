import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { member_id, clip_id, author, vote, message } = await req.json();
    if (!member_id) return Response.json({ error: "ต้องระบุกิจการ" }, { status: 400 });
    if (!message && !vote) return Response.json({ error: "ใส่ความเห็นหรือกดโหวตอย่างน้อยหนึ่งอย่าง" }, { status: 400 });

    // ต้องมีชื่อคนพูดเสมอ — ไม่งั้นตามกลับไม่ได้ว่าใครขอแก้
    const who = (author || "").trim().slice(0, 60);
    if (!who) {
      return Response.json({ error: "ใส่ชื่อเล่นของคุณที่มุมขวาบนก่อนนะครับ จะได้รู้ว่าใครคอมเมนต์" }, { status: 400 });
    }

    const [row] = await sql`
      insert into feedback (member_id, clip_id, author, vote, message)
      values (${member_id}, ${clip_id || null}, ${who},
              ${vote || null}, ${(message || "").slice(0, 2000)})
      returning *`;
    return Response.json({ ok: true, feedback: row });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

// ติ๊กว่าคอมเมนต์นี้ทำไปแล้วหรือยัง — กดสลับไปมาได้
export async function PATCH(req) {
  try {
    const { id, done, author } = await req.json();
    if (!id) return Response.json({ error: "ต้องระบุคอมเมนต์" }, { status: 400 });
    const who = (author || "").trim().slice(0, 60);

    const [row] = await sql`
      update feedback set
        done    = ${!!done},
        done_by = ${done ? who || null : null},
        done_at = ${done ? new Date().toISOString() : null}
      where id = ${Number(id)}
      returning *`;
    if (!row) return Response.json({ error: "ไม่พบคอมเมนต์นี้" }, { status: 404 });
    return Response.json({ ok: true, feedback: row });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    await sql`delete from feedback where id = ${Number(id)}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
