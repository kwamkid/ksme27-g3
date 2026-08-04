import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

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
    return Response.json({ ok: true, clip: row });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

// เปลี่ยนสถานะคลิป
export async function PATCH(req) {
  try {
    const { id, status } = await req.json();
    const [row] = await sql`update clips set status = ${status} where id = ${Number(id)} returning *`;
    return Response.json({ ok: true, clip: row });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
