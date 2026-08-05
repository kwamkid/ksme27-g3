"use client";
import { useEffect, useState } from "react";
import { getMe } from "./me";
import Icon from "./icons";
import { workStatus } from "@/lib/status";

const ST = {
  approved: { t: "ผ่านแล้ว", cls: "ok", icon: "check" },
  rejected: { t: "ตกไป", cls: "todo", icon: "x" },
  draft: { t: "รอรีวิว", cls: "draft", icon: "clip" },
};

/**
 * หน้ารีวิวคลิป — เลือกเวอร์ชัน ดูคลิป ติ๊กว่าผ่าน คอมเมนต์ และดูประวัติ
 * member = ข้อมูลกิจการหนึ่งราย (มี clips + feedback) หรือ null = ปิด
 */
export default function Lightbox({ member, onClose, onChanged }) {
  const [curId, setCurId] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const clips = member?.clips || [];

  useEffect(() => {
    setCurId(clips[0]?.id ?? null);
    setText("");
    setErr("");
  }, [member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!member) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [member, onClose]);

  if (!member) return null;

  const clip = clips.find((c) => c.id === curId) || clips[0] || null;
  const work = workStatus(member);
  const verOf = Object.fromEntries(clips.map((c) => [c.id, c.version]));
  const history = member.feedback || [];

  const setStatus = async (status) => {
    setBusy(true); setErr("");
    const r = await fetch("/api/clips", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: clip.id, status, author: getMe() }),
    }).then((x) => x.json()).catch((e) => ({ error: String(e) }));
    setBusy(false);
    if (r.error) return setErr(r.error);
    onChanged?.();
  };

  const toggleDone = async (f) => {
    setBusy(true); setErr("");
    const r = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: f.id, done: !f.done, author: getMe() }),
    }).then((x) => x.json()).catch((e) => ({ error: String(e) }));
    setBusy(false);
    if (r.error) return setErr(r.error);
    onChanged?.();
  };

  const removeFeedback = async (id) => {
    setBusy(true); setErr("");
    const r = await fetch(`/api/feedback?id=${id}`, { method: "DELETE" })
      .then((x) => x.json()).catch((e) => ({ error: String(e) }));
    setBusy(false);
    if (r.error) return setErr(r.error);
    onChanged?.();
  };

  const send = async () => {
    const author = getMe().trim();
    if (!author) return setErr("ใส่ชื่อเล่นของคุณที่มุมขวาบนก่อนนะครับ จะได้รู้ว่าใครคอมเมนต์");
    if (!text.trim()) return;
    setBusy(true); setErr("");
    const r = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ member_id: member.id, clip_id: clip?.id ?? null, author, message: text }),
    }).then((x) => x.json()).catch((e) => ({ error: String(e) }));
    setBusy(false);
    if (r.error) return setErr(r.error);
    setText("");
    onChanged?.();
  };

  return (
    <div className="lb" onClick={onClose}>
      <div className="lb-box" onClick={(e) => e.stopPropagation()}>
        <div className="lb-head">
          <div className="lb-title">
            <b>{member.company_th || member.company_en}</b>
            <span>
              {member.owner_name} {member.nickname && `(${member.nickname})`} · ทีม {member.team}
            </span>
            <span className={`pill ${work.cls} lb-work`}>
              <Icon name={work.icon} /> {work.label}
            </span>
          </div>
          <button className="lb-x" onClick={onClose} aria-label="ปิด">✕</button>
        </div>

        {err && <div className="msg err">{err}</div>}

        {!clip ? (
          <div className="lb-empty">ยังไม่มีคลิปสำหรับกิจการนี้</div>
        ) : (
          <>
            {clips.length > 1 && (
              <div className="lb-vers">
                {clips.map((c) => (
                  <button
                    key={c.id}
                    className={`chip ${c.id === clip.id ? "on" : ""}`}
                    onClick={() => setCurId(c.id)}
                  >
                    v{c.version} <Icon name={(ST[c.status] || {}).icon} />
                  </button>
                ))}
              </div>
            )}

            <video key={clip.id} src={clip.video_url} controls autoPlay playsInline preload="metadata" />

            <div className="lb-meta">
              <span className={`pill ${(ST[clip.status] || {}).cls}`}>
                v{clip.version} · {(ST[clip.status] || {}).t || clip.status}
              </span>
              {clip.dialogue_th && <span className="lb-say"><Icon name="mic" /> {clip.dialogue_th}</span>}
            </div>

            <div className="lb-act">
              <button
                className={`appr ${clip.status === "approved" ? "on" : ""}`}
                disabled={busy}
                onClick={() => setStatus(clip.status === "approved" ? "draft" : "approved")}
              >
                {clip.status === "approved" && <Icon name="check" />} เอาอันนี้ (v{clip.version})
              </button>
              <span className="dimtext">
                {clip.status === "approved"
                  ? "กดอีกครั้งเพื่อยกเลิก"
                  : "เลือกได้เวอร์ชันเดียว — ติ๊กใหม่ตัวเก่าจะตกไปเอง"}
              </span>
            </div>
          </>
        )}

        {/* ───── คอมเมนต์เวอร์ชันนี้ ───── */}
        <div className="lb-say-box">
          <div className="lb-sub">คอมเมนต์{clip ? ` v${clip.version}` : ""}</div>
          <textarea
            rows={2}
            placeholder="เช่น พูดเร็วไป / อยากให้ฉากสว่างกว่านี้ / ชื่อบริษัทออกเสียงผิด"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button disabled={busy || !text.trim()} onClick={send}>
            {busy ? "กำลังส่ง…" : "ส่งความเห็น"}
          </button>
        </div>

        {/* ───── ประวัติ ───── */}
        <div className="lb-hist">
          <div className="lb-sub">ประวัติ ({history.length})</div>
          {history.length === 0 && <div className="dimtext">ยังไม่มีใครคอมเมนต์</div>}
          {history.map((f) => (
            <div className={`fb ${f.done ? "isdone" : ""}`} key={f.id}>
              <div className="who">
                {f.author}
                {f.clip_id && verOf[f.clip_id] ? ` · v${verOf[f.clip_id]}` : ""} ·{" "}
                {new Date(f.created_at).toLocaleString("th-TH")}{" "}
                
                {f.author === getMe().trim() && (
                  <button className="lb-del" disabled={busy} onClick={() => removeFeedback(f.id)}>
                    ลบ
                  </button>
                )}
              </div>
              {f.message}
              <div className="fb-done">
                <button className={`dn ${f.done ? "on" : ""}`} disabled={busy} onClick={() => toggleDone(f)}>
                  <><Icon name={f.done ? "boxChecked" : "box"} /> {f.done ? "ทำแล้ว" : "ยังไม่ได้ทำ"}</>
                </button>
                {f.done && f.done_by && (
                  <span className="dimtext">
                    โดย {f.done_by}
                    {f.done_at ? ` · ${new Date(f.done_at).toLocaleString("th-TH")}` : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
