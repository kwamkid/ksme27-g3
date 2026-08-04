// รูปทั้งหมดอยู่ใน public/ — สร้างด้วย `bash scripts/build-assets.sh`
// ถ้ามีรูปเพิ่มในโฟลเดอร์งาน ให้เติม mapping ในสคริปต์ แล้วรันใหม่ + เติม id ที่นี่

// ตัวละคร v2 (2-Production/5.1 Characters/v2-characters/)
const AVATAR = new Set([
  "build-sirayooth", "build-broroma", "build-nps-plus", "build-leo-residence",
  "make-pc-foil", "make-foilmaster", "make-quality-flexpack", "make-mastercrafts",
  "move-aps-commerce", "move-tpi", "move-atn", "move-ch-pattana",
  "grow-forth-smart", "grow-kbank-wealth", "grow-profess-rent", "grow-tower-tactic",
  "live-damrong", "live-yoksod", "live-sirichai", "live-vejpong", "live-aday-fresh", "live-pchw",
  "thrive-winds", "thrive-rebalance", "thrive-joyous",
]);

// รูปเจ้าของตัวจริง (1-Teams/**/face_*)
const OWNER = new Set([
  "build-sirayooth", "build-broroma", "build-nps-plus", "build-leo-residence",
  "make-pc-foil", "make-foilmaster", "make-quality-flexpack", "make-mastercrafts",
  "move-aps-commerce", "move-tpi", "move-atn", "move-ch-pattana",
  "grow-forth-smart", "grow-kbank-wealth", "grow-profess-rent", "grow-tower-tactic",
  "live-damrong", "live-yoksod", "live-sirichai", "live-vejpong", "live-aday-fresh", "live-pchw",
  "thrive-winds", "thrive-rebalance", "thrive-joyous",
]);

// โลโก้กิจการ (1-Teams/**/logo_*) — make-pc-foil มีแต่ไฟล์ .ai แปลงไม่ได้
const LOGO = new Set([
  "build-sirayooth", "build-broroma", "build-nps-plus", "build-absolute65", "build-leo-residence",
  "make-foilmaster", "make-quality-flexpack", "make-mastercrafts",
  "move-aps-commerce", "move-tpi", "move-atn", "move-ch-pattana",
  "grow-forth-smart", "grow-kbank-wealth", "grow-profess-rent", "grow-tower-tactic",
  "live-damrong", "live-yoksod", "live-sirichai", "live-vejpong", "live-aday-fresh", "live-pchw",
  "thrive-winds", "thrive-rebalance", "thrive-joyous",
]);

export const avatarSrc = (id) => (AVATAR.has(id) ? `/avatar/${id}.webp` : null);
export const ownerSrc = (id) => (OWNER.has(id) ? `/owner/${id}.webp` : null);
export const logoSrc = (id) => (LOGO.has(id) ? `/logo/${id}.webp` : null);
export const heroSrc = (team) => `/hero/${team}.webp`;
export const costumeSrc = (team, gender) => `/costume/${team}-${gender}.webp`;
