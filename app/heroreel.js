"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./icons";

const MAX_MS = 9000; // กันคลิปที่ค้างหรือยาวผิดปกติ ไม่ให้ติดอยู่คนเดียว

/**
 * แถบโชว์ผลงาน — เล่นคลิปของคนที่ฟันธงแล้วไล่ไปทีละคน จบแล้วเปลี่ยนคนถัดไปเอง
 * members = เฉพาะรายที่มีคลิป approved (คนที่ถูกกด "เอาอันนี้" แล้วเท่านั้น)
 */
export default function HeroReel({ members }) {
  const [i, setI] = useState(0);
  const [muted, setMuted] = useState(true);
  const vid = useRef(null);

  const n = members.length;
  const cur = members[Math.min(i, n - 1)];
  const clip = cur?.clips.find((c) => c.status === "approved") || null;

  // รายชื่อเปลี่ยน (มีคนฟันธงเพิ่ม/ถอน) แล้วตัวชี้เกินขอบ ให้ดึงกลับ
  useEffect(() => {
    if (i >= n && n > 0) setI(0);
  }, [n, i]);

  // ถ้าคลิปไม่ยิง onEnded (โหลดไม่ขึ้น/ค้าง) ก็ยังต้องไปคนถัดไป
  useEffect(() => {
    if (!clip || n < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), MAX_MS);
    return () => clearTimeout(t);
  }, [clip?.id, n]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!n || !clip) return null;

  const next = () => n > 1 && setI((x) => (x + 1) % n);

  return (
    <section className="reel">
      <div className="reel-head">
        <Icon name="check" /> ฟันธงแล้ว <b>{n}</b> คน
        <small>เล่นวนอัตโนมัติ</small>
      </div>

      <div className="reel-body">
        <div className="reel-stage">
          <video
            key={clip.id}
            ref={vid}
            src={clip.video_url}
            autoPlay
            muted={muted}
            loop={n === 1}
            playsInline
            preload="auto"
            onEnded={next}
          />
          <button
            className="reel-mute"
            onClick={() => setMuted((m) => !m)}
            title={muted ? "เปิดเสียง" : "ปิดเสียง"}
            aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}
          >
            <Icon name={muted ? "volumeOff" : "volume"} />
          </button>
        </div>

      </div>
    </section>
  );
}
