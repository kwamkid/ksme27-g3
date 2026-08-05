"use client";
import { useEffect } from "react";
import Icon from "./icons";

/** กล่องขยายรูป — กดรูปตัวละคร/รูปเจ้าของแล้วดูเต็มๆ  img = {src, alt} หรือ null = ปิด */
export default function ImgBox({ img, onClose }) {
  useEffect(() => {
    if (!img) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [img, onClose]);

  if (!img) return null;
  return (
    <div className="imgbox" onClick={onClose}>
      <button className="imgbox-x" onClick={onClose} aria-label="ปิด"><Icon name="x" /></button>
      <img src={img.src} alt={img.alt || ""} onClick={(e) => e.stopPropagation()} />
      {img.alt && <div className="imgbox-cap">{img.alt}</div>}
    </div>
  );
}
