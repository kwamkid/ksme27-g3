import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUSES = ["draft", "approved", "rejected"];

// ให้ members.status ตรงกับคลิปที่มีอยู่จริงเสมอ
async function syncMemberStatus(memberId) {
  await sql`
    update members m set status = case
      when exists (select 1 from clips c where c.member_id = m.id and c.status = 'approved') then 'approved'
      when exists (select 1 from clips c where c.member_id = m.id) then 'drafted'
      else 'todo'
    end, updated_at = now()
    where m.id = ${memberId}`;
}

// เพิ่มคลิปเวอร์ชันใหม่
export async function POST(req) {
  try {
    const { member_id, job_id, video_url, scene_th, dialogue_th, prompt_en } = await req.json();
    if (!member_id || !video_url) return Response.json({ error: "ต้องมี member_id และ video_url" }, { status: 400 });

    const [{ max }] = await sql`select coalesce(max(version),0) as max from clips where member_id = ${member_id}`;
    const [row] = await sql`
      insert into clips (member_id, version, job_id, video_url, scene_th, dialogue_th, prompt_en)
      values (${member_id}, ${Number(max) + 1}, ${job_id || null}, ${video_url},
              ${scene_th || null}, ${dialogue_th || null}, ${prompt_en || null})
      returning *`;
    await syncMemberStatus(member_id);
    return Response.json({ ok: true, clip: row });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

// เปลี่ยนสถานะคลิป — "ผ่าน" ได้ทีละเวอร์ชันเท่านั้น
export async function PATCH(req) {
  try {
    const { id, status, author } = await req.json();
    if (!STATUSES.includes(status)) {
      return Response.json({ error: `status ต้องเป็น ${STATUSES.join(" / ")}` }, { status: 400 });
    }

    const [row] = await sql`update clips set status = ${status} where id = ${Number(id)} returning *`;
    if (!row) return Response.json({ error: "ไม่พบคลิปนี้" }, { status: 404 });

    // เลือกได้เวอร์ชันเดียว — เวอร์ชันอื่นที่เคยผ่านให้ตกไป
    if (status === "approved") {
      await sql`
        update clips set status = 'rejected'
        where member_id = ${row.member_id} and id <> ${row.id} and status = 'approved'`;
    }

    await syncMemberStatus(row.member_id);

    // เก็บไว้ในประวัติว่าใครเป็นคนเปลี่ยนสถานะ
    const who = (author || "").trim().slice(0, 60);
    if (who) {
      const note =
        status === "approved" ? `เลือกเวอร์ชัน v${row.version} เป็นตัวที่ผ่าน`
        : status === "rejected" ? `ตีตก v${row.version}`
        : `ปลดสถานะผ่านของ v${row.version} กลับเป็นรอรีวิว`;
      await sql`
        insert into feedback (member_id, clip_id, author, vote, message)
        values (${row.member_id}, ${row.id}, ${who},
                ${status === "approved" ? "ok" : status === "rejected" ? "revise" : null}, ${note})`;
    }

    return Response.json({ ok: true, clip: row });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
