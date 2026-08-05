"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./icons";

/**
 * คลิปเปิดตัวของแต่ละทีม — เล่นต่อกันเป็นตอน
 *   ตอนที่ 1 ฉากปัญหา (teams.intro_url) → ตอนที่ 2 เปิดตัวทีม (teams.hero_url)
 * ทีมที่ยังไม่มีตอนที่ 2 ก็เล่นแค่ตอนเดียว
 *
 * รูปปกอ่านจาก public/team/<KEY>.webp และ <KEY>-2.webp
 * สร้างด้วย bash scripts/team-posters.sh
 * (ถ้าปล่อยให้ <video> โหลดเฟรมแรกเอง เปิดหน้าทีเดียวกินไป 15 MB)
 */

const partsOf = (t) =>
  [
    t.intro_url && { url: t.intro_url, label: "ฉากปัญหา", poster: `/team/${t.key}.webp` },
    t.hero_url && { url: t.hero_url, label: "เปิดตัวทีม", poster: `/team/${t.key}-2.webp` },
  ].filter(Boolean);

export default function TeamIntro({ teams, count }) {
  const list = (teams || []).filter((t) => t.intro_url);
  const [at, setAt] = useState(null); // ทีมที่เปิดอยู่ · null = ปิด
  const [part, setPart] = useState(0); // ตอนที่กำลังเล่น
  const vid = useRef(null);

  const n = list.length;
  const cur = at === null ? null : list[at];
  const parts = cur ? partsOf(cur) : [];
  const clip = parts[Math.min(part, parts.length - 1)] || null;

  const goTeam = (step) => { setAt((x) => (x + step + n) % n); setPart(0); };
  const openTeam = (i) => { setAt(i); setPart(0); };

  // Esc ปิด · ลูกศรซ้ายขวาเปลี่ยนทีม · ล็อกไม่ให้หน้าหลังเลื่อนตาม
  useEffect(() => {
    if (at === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setAt(null);
      if (e.key === "ArrowLeft") goTeam(-1);
      if (e.key === "ArrowRight") goTeam(1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [at, n]); // eslint-disable-line react-hooks/exhaustive-deps

  // เปลี่ยนคลิปโดยไม่สร้าง <video> ใหม่ — กันจอดำแวบตอนต่อตอน
  useEffect(() => {
    const v = vid.current;
    if (!v || !clip) return;
    v.src = clip.url;
    v.load();
    v.play().catch(() => {});
  }, [clip?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!n) return null;

  return (
    <section className="intro">
      <div className="team-head">
        <span className="dot" style={{ background: "#a78bfa" }} />
        <h2>คลิปเปิดตัว {n} ทีม</h2>
        <small>ฉากปัญหาแล้วต่อด้วยทีมมาจัดการ — กดที่รูปเพื่อดู</small>
      </div>

      <div className="intro-grid">
        {list.map((t, i) => {
          const np = partsOf(t).length;
          return (
            <button
              key={t.key}
              className="intro-card"
              style={{ "--tc": t.color || "#64748b" }}
              onClick={() => openTeam(i)}
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
                {np > 1 && <span className="intro-parts">{np} ตอน</span>}
              </span>
              <span className="intro-txt">
                <b>{t.name_th}</b>
                <small>{t.tagline}</small>
                {count?.[t.key] > 0 && <span className="intro-n">{count[t.key]} กิจการ</span>}
              </span>
            </button>
          );
        })}
      </div>

      {cur && clip && (
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
              <video
                ref={vid}
                poster={clip.poster}
                controls
                autoPlay
                playsInline
                preload="auto"
                onEnded={() => part < parts.length - 1 && setPart(part + 1)}
              />
              {/* โหลดตอนถัดไปดักไว้ พอจบตอนแรกจะได้ต่อเลยไม่ต้องรอ */}
              {parts[part + 1] && (
                <video className="reel-prefetch" src={parts[part + 1].url} preload="auto" muted playsInline />
              )}
              {n > 1 && (
                <>
                  <button className="reel-nav left" onClick={() => goTeam(-1)} aria-label="ทีมก่อนหน้า">
                    <Icon name="prev" />
                  </button>
                  <button className="reel-nav right" onClick={() => goTeam(1)} aria-label="ทีมถัดไป">
                    <Icon name="next" />
                  </button>
                </>
              )}
            </div>

            {parts.length > 1 && (
              <div className="intro-parts-bar">
                {parts.map((p, i) => (
                  <button
                    key={p.url}
                    className={`intro-part ${i === part ? "on" : ""}`}
                    style={{ "--tc": cur.color }}
                    onClick={() => setPart(i)}
                  >
                    <b>{i + 1}</b> {p.label}
                  </button>
                ))}
              </div>
            )}

            <div className="intro-foot">
              <div className="intro-dots">
                {list.map((t, i) => (
                  <button
                    key={t.key}
                    className={`intro-dot ${i === at ? "on" : ""}`}
                    style={{ "--tc": t.color }}
                    onClick={() => openTeam(i)}
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
