import "./globals.css";
import Me from "./me";
import Icon from "./icons";

export const metadata = {
  title: "G3 Avengers — Production Hub",
  description: "ติดตามงาน VDO เปิดตัว K SME Care #27 กลุ่ม 3 (30 กิจการ)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <header className="top">
          <div className="inner">
            <h1><Icon name="bolt" /> G3 Avengers</h1>
            <nav>
              <a href="/">แดชบอร์ด</a>
              <a href="/script">สคริปต์ &amp; สไตล์</a>
            </nav>
            <Me />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
