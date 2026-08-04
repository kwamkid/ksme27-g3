"use client";
import { useEffect, useMemo, useState } from "react";
import { avatarSrc, ownerSrc, logoSrc, heroSrc } from "@/lib/assets";
import Lightbox from "./lightbox";

// 2 = มีแล้ว · 1 = มีไฟล์แต่ยังใช้บนเว็บไม่ได้ (เช่น .ai) · 0 = ยังไม่มี
const CHECKS = [
  { key: "char", label: "ตัวละคร" },
  { key: "highlight", label: "จุดเด่น" },
  { key: "face", label: "รูปหน้า" },
  { key: "side", label: "รูปข้าง" },
  { key: "logo", label: "โลโก้" },
  { key: "product", label: "รูปสินค้า" },
  { key: "ecard", label: "e-card" },
];

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "clip", label: "มีคลิปแล้ว" },
  { key: "noclip", label: "ยังไม่มีคลิป" },
  { key: "missing", label: "ยังขาดของ" },
  { key: "nochar", label: "ยังไม่มีตัวละคร" },
];

const CLIP_TH = { approved: "ผ่านแล้ว", rejected: "ต้องแก้", draft: "รอรีวิว" };

export default function Directory() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [view, setView] = useState("cards");
  const [team, setTeam] = useState(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [lbId, setLbId] = useState(null);

  const load = () =>
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch((e) => setErr(String(e)));

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.members.map((m) => {
      const char = avatarSrc(m.id);
      const logo = logoSrc(m.id);
      const checks = {
        char: char ? 2 : 0,
        highlight: m.highlight ? 2 : 0,
        face: m.assets.face ? 2 : 0,
        side: m.assets.side ? 2 : 0,
        logo: m.assets.logo ? (logo ? 2 : 1) : 0,
        product: m.assets.product ? 2 : 0,
        ecard: m.assets.ecard ? 2 : 0,
      };
      const latest = m.clips[0] || null;
      return {
        ...m,
        char,
        logo,
        owner: ownerSrc(m.id),
        checks,
        missing: CHECKS.filter((c) => checks[c.key] < 2).map((c) => c.label),
        latest,
        approved: m.clips.some((c) => c.status === "approved"),
      };
    });
  }, [data]);

  const teamOf = useMemo(
    () => Object.fromEntries((data?.teams || []).map((t) => [t.key, t])),
    [data]
  );

  const teamOrder = useMemo(
    () => Object.fromEntries((data?.teams || []).map((t, i) => [t.key, i])),
    [data]
  );

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const list = rows.filter((m) => {
      if (team && m.team !== team) return false;
      if (filter === "clip" && !m.clips.length) return false;
      if (filter === "noclip" && m.clips.length) return false;
      if (filter === "missing" && !m.missing.length) return false;
      if (filter === "nochar" && m.char) return false;
      if (!kw) return true;
      return [m.company_th, m.company_en, m.owner_name, m.nickname, m.code, m.business]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(kw);
    });

    // เรียง: มีคลิปเยอะสุดก่อน → ตามลำดับทีม → ของครบมากสุด
    return list.sort(
      (a, b) =>
        b.clips.length - a.clips.length ||
        (teamOrder[a.team] ?? 99) - (teamOrder[b.team] ?? 99) ||
        a.missing.length - b.missing.length ||
        a.sort_order - b.sort_order
    );
  }, [rows, team, filter, q, teamOrder]);

  if (err)
    return (
      <div className="wrap">
        <div className="msg err">
          โหลดข้อมูลไม่ได้: {err}
          <br />
          <span className="dimtext">เช็กว่าตั้ง DATABASE_URL แล้ว และรัน db/schema.sql + db/seed.sql ใน Neon แล้วหรือยัง</span>
        </div>
      </div>
    );
  if (!data) return <div className="wrap dimtext">กำลังโหลด…</div>;

  const total = rows.length;
  const approved = rows.filter((m) => m.approved).length;
  const withClip = rows.filter((m) => m.clips.length).length;
  const withChar = rows.filter((m) => m.char).length;
  const needStuff = rows.filter((m) => m.missing.length).length;
  const comments = rows.reduce((n, m) => n + m.feedback.length, 0);

  const lbMember = rows.find((m) => m.id === lbId) || null;

  const countOf = (key) =>
    rows.filter((m) => {
      if (team && m.team !== team) return false;
      if (key === "clip") return m.clips.length > 0;
      if (key === "noclip") return m.clips.length === 0;
      if (key === "missing") return m.missing.length > 0;
      if (key === "nochar") return !m.char;
      return true;
    }).length;

  return (
    <div className="wrap">
      {/* ───── สรุปภาพรวม ───── */}
      <div className="progress-bar" title={`คลิปผ่านแล้ว ${approved}/${total}`}>
        <div style={{ width: `${(approved / total) * 100}%` }} />
      </div>

      <div className="stats">
        <div className="stat"><b>{approved}/{total}</b><span>คลิปผ่านแล้ว</span></div>
        <div className="stat"><b>{withClip}</b><span>กิจการที่มีคลิปแล้ว</span></div>
        <div className="stat"><b>{withChar}/{total}</b><span>มีตัวละครแล้ว</span></div>
        <div className="stat"><b>{needStuff}</b><span>ยังขาดของ</span></div>
        <div className="stat"><b>{comments}</b><span>ความเห็นทั้งหมด</span></div>
      </div>

      {/* ───── แถบค้นหา + ตัวกรอง ───── */}
      <section>
        <div className="team-head">
          <span className="dot" style={{ background: "#60a5fa" }} />
          <h2>ทำเนียบ 30 กิจการ</h2>
          <small>แสดง {shown.length} จาก {total} กิจการ</small>
        </div>

        <div className="toolbar">
          <input
            className="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาชื่อกิจการ / เจ้าของ / ชื่อเล่น / รหัส…"
          />
          <div className="views">
            <button className={`chip ${view === "cards" ? "on" : ""}`} onClick={() => setView("cards")}>🗂 การ์ด</button>
            <button className={`chip ${view === "table" ? "on" : ""}`} onClick={() => setView("table")}>📋 ตารางเช็กของ</button>
          </div>
        </div>

        <div className="chips">
          <button className={`chip ${!team ? "on" : ""}`} onClick={() => setTeam(null)}>ทุกทีม</button>
          {data.teams.map((t) => (
            <button
              key={t.key}
              className={`chip ${team === t.key ? "on" : ""}`}
              style={team === t.key ? { borderColor: t.color, color: t.color } : undefined}
              onClick={() => setTeam(team === t.key ? null : t.key)}
            >
              <span className="dot sm" style={{ background: t.color }} />
              {t.key}
            </button>
          ))}
        </div>

        <div className="chips">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip ${filter === f.key ? "on" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label} <em>{countOf(f.key)}</em>
            </button>
          ))}
        </div>

        {shown.length === 0 && <div className="box dimtext">ไม่เจอกิจการที่ตรงกับที่กรองไว้</div>}

        {/* ───── มุมมองการ์ด ───── */}
        {view === "cards" && (
          <div className="dir-grid">
            {shown.map((m) => {
              const t = teamOf[m.team] || {};
              return (
                <article key={m.id} className="dir" style={{ "--tc": t.color || "#64748b" }}>
                  <div className="dir-cover">
                    {m.char ? (
                      <img className="dir-char" src={m.char} alt={`ตัวละคร ${m.company_th}`} loading="lazy" />
                    ) : (
                      <>
                        <img className="dir-char ghost" src={heroSrc(m.team)} alt="" loading="lazy" />
                        <span className="dir-nochar">ยังไม่มีตัวละคร</span>
                      </>
                    )}
                    <span className="dir-team">{m.team}</span>
                    {m.logo && (
                      <span className="dir-logo">
                        <img src={m.logo} alt={`โลโก้ ${m.company_th}`} loading="lazy" />
                      </span>
                    )}
                    <span className="dir-face">
                      {m.owner ? (
                        <img src={m.owner} alt={`เจ้าของ ${m.company_th}`} loading="lazy" />
                      ) : (
                        <i>?</i>
                      )}
                    </span>
                  </div>

                  <div className="dir-body">
                    <h3>{m.company_th || m.company_en}</h3>
                    <div className="dir-who">
                      {m.owner_name} {m.nickname && `(${m.nickname})`} {m.code && `· ${m.code}`}
                    </div>
                    <p className="dir-hl">
                      {m.highlight || <em className="warn">ยังไม่มีข้อมูลจุดเด่น — ช่วยกันเติมได้</em>}
                    </p>
                    <div className="dir-pills">
                      <span className={`pill ${m.approved ? "ok" : m.clips.length ? "draft" : "todo"}`}>
                        {m.approved
                          ? "✅ คลิปผ่านแล้ว"
                          : m.clips.length
                          ? `🎬 v${m.latest.version} ${CLIP_TH[m.latest.status] || ""}`
                          : "⏳ ยังไม่มีคลิป"}
                      </span>
                      {m.approved && m.latest.status !== "approved" && (
                        <span className="pill draft">🎬 มี v{m.latest.version} ใหม่รอรีวิว</span>
                      )}
                      {m.clips.length > 1 && <span className="pill">{m.clips.length} เวอร์ชัน</span>}
                      {m.feedback.length > 0 && <span className="pill">💬 {m.feedback.length}</span>}
                      {m.missing.map((x) => (
                        <span className="pill miss" key={x}>ขาด{x}</span>
                      ))}
                    </div>
                  </div>

                  <div className="dir-act">
                    <button className="play" disabled={!m.clips.length} onClick={() => setLbId(m.id)}>
                      {!m.clips.length
                        ? "ยังไม่มีคลิป"
                        : m.clips.length > 1
                        ? `▶ ดูคลิป (${m.clips.length} เวอร์ชัน)`
                        : `▶ ดูคลิป v${m.latest.version}`}
                    </button>
                    <a className="btnlink" href={`/member/${m.id}`}>รายละเอียด →</a>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ───── มุมมองตารางเช็กของ ───── */}
        {view === "table" && (
          <div className="checklist">
            <div className="ck-head">
              <span />
              <span>กิจการ</span>
              <span>ทีม</span>
              <span className="ck-checks">
                {CHECKS.map((c) => <span key={c.key}>{c.label}</span>)}
              </span>
              <span>คลิป</span>
            </div>

            {shown.map((m) => {
              const t = teamOf[m.team] || {};
              return (
                <div key={m.id} className="ck-row" style={{ "--tc": t.color || "#64748b" }}>
                  <span className="ck-av">
                    {m.char ? <img src={m.char} alt="" loading="lazy" /> : <i className="ph">?</i>}
                    {m.owner && <img className="ck-face" src={m.owner} alt="" loading="lazy" />}
                  </span>

                  <span className="ck-name">
                    <a href={`/member/${m.id}`}>{m.company_th || m.company_en}</a>
                    <small>
                      {m.owner_name} {m.nickname && `(${m.nickname})`} {m.code && `· ${m.code}`}
                    </small>
                    {m.logo && <img className="ck-logo" src={m.logo} alt="" loading="lazy" />}
                  </span>

                  <span className="ck-team">{m.team}</span>

                  <span className="ck-checks">
                    {CHECKS.map((c) => {
                      const v = m.checks[c.key];
                      return (
                        <span key={c.key} className={`ck-c ${v === 2 ? "yes" : v === 1 ? "part" : "no"}`}>
                          <i className="k">{c.label}</i>
                          <b title={v === 1 ? "มีไฟล์ต้นฉบับแต่ยังใช้บนเว็บไม่ได้ (.ai)" : undefined}>
                            {v === 2 ? "✓" : v === 1 ? "◐" : "✗"}
                          </b>
                        </span>
                      );
                    })}
                  </span>

                  <span className="ck-clip">
                    {m.clips.length ? (
                      <button className="play sm" onClick={() => setLbId(m.id)}>
                        ▶ v{m.latest.version} {CLIP_TH[m.latest.status] || ""}
                      </button>
                    ) : (
                      <span className="pill todo">ยังไม่มีคลิป</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Lightbox member={lbMember} onClose={() => setLbId(null)} onChanged={load} />
    </div>
  );
}
