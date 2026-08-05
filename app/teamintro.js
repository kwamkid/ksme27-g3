"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./icons";

/**
 * คลิปเปิดตัวของแต่ละทีม (คลิป "ปัญหา" ของ 6 สาย)
 * teams = แถวจากตาราง teams ที่มี intro_url
 * รูปปกอ่านจาก public/team/<KEY>.webp — สร้างด้วย bash scripts/team-posters.sh
 * (ถ้าปล่อยให้ <video> โหลดเฟรมแรกเอง เปิดหน้าแรกทีเดียวกินไป 15 MB)
 */
export default function TeamIntro({ teams, count }) {
  const list = (teams || []).filter((t) => t.intro_url);
  const [at, setAt] = useState(null); // ลำดับคลิปที่เปิดอยู่ · null = ปิด
  const vid = useRef(null);

  const n = list.length;
  const cur = at === null ? null : list[at];

  // Esc ปิด · ลูกศรซ้ายขวาเปลี่ยนทีม · ล็อกไม่ให้หน้าหลังเลื่อนตาม
  useEffect(() => {
    if (at === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setAt(null);
      if (e.key === "ArrowLeft") setAt((x) => (x - 1 + n) % n);
      if (e.key === "ArrowRight") setAt((x) => (x + 1) % n);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [at, n]);

  // เปลี่ยนทีมโดยไม่สร้าง <video> ใหม่ — กันจอดำแวบเหมือนแถบโชว์ผลงาน
  useEffect(() => {
    const v = vid.current;
    if (!v || !cur) return;
    v.src = cur.intro_url;
    v.load();
    v.play().catch(() => {});
  }, [cur?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!n) return null;

  return (
    <section className="intro">
      <div className="team-head">
        <span className="dot" style={{ background: "#a78bfa" }} />
        <h2>คลิปเปิดตัว {n} ทีม</h2>
        <small>คลิปปัญหาของแต่ละสาย — กดที่รูปเพื่อดู</small>
      </div>

      <div className="intro-grid">
        {list.map((t, i) => (
          <button
            key={t.key}
            className="intro-card"
            style={{ "--tc": t.color || "#64748b" }}
            onClick={() => setAt(i)}
            aria-label={`ดูคลิปเปิดตัวทีม ${t.key}`}
          >
            <span className="intro-thumb">
              <img
                src={`/team/${t.key}.webp`}
                alt=""
                loading="lazy"
                onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
              />
              <span className="intro-play"><Icon name="play" /></span>
              <span className="intro-key">{t.key}</span>
            </span>
            <span className="intro-txt">
              <b>{t.name_th}</b>
              <small>{t.tagline}</small>
              {count?.[t.key] > 0 && <span className="intro-n">{count[t.key]} กิจการ</span>}
            </span>
          </button>
        ))}
      </div>

      {cur && (
        <div className="lb" onClick={() => setAt(null)}>
          <div className="lb-box intro-box" onClick={(e) => e.stopPropagation()}>
            <div className="lb-head">
              <span className="dot" style={{ background: cur.color, marginTop: 5 }} />
              <div className="lb-title">
                <b>{cur.key} · {cur.name_th}</b>
                <span>{cur.tagline}</span>
              </div>
              <button className="lb-x" onClick={() => setAt(null)}>ปิด</button>
            </div>

            <div className="intro-stage">
              <video ref={vid} poster={`/team/${cur.key}.webp`} controls autoPlay playsInline preload="auto" />
              {n > 1 && (
                <>
                  <button className="reel-nav left" onClick={() => setAt((x) => (x - 1 + n) % n)} aria-label="ทีมก่อนหน้า">
                    <Icon name="prev" />
                  </button>
                  <button className="reel-nav right" onClick={() => setAt((x) => (x + 1) % n)} aria-label="ทีมถัดไป">
                    <Icon name="next" />
                  </button>
                </>
              )}
            </div>

            <div className="intro-foot">
              <div className="intro-dots">
                {list.map((t, i) => (
                  <button
                    key={t.key}
                    className={`intro-dot ${i === at ? "on" : ""}`}
                    style={{ "--tc": t.color }}
                    onClick={() => setAt(i)}
                  >
                    {t.key}
                  </button>
                ))}
              </div>
              <a className="intro-go" href={`/?team=${cur.key}`} style={{ "--tc": cur.color }}>
                ดูกิจการในทีมนี้ <Icon name="arrowRight" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
