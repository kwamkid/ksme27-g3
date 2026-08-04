"use client";
import { useEffect, useState } from "react";

const STATUS_TH = {
  approved: "✅ ผ่านแล้ว",
  rejected: "❌ ต้องแก้",
  draft: "🎬 รอรีวิว",
};

/**
 * กล่องดูคลิปแบบ lightbox
 * open = { title, sub, clips: [{id, version, status, video_url}], memberId }  หรือ null
 */
export default function Lightbox({ open, onClose }) {
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => setI(0), [open?.memberId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const clips = open.clips || [];
  const clip = clips[i];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(clip.video_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* เบราว์เซอร์ไม่ให้ copy — ผู้ใช้กด "เปิดแท็บใหม่" แทนได้ */
    }
  };

  return (
    <div className="lb" onClick={onClose}>
      <div className="lb-box" onClick={(e) => e.stopPropagation()}>
        <div className="lb-head">
          <div className="lb-title">
            <b>{open.title}</b>
            {open.sub && <span>{open.sub}</span>}
          </div>
          <button className="lb-x" onClick={onClose} aria-label="ปิด">✕</button>
        </div>

        {clip ? (
          <>
            <video key={clip.id} src={clip.video_url} controls autoPlay playsInline preload="metadata" />

            {clip.dialogue_th && <p className="lb-note">🗣 {clip.dialogue_th}</p>}

            {clips.length > 1 && (
              <div className="lb-vers">
                <span className="lb-verslabel">{clips.length} เวอร์ชัน — กดเทียบได้</span>
                {clips.map((c, n) => (
                  <button
                    key={c.id}
                    className={`chip ${n === i ? "on" : ""}`}
                    onClick={() => setI(n)}
                    title={c.dialogue_th || undefined}
                  >
                    v{c.version} · {STATUS_TH[c.status] || c.status}
                  </button>
                ))}
              </div>
            )}

            <div className="lb-foot">
              <span className={`pill ${clip.status === "approved" ? "ok" : clip.status === "rejected" ? "todo" : "draft"}`}>
                v{clip.version} · {STATUS_TH[clip.status] || clip.status}
              </span>
              <input className="lb-url" value={clip.video_url} readOnly onFocus={(e) => e.target.select()} />
              <button className="ghost" onClick={copy}>{copied ? "คัดลอกแล้ว ✓" : "คัดลอกลิงก์"}</button>
              <a className="btnlink" href={clip.video_url} target="_blank" rel="noreferrer">เปิดแท็บใหม่ ↗</a>
              {open.memberId && <a className="btnlink" href={`/member/${open.memberId}`}>หน้ากิจการ →</a>}
            </div>
          </>
        ) : (
          <div className="lb-empty">ยังไม่มีคลิปสำหรับกิจการนี้</div>
        )}
      </div>
    </div>
  );
}
