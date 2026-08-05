"use client";
import { use, useEffect, useRef, useState } from "react";
import { getMe } from "../../me";
import { avatarSrc, ownerSrc, logoSrc } from "@/lib/assets";
import Icon from "../../icons";

// ช่องข้อความที่สูงพอดีเนื้อหา ไม่เหลือที่ว่างเปล่า และไม่ต้องเลื่อนอ่าน
function AutoTextarea({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };
  useEffect(fit, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      className="grow"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// [ชื่อฟิลด์, ป้าย, เป็นช่องหลายบรรทัดไหม, กินเต็มแถวไหม]
// ช่องสั้นวางคู่กัน 2 คอลัมน์ ส่วนช่องยาวที่ต้องอ่านเยอะให้กินเต็มแถว
const FIELDS = [
  ["company_th", "ชื่อกิจการ (ไทย)", false, false],
  ["owner_name", "ชื่อ-นามสกุลเจ้าของ", false, false],
  ["nickname", "ชื่อเล่น", false, false],
  ["contact", "ติดต่อ", false, false],
  ["business", "ทำธุรกิจอะไร", true, false],
  ["benefit", "ลูกค้าได้อะไร", true, false],
  ["products", "สินค้า/บริการหลัก", true, false],
  ["dialogue_th", "บทพูดไทยในคลิป", true, false],
  ["highlight", "จุดเด่น (สำคัญที่สุด — ใช้เขียนบทคลิป)", true, true],
  ["scene_idea", "ฉากในคลิป (signature move)", true, true],
  ["note", "หมายเหตุ", true, true],
];

export default function MemberPage({ params }) {
  const { id } = use(params);
  const [m, setM] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

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
    if (!comment.trim()) return;
    const author = getMe().trim();
    // ต้องรู้ว่าใครขอแก้ ไม่งั้นตามกลับไม่ได้ว่าใครเป็นคนพูด
    if (!author) return setMsg({ t: "err", m: "ใส่ชื่อเล่นของคุณที่มุมขวาบนก่อนนะครับ จะได้รู้ว่าใครคอมเมนต์" });
    setBusy(true);
    const r = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ member_id: id, clip_id: m.clips[0]?.id || null, author, message: comment }),
    }).then((x) => x.json());
    setBusy(false);
    if (r.error) return setMsg({ t: "err", m: r.error });
    setComment(""); load();
  };

  // ติ๊กว่าคอมเมนต์นี้ทำไปแล้วหรือยัง
  const toggleDone = async (f) => {
    setBusy(true);
    const r = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: f.id, done: !f.done, author: getMe() }),
    }).then((x) => x.json());
    setBusy(false);
    if (r.error) return setMsg({ t: "err", m: r.error });
    load();
  };

  // ปุ่มผ่าน/ยังไม่ผ่าน — กดสลับไปมาได้
  // ถ้ามีเวอร์ชันที่ผ่านอยู่แล้วให้ปุ่มคุมตัวนั้น ถ้ายังไม่มีให้คุมเวอร์ชันล่าสุด
  const approvedClip = m.clips.find((c) => c.status === "approved");
  const targetClip = approvedClip || m.clips[0] || null;

  const toggleApprove = async () => {
    if (!targetClip) return;
    setBusy(true);
    const r = await fetch("/api/clips", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: targetClip.id,
        status: approvedClip ? "draft" : "approved",
        author: getMe(),
      }),
    }).then((x) => x.json());
    setBusy(false);
    if (r.error) return setMsg({ t: "err", m: r.error });
    load();
  };

  return (
    <div className="wrap">
      <a href="/" className="dimtext">← กลับแดชบอร์ด</a>

      <div className="mhead">
        <div className="mhead-pics">
          {avatarSrc(m.id) ? (
            <img className="mhead-char" src={avatarSrc(m.id)} alt={`ตัวละคร ${m.company_th}`} />
          ) : (
            <span className="mhead-char none">ยังไม่มีตัวละคร</span>
          )}
          {ownerSrc(m.id) && <img className="mhead-face" src={ownerSrc(m.id)} alt={`เจ้าของ ${m.company_th}`} />}
        </div>
        <div className="mhead-txt">
          <h2>{m.company_th}</h2>
          <div className="dimtext">
            {m.company_en} · {m.owner_name} {m.nickname && `(${m.nickname})`} · ทีม {m.team} {m.code && `· ${m.code}`}
          </div>
        </div>
        {logoSrc(m.id) && (
          <span className="mhead-logo">
            <img src={logoSrc(m.id)} alt={`โลโก้ ${m.company_th}`} />
          </span>
        )}
      </div>

      {msg && <div className={`msg ${msg.t}`}>{msg.m}</div>}

      <div className="detail">
        <div>
          <div className="box">
            <h3>ข้อมูลกิจการ — ทุกคนแก้ได้</h3>
            <div className="fields">
              {FIELDS.map(([f, label, multi, full]) => (
                <div className={`field ${full ? "full" : ""}`} key={f}>
                  <label>{label}</label>
                  {multi ? (
                    <AutoTextarea value={form[f] ?? ""} onChange={(v) => setForm({ ...form, [f]: v })} />
                  ) : (
                    <input value={form[f] ?? ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            <button onClick={save} disabled={!dirty || saving}>
              {saving ? "กำลังบันทึก…" : "บันทึก"}
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
                  v{c.version} ·{" "}
                  <Icon name={c.status === "approved" ? "check" : c.status === "rejected" ? "x" : "clip"} />{" "}
                  {c.status === "approved" ? "ผ่านแล้ว" : c.status === "rejected" ? "ต้องแก้" : "รอรีวิว"}
                </div>
                <video src={c.video_url} controls preload="metadata" />
              </div>
            ))}
          </div>

          <div className="box">
            <h3>ความเห็นของทีม ({m.feedback.length})</h3>
            <div className="field">
              <AutoTextarea
                value={comment}
                onChange={setComment}
                placeholder="เช่น พูดเร็วไป / อยากให้ฉากสว่างกว่านี้ / ชื่อบริษัทออกเสียงผิด"
              />
            </div>
            <button onClick={send} disabled={busy || !comment.trim()}>
              {busy ? "กำลังส่ง…" : "ส่งความเห็น"}
            </button>

            <div style={{ marginTop: 14 }}>
              {m.feedback.map((f) => (
                <div className={`fb ${f.done ? "isdone" : ""}`} key={f.id}>
                  <div className="who">
                    {f.author} · {new Date(f.created_at).toLocaleString("th-TH")}{" "}
                    
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

            {/* ปุ่มสรุปผล — กดสลับผ่าน/ยังไม่ผ่านได้ */}
            <div className="approve">
              <button
                className={`appr ${approvedClip ? "on" : ""}`}
                disabled={busy || !targetClip}
                onClick={toggleApprove}
              >
                {!targetClip
                  ? "ยังไม่มีคลิปให้เลือก"
                  : approvedClip
                  ? <><Icon name="check" /> เอาอันนี้ (v{approvedClip.version})</>
                  : `เอาอันนี้ (v${targetClip.version})`}
              </button>
              <span className="dimtext">
                {approvedClip ? "กดอีกครั้งเพื่อยกเลิก" : "กดเมื่อคลิปนี้ใช้ได้แล้ว"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
