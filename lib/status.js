// สถานะงานของแต่ละกิจการ — คำนวณจากคลิป + คอมเมนต์ ไม่ได้เก็บเป็นค่าตายตัว
// เพราะสิ่งที่ทุกคนอยากรู้จริงๆ คือ "ตอนนี้ใครต้องลงมือ"
//
//   ยังไม่มีคลิป → ทีมผลิตต้องเจน
//   รอแก้        → เจ้าของกิจการคอมเมนต์มา ทีมผลิตต้องแก้
//   รอรีวิว      → แก้/อัปเวอร์ชันใหม่แล้ว รอเจ้าของกิจการดู
//   ผ่านแล้ว     → เจ้าของติ๊กเลือกเวอร์ชันแล้ว จบ

export const WORK = {
  noclip: { key: "noclip", label: "ยังไม่มีคลิป", cls: "todo", icon: "clock", who: "รอทีมผลิตเจนคลิป" },
  revise: { key: "revise", label: "รอแก้", cls: "miss", icon: "comment", who: "มีคอมเมนต์ที่ยังไม่ได้จัดการ" },
  review: { key: "review", label: "รอรีวิว", cls: "draft", icon: "clip", who: "แก้แล้ว รอเจ้าของกิจการติ๊กว่าผ่าน" },
  approved: { key: "approved", label: "ผ่านแล้ว", cls: "ok", icon: "check", who: "เจ้าของเลือกเวอร์ชันนี้แล้ว" },
};

/**
 * คอมเมนต์ที่ยังค้างจริง
 * คอมเมนต์ที่อยู่บนเวอร์ชันเก่าถือว่าจัดการแล้ว เพราะการอัปเวอร์ชันใหม่คือการแก้ให้แล้ว
 * ส่วนคอมเมนต์บนเวอร์ชันล่าสุด (หรือที่ไม่ผูกเวอร์ชัน) ยังนับว่าค้างจนกว่าจะติ๊กว่าทำแล้ว
 */
export function openComments(m) {
  const latest = m.clips?.[0]?.version ?? 0;
  const verOf = Object.fromEntries((m.clips || []).map((c) => [c.id, c.version]));
  return (m.feedback || []).filter(
    (f) => !f.done && (!f.clip_id || (verOf[f.clip_id] ?? latest) >= latest)
  );
}

export function workStatus(m) {
  if (!m.clips?.length) return WORK.noclip;
  if (m.clips.some((c) => c.status === "approved")) return WORK.approved;
  return openComments(m).length ? WORK.revise : WORK.review;
}
