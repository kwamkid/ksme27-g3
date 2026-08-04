"use client";
import { useEffect, useState } from "react";

export default function ScriptPage() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch("/api/data").then((r) => r.json()).then(setData); }, []);
  if (!data) return <div className="wrap dimtext">กำลังโหลด…</div>;

  return (
    <div className="wrap">
      <h2 style={{ marginTop: 8 }}>สคริปต์ &amp; สไตล์ที่ล็อกไว้</h2>
      <p className="dimtext">ทุกคลิปต้องเป็นไปตามนี้ ถ้าอยากเปลี่ยนอะไร คอมเมนต์ในหน้ากิจการได้เลย</p>

      {(data.script || []).map((s) => (
        <div className="box" key={s.key}>
          <h3>{s.title_th}</h3>
          <pre className="script">{s.body}</pre>
        </div>
      ))}

      <div className="box">
        <h3>บทพูดของทั้ง 30 กิจการ</h3>
        <table>
          <thead><tr><th>ทีม</th><th>กิจการ</th><th>บทพูด</th></tr></thead>
          <tbody>
            {data.members.map((m) => (
              <tr key={m.id}>
                <td className="dimtext">{m.team}</td>
                <td><a href={`/member/${m.id}`} style={{ color: "#ffcc4d" }}>{m.company_th}</a></td>
                <td>{m.dialogue_th || <span className="dimtext">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
