"use client";
import { useEffect, useState } from "react";
import TeamIntro from "../teamintro";

/** หน้ารวมคลิปเปิดตัวของ 6 ทีม — คลิป "ปัญหา" ของแต่ละสาย */
export default function TeamsPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div className="wrap"><div className="msg err">โหลดข้อมูลไม่ได้: {err}</div></div>;
  if (!data) return <div className="wrap dimtext">กำลังโหลด…</div>;

  const count = Object.fromEntries(
    data.teams.map((t) => [t.key, data.members.filter((m) => m.team === t.key).length])
  );

  return (
    <div className="wrap">
      <TeamIntro teams={data.teams} count={count} />
    </div>
  );
}
