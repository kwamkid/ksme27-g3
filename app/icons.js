// ไอคอน 2D flat — ไม่ใช้ emoji เพราะแต่ละเครื่อง/เบราว์เซอร์วาดไม่เหมือนกัน
// ทุกตัวใช้ currentColor เลยรับสีจากข้อความรอบๆ เอง
const S = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

const P = {
  // คลิป / วิดีโอ
  clip: <><rect x="2" y="5" width="14" height="14" rx="2" /><path d="M16 10l6-3v10l-6-3z" /></>,
  play: <path d="M7 4l13 8-13 8z" fill="currentColor" stroke="none" />,
  check: <path d="M4 12.5l5.5 5.5L20 6.5" />,
  x: <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
  // รอ / ยังไม่มี
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5.5l3.5 2" /></>,
  comment: <path d="M21 12a8 8 0 01-8 8H4l2.2-2.9A8 8 0 1121 12z" />,
  star: <path d="M12 3.5l2.7 5.6 6.1.8-4.5 4.2 1.2 6-5.5-3-5.5 3 1.2-6L3.2 9.9l6.1-.8z" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0" /><path d="M12 18v3" /></>,
  scene: <><rect x="2.5" y="8" width="19" height="12.5" rx="2" /><path d="M2.5 8l3-4.5 4 3.2 3-3.2 4 3.2 3-3.2" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0115 0" /></>,
  image: <><rect x="3" y="4.5" width="18" height="15" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M4 17l5-4.5 4.5 4 2.5-2 4 3.5" /></>,
  // ลำโพง: เปิดเสียงมีคลื่นเสียง ปิดเสียงมีกากบาท
  volume: <><path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" /><path d="M15.5 9.2a4 4 0 010 5.6" /><path d="M18 6.6a7.5 7.5 0 010 10.8" /></>,
  volumeOff: <><path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" /><path d="M16.5 10l4 4" /><path d="M20.5 10l-4 4" /></>,
  circle: <circle cx="12" cy="12" r="8.5" />,
  circleCheck: <><circle cx="12" cy="12" r="8.5" /><path d="M8.3 12.2l2.6 2.6 4.8-5.4" /></>,
  box: <rect x="4" y="4" width="16" height="16" rx="3" />,
  boxChecked: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12.3l2.8 2.8L16.5 9" /></>,
  bolt: <path d="M13.5 2.5L5 13.5h6l-1.5 8L19 10.5h-6z" fill="currentColor" stroke="none" />,
  grid: <><rect x="3" y="3" width="7.5" height="7.5" rx="1.6" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" /></>,
  list: <><path d="M9 6h12" /><path d="M9 12h12" /><path d="M9 18h12" /><circle cx="4" cy="6" r="1.2" fill="currentColor" /><circle cx="4" cy="12" r="1.2" fill="currentColor" /><circle cx="4" cy="18" r="1.2" fill="currentColor" /></>,
};

export default function Icon({ name, className }) {
  const path = P[name];
  if (!path) return null;
  return <svg {...S} className={`ico ${className || ""}`}>{path}</svg>;
}
