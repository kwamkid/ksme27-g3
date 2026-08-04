import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [teams, members, assets, clips, feedback, script] = await Promise.all([
      sql`select * from teams order by sort_order`,
      sql`select * from members order by team, sort_order`,
      sql`select * from assets`,
      sql`select * from clips order by member_id, version desc`,
      sql`select * from feedback order by created_at desc`,
      sql`select * from script_sections order by sort_order`,
    ]);

    const byId = Object.fromEntries(members.map((m) => [m.id, { ...m, assets: {}, clips: [], feedback: [] }]));
    for (const a of assets) if (byId[a.member_id]) byId[a.member_id].assets[a.kind] = a.has_it;
    for (const c of clips) if (byId[c.member_id]) byId[c.member_id].clips.push(c);
    for (const f of feedback) if (byId[f.member_id]) byId[f.member_id].feedback.push(f);

    const order = Object.fromEntries(teams.map((t, i) => [t.key, i]));
    const list = Object.values(byId).sort(
      (a, b) => (order[a.team] ?? 99) - (order[b.team] ?? 99) || a.sort_order - b.sort_order
    );

    return Response.json({ teams, members: list, script });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
