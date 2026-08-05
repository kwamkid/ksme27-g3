"use client";
import { useEffect, useMemo, useState } from "react";
import { avatarSrc, ownerSrc, logoSrc } from "@/lib/assets";
import Lightbox from "./lightbox";
import Icon from "./icons";
import ImgBox from "./imgbox";
import HeroReel from "./heroreel";
import { WORK, workStatus, openComments } from "@/lib/status";

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

// ตัวกรองไล่ตามลำดับงาน: ของที่ต้องลงมือก่อน → ของที่จบแล้ว
const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "revise", label: WORK.revise.label, icon: WORK.revise.icon },
  { key: "review", label: WORK.review.label, icon: WORK.review.icon },
  { key: "noclip", label: WORK.noclip.label, icon: WORK.noclip.icon },
  { key: "nochar", label: "ยังไม่มีตัวละคร", icon: "user" },
  { key: "approved", label: WORK.approved.label, icon: WORK.approved.icon },
];

// เงื่อนไขของแต่ละตัวกรอง เก็บไว้ที่เดียวจะได้ไม่หลุดกันระหว่างตัวนับกับตัวกรอง
const MATCH = {
  all: () => true,
  revise: (m) => m.work.key === "revise",
  review: (m) => m.work.key === "review",
  noclip: (m) => m.work.key === "noclip",
  approved: (m) => m.work.key === "approved",
  nochar: (m) => !m.char,
  hasclip: (m) => m.clips.length > 0,
};

export default function Directory() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [view, setView] = useState("cards");
  const [team, setTeam] = useState(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [lbId, setLbId] = useState(null);
  const [ready, setReady] = useState(false);
  const [img, setImg] = useState(null);

  const load = () =>
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch((e) => setErr(String(e)));

  useEffect(() => { load(); }, []);

  // อ่านทีม/ตัวกรอง/คำค้นหา จาก URL ตอนเปิดหน้า และตอนกดปุ่ม back ของเบราว์เซอร์
  // (อ่านใน effect ไม่ใช่ตอน useState เพื่อให้ฝั่ง server กับ client ตรงกัน)
  useEffect(() => {
    const apply = () => {
      const p = new URLSearchParams(window.location.search);
      setTeam(p.get("team") || null);
      setFilter(p.get("f") || "all");
      setQ(p.get("q") || "");
      setView(p.get("v") === "table" ? "table" : "cards");
    };
    apply();
    setReady(true);
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);

  // เขียนกลับลง URL เพื่อให้ copy ลิงก์ไปแปะในไลน์แล้วเปิดมาเห็นชุดเดียวกัน
  // ใช้ replaceState เพื่อไม่ให้ทุกครั้งที่กดตัวกรองไปโผล่ในประวัติเบราว์เซอร์
  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (team) p.set("team", team);
    if (filter !== "all") p.set("f", filter);
    if (q.trim()) p.set("q", q.trim());
    if (view !== "cards") p.set("v", view);
    const s = p.toString();
    window.history.replaceState(null, "", s ? `?${s}` : window.location.pathname);
  }, [ready, team, filter, q, view]);

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
        work: workStatus(m),
        openComments: openComments(m).length,
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
  const nOf = (key) => rows.filter((m) => m.work.key === key).length;

  const lbMember = rows.find((m) => m.id === lbId) || null;
  const doneList = rows.filter((m) => m.approved);
  const filtering = Boolean(team) || filter !== "all" || Boolean(q.trim());
  const clearFilters = () => { setTeam(null); setFilter("all"); setQ(""); };

  const countOf = (key) =>
    rows.filter((m) => (team ? m.team === team : true) && (MATCH[key] || MATCH.all)(m)).length;

  return (
    <div className="wrap">
      {/* ───── บนสุด: คลิปที่ฟันธงแล้ว | ตัวเลขสรุป ───── */}
      <div className="topgrid">
        <HeroReel members={doneList} />

        {/* กดที่การ์ดแล้วกรองรายชื่อด้านล่างให้เลย */}
        <div className="stats">
          <button className={`stat big ${filter === "approved" ? "on" : ""}`} onClick={() => setFilter("approved")}>
            <b>{approved}/{total}</b>
            <span>ผ่านแล้ว</span>
            <div className="progress-bar">
              <div style={{ width: `${(approved / total) * 100}%` }} />
            </div>
          </button>
          <button
            className={`stat ${nOf("revise") ? "warn" : ""} ${filter === "revise" ? "on" : ""}`}
            onClick={() => setFilter("revise")}
          >
            <b>{nOf("revise")}</b><span>รอแก้ — คุณต้องทำ</span>
          </button>
          <button className={`stat ${filter === "review" ? "on" : ""}`} onClick={() => setFilter("review")}>
            <b>{nOf("review")}</b><span>รอเจ้าของรีวิว</span>
          </button>
          <button className={`stat ${filter === "hasclip" ? "on" : ""}`} onClick={() => setFilter("hasclip")}>
            <b>{withClip}/{total}</b><span>มีคลิปแล้ว</span>
          </button>
          <button className={`stat ${filter === "nochar" ? "on" : ""}`} onClick={() => setFilter("nochar")}>
            <b>{withChar}/{total}</b><span>มีตัวละครแล้ว</span>
          </button>
        </div>
      </div>

      {/* ───── แถบค้นหา + ตัวกรอง ───── */}
      <section>
        <div className="team-head">
          <span className="dot" style={{ background: "#60a5fa" }} />
          <h2>ทำเนียบ {total} กิจการ</h2>
          {filtering ? (
            <>
              <small>กรองอยู่ — เจอ {shown.length} กิจการ</small>
              <button className="clearfilter" onClick={clearFilters}>
                <Icon name="x" /> ล้างตัวกรอง
              </button>
            </>
          ) : (
            <small>แสดงทั้งหมด ไม่ได้กรองอะไรไว้</small>
          )}
        </div>

        <div className="toolbar">
          <div className="findbar">
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
          <div className="seg">
            <button className={view === "cards" ? "on" : ""} onClick={() => setView("cards")}>
              <Icon name="grid" /> การ์ด
            </button>
            <button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>
              <Icon name="list" /> ตารางเช็กของ
            </button>
          </div>
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
                      <img
                        className="dir-char zoom"
                        src={m.char}
                        alt={`ตัวละคร ${m.company_th}`}
                        loading="lazy"
                        onClick={() => setImg({ src: m.char, alt: `ตัวละคร ${m.company_th}` })}
                      />
                    ) : (
                      <span className="dir-nochar">ยังไม่มีตัวละคร</span>
                    )}
                    <span className="dir-team">{m.team}</span>
                    {m.logo && (
                      <span className="dir-logo">
                        <img src={m.logo} alt={`โลโก้ ${m.company_th}`} loading="lazy" />
                      </span>
                    )}
                    <span className="dir-face">
                      {m.owner ? (
                        <img
                          className="zoom"
                          src={m.owner}
                          alt={`${m.owner_name} · ${m.company_th}`}
                          loading="lazy"
                          onClick={() => setImg({ src: m.owner, alt: `${m.owner_name} · ${m.company_th}` })}
                        />
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
                      <span className={`pill ${m.work.cls}`} title={m.work.who}>
                        <Icon name={m.work.icon} />
                        {m.latest ? `v${m.latest.version} ` : ""}{m.work.label}
                      </span>
                      {m.openComments > 0 ? (
                        <span className="pill miss"><Icon name="comment" /> {m.openComments}</span>
                      ) : (
                        m.feedback.length > 0 && <span className="pill"><Icon name="comment" /> {m.feedback.length}</span>
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
                        <Icon name="play" /> v{m.latest.version} {m.work.label}
                      </button>
                    ) : (
                      <span className="pill todo"><Icon name="clock" /> ยังไม่มีคลิป</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Lightbox member={lbMember} onClose={() => setLbId(null)} onChanged={load} />
      <ImgBox img={img} onClose={() => setImg(null)} />
    </div>
  );
}
