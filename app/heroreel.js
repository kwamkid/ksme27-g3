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
  const [loading, setLoading] = useState(false);
  const vid = useRef(null);

  const n = members.length;
  const cur = members[Math.min(i, n - 1)];
  const clip = cur?.clips.find((c) => c.status === "approved") || null;

  // คลิปถัดไป — โหลดดักไว้เงียบๆ กดเปลี่ยนแล้วจะได้ขึ้นทันที
  const nextMember = n > 1 ? members[(Math.min(i, n - 1) + 1) % n] : null;
  const nextUrl = nextMember?.clips.find((c) => c.status === "approved")?.video_url || null;

  useEffect(() => {
    if (i >= n && n > 0) setI(0);
  }, [n, i]);

  // เปลี่ยนคลิปโดยไม่สร้าง <video> ใหม่ — ถ้าปล่อยให้ React remount จะเห็นจอดำแวบและเลย์เอาต์กระตุก
  useEffect(() => {
    const v = vid.current;
    if (!v || !clip) return;
    setLoading(true);
    v.src = clip.video_url;
    v.load();
    v.play().catch(() => {});
  }, [clip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ถ้าคลิปไม่ยิง onEnded (โหลดไม่ขึ้น/ค้าง) ก็ยังต้องไปคนถัดไป
  useEffect(() => {
    if (!clip || n < 2) return;
    const timer = setTimeout(() => setI((x) => (x + 1) % n), MAX_MS);
    return () => clearTimeout(timer);
  }, [clip?.id, n]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!n || !clip) return null;

  const go = (step) => setI((x) => (x + step + n) % n);
  return (
    <section className="reel">
      <div className="reel-stage">
        <video
          ref={vid}
          className={loading ? "loading" : ""}
          autoPlay
          muted={muted}
          loop={n === 1}
          playsInline
          preload="auto"
          onPlaying={() => setLoading(false)}
          onEnded={() => n > 1 && go(1)}
        />

        {/* โหลดคลิปถัดไปดักไว้ กดเปลี่ยนคนแล้วจะไม่ต้องรอ */}
        {nextUrl && <video className="reel-prefetch" src={nextUrl} preload="auto" muted playsInline />}

        <div className="reel-tag">
          <Icon name="check" /> ฟันธงแล้ว <b>{n}</b> คน
        </div>

        {n > 1 && (
          <>
            <button className="reel-nav left" onClick={() => go(-1)} aria-label="คนก่อนหน้า">
              <Icon name="prev" />
            </button>
            <button className="reel-nav right" onClick={() => go(1)} aria-label="คนถัดไป">
              <Icon name="next" />
            </button>
          </>
        )}

        <button
          className="reel-mute"
          onClick={() => setMuted((m) => !m)}
          title={muted ? "เปิดเสียง" : "ปิดเสียง"}
          aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}
        >
          <Icon name={muted ? "volumeOff" : "volume"} />
        </button>
      </div>
    </section>
  );
}
