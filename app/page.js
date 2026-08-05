"use client";
import { useEffect, useMemo, useState } from "react";
import { avatarSrc, ownerSrc, logoSrc, heroSrc } from "@/lib/assets";
import Lightbox from "./lightbox";
import Icon from "./icons";

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

// ตัวกรองเรียงตามลำดับงานที่ทำจริง: ของที่ต้องจัดการก่อน → ของที่เสร็จแล้ว
const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "todocomment", label: "คอมเมนต์รอแก้", icon: "comment" },
  { key: "pending", label: "ยังไม่ผ่าน", icon: "clip" },
  { key: "noclip", label: "ยังไม่มีคลิป", icon: "clock" },
  { key: "nochar", label: "ยังไม่มีตัวละคร", icon: "user" },
  { key: "approved", label: "ผ่านแล้ว", icon: "check" },
];

// เงื่อนไขของแต่ละตัวกรอง เก็บไว้ที่เดียวจะได้ไม่หลุดกันระหว่างตัวนับกับตัวกรอง
const MATCH = {
  all: () => true,
  todocomment: (m) => m.openComments > 0,
  pending: (m) => m.clips.length > 0 && !m.approved,
  noclip: (m) => m.clips.length === 0,
  nochar: (m) => !m.char,
  approved: (m) => m.approved,
};

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
        // คอมเมนต์ที่ยังไม่มีใครติ๊กว่าทำแล้ว = งานที่ยังค้าง
        openComments: m.feedback.filter((f) => !f.done).length,
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
      if (!(MATCH[filter] || MATCH.all)(m)) return false;
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
  const openComments = rows.reduce((n, m) => n + m.openComments, 0);
  const pending = rows.filter((m) => m.clips.length && !m.approved).length;

  const lbMember = rows.find((m) => m.id === lbId) || null;

  const countOf = (key) =>
    rows.filter((m) => (team ? m.team === team : true) && (MATCH[key] || MATCH.all)(m)).length;

  return (
    <div className="wrap">
      {/* ───── สรุปภาพรวม ───── */}
      <div className="progress-bar" title={`คลิปผ่านแล้ว ${approved}/${total}`}>
        <div style={{ width: `${(approved / total) * 100}%` }} />
      </div>

      <div className="stats">
        <div className="stat"><b>{approved}/{total}</b><span>คลิปผ่านแล้ว</span></div>
        <div className={`stat ${pending ? "warn" : ""}`}><b>{pending}</b><span>รอรีวิว/ยังไม่ผ่าน</span></div>
        <div className={`stat ${openComments ? "warn" : ""}`}><b>{openComments}</b><span>คอมเมนต์รอแก้</span></div>
        <div className="stat"><b>{total - withClip}</b><span>ยังไม่มีคลิป</span></div>
        <div className="stat"><b>{withChar}/{total}</b><span>มีตัวละครแล้ว</span></div>
      </div>

      {/* ───── แถบค้นหา + ตัวกรอง ───── */}
      <section>
        <div className="team-head">
          <span className="dot" style={{ background: "#60a5fa" }} />
          <h2>ทำเนียบ 30 กิจการ</h2>
          <small>แสดง {shown.length} จาก {total} กิจการ</small>
        </div>

        <div className="toolbar">
          <div className="searchbox">
            <input
              className="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQ("")}
              placeholder="ค้นหาชื่อกิจการ / เจ้าของ / ชื่อเล่น / รหัส…"
            />
            {q && (
              <button className="search-x" onClick={() => setQ("")} aria-label="ล้างคำค้นหา">
                <Icon name="x" />
              </button>
            )}
          </div>
          <div className="views">
            <button className={`chip ${view === "cards" ? "on" : ""}`} onClick={() => setView("cards")}><Icon name="grid" /> การ์ด</button>
            <button className={`chip ${view === "table" ? "on" : ""}`} onClick={() => setView("table")}><Icon name="list" /> ตารางเช็กของ</button>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${!team ? "on" : ""}`} onClick={() => setTeam(null)}>
            ทุกทีม <em>{rows.length}</em>
          </button>
          {data.teams.map((t) => (
            <button
              key={t.key}
              className={`tab ${team === t.key ? "on" : ""}`}
              style={{ "--tc": t.color }}
              onClick={() => setTeam(team === t.key ? null : t.key)}
            >
              <span className="dot sm" style={{ background: t.color }} />
              {t.key} <em>{rows.filter((m) => m.team === t.key).length}</em>
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
              {f.icon && <Icon name={f.icon} />}
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
                        {m.approved ? (
                          <><Icon name="check" /> ผ่านแล้ว</>
                        ) : m.clips.length ? (
                          <><Icon name="clip" /> v{m.latest.version} {CLIP_TH[m.latest.status] || ""}</>
                        ) : (
                          <><Icon name="clock" /> ยังไม่มีคลิป</>
                        )}
                      </span>
                      {m.clips.length > 1 && <span className="pill">{m.clips.length} เวอร์ชัน</span>}
                      {m.openComments > 0 ? (
                        <span className="pill miss"><Icon name="comment" /> {m.openComments} รอแก้</span>
                      ) : (
                        m.feedback.length > 0 && <span className="pill"><Icon name="comment" /> {m.feedback.length}</span>
                      )}
                      {m.missing.length > 0 && (
                        <span className="pill miss" title={`ยังไม่ได้ส่ง: ${m.missing.join(" · ")}`}>
                          <Icon name="image" /> ขาด {m.missing.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="dir-act">
                    <button className="play" disabled={!m.clips.length} onClick={() => setLbId(m.id)}>
                      {m.clips.length ? <><Icon name="play" /> ดูคลิป</> : "ยังไม่มีคลิป"}
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
                        <Icon name="play" /> v{m.latest.version} {CLIP_TH[m.latest.status] || ""}
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
