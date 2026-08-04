"use client";
import { use, useEffect, useState } from "react";
import { getMe } from "../../me";

const FIELDS = [
  ["company_th", "ชื่อกิจการ (ไทย)", 1],
  ["owner_name", "ชื่อ-นามสกุลเจ้าของ", 1],
  ["nickname", "ชื่อเล่น", 1],
  ["business", "ทำธุรกิจอะไร", 3],
  ["highlight", "⭐ จุดเด่น (สำคัญที่สุด — ใช้เขียนบทคลิป)", 5],
  ["benefit", "ลูกค้าได้อะไร", 3],
  ["products", "สินค้า/บริการหลัก", 3],
  ["scene_idea", "🎬 ฉากในคลิป (signature move)", 5],
  ["dialogue_th", "🗣 บทพูดไทยในคลิป", 2],
  ["contact", "ติดต่อ", 1],
  ["note", "หมายเหตุ", 2],
];

export default function MemberPage({ params }) {
  const { id } = use(params);
  const [m, setM] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [vote, setVote] = useState(null);
  const [comment, setComment] = useState("");

  const load = () =>
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.members || []).find((x) => x.id === id);
        setM(found || null);
        if (found) setForm(Object.fromEntries(FIELDS.map(([f]) => [f, found[f] ?? ""])));
      });

  useEffect(() => { load(); }, [id]);

  if (!m) return <div className="wrap dimtext">กำลังโหลด…</div>;

  const dirty = FIELDS.some(([f]) => String(form[f] ?? "") !== String(m[f] ?? ""));

  const save = async () => {
    setSaving(true);
    const r = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, author: getMe() }),
    }).then((x) => x.json());
    setSaving(false);
    setMsg(r.error ? { t: "err", m: r.error } : { t: "ok", m: `บันทึกแล้ว ${r.changed} ช่อง` });
    if (!r.error) load();
  };

  const send = async () => {
    if (!vote && !comment.trim()) return;
    const r = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        member_id: id,
        clip_id: m.clips[0]?.id || null,
        author: getMe(),
        vote,
        message: comment,
      }),
    }).then((x) => x.json());
    if (r.error) return setMsg({ t: "err", m: r.error });
    setComment(""); setVote(null); load();
  };

  return (
    <div className="wrap">
      <a href="/" className="dimtext">← กลับแดชบอร์ด</a>
      <h2 style={{ margin: "10px 0 2px" }}>{m.company_th}</h2>
      <div className="dimtext" style={{ marginBottom: 18 }}>
        {m.company_en} · {m.owner_name} {m.nickname && `(${m.nickname})`} · ทีม {m.team} {m.code && `· ${m.code}`}
      </div>

      {msg && <div className={`msg ${msg.t}`}>{msg.m}</div>}

      <div className="detail">
        <div>
          <div className="box">
            <h3>ข้อมูลกิจการ — ทุกคนแก้ได้</h3>
            {FIELDS.map(([f, label, rows]) => (
              <div className="field" key={f}>
                <label>{label}</label>
                {rows > 1 ? (
                  <textarea rows={rows} value={form[f] ?? ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                ) : (
                  <input value={form[f] ?? ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                )}
              </div>
            ))}
            <button onClick={save} disabled={!dirty || saving}>
              {saving ? "กำลังบันทึก…" : dirty ? "💾 บันทึกการแก้ไข" : "ไม่มีอะไรเปลี่ยน"}
            </button>
            <div className="dimtext" style={{ marginTop: 9 }}>
              ระบบเก็บประวัติไว้ว่าใครแก้อะไร — ใส่ชื่อคุณมุมขวาบนก่อนแก้นะครับ
            </div>
          </div>
        </div>

        <div>
          <div className="box">
            <h3>คลิป</h3>
            {m.clips.length === 0 && <div className="dimtext">ยังไม่มีคลิป</div>}
            {m.clips.map((c) => (
              <div key={c.id} style={{ marginBottom: 14 }}>
                <div className="dimtext" style={{ marginBottom: 5 }}>
                  v{c.version} · {c.status === "approved" ? "✅ ผ่านแล้ว" : c.status === "rejected" ? "❌ ต้องแก้" : "🎬 รอรีวิว"}
                </div>
                <video src={c.video_url} controls preload="metadata" />
              </div>
            ))}
          </div>

          <div className="box">
            <h3>ความเห็นของทีม ({m.feedback.length})</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button className={`vote ${vote === "ok" ? "on-ok" : ""}`} onClick={() => setVote(vote === "ok" ? null : "ok")}>👍 ตรงแล้ว</button>
              <button className={`vote ${vote === "revise" ? "on-rev" : ""}`} onClick={() => setVote(vote === "revise" ? null : "revise")}>🔧 ขอแก้</button>
            </div>
            <div className="field">
              <textarea rows={3} placeholder="เช่น ไม่ชอบ action นี้ อยากให้เป็นแบบ…" value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            <button onClick={send} disabled={!vote && !comment.trim()}>ส่งความเห็น</button>

            <div style={{ marginTop: 14 }}>
              {m.feedback.map((f) => (
                <div className="fb" key={f.id}>
                  <div className="who">
                    {f.author} · {new Date(f.created_at).toLocaleString("th-TH")}{" "}
                    {f.vote === "ok" ? "👍" : f.vote === "revise" ? "🔧" : ""}
                  </div>
                  {f.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
