"use client";
import { useEffect, useState } from "react";

export function getMe() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("g3_name") || "";
}

export default function Me() {
  const [name, setName] = useState("");
  useEffect(() => setName(getMe()), []);
  return (
    <div className="me">
      ชื่อคุณ:{" "}
      <input
        value={name}
        placeholder="พิมพ์ชื่อเล่น"
        onChange={(e) => {
          setName(e.target.value);
          localStorage.setItem("g3_name", e.target.value);
        }}
      />
    </div>
  );
}
