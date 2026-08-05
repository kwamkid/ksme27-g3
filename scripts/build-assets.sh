#!/usr/bin/env bash
# ============================================================
#  แปลงรูปต้นฉบับจากโฟลเดอร์งาน → WebP ใน 4-App/public/
#  รันใหม่ได้ทุกครั้งที่มีรูปเพิ่ม:  bash scripts/build-assets.sh
#
#  ผลลัพธ์
#    public/avatar/<id>.webp   ตัวละคร v2 (จาก v2-characters/)
#    public/owner/<id>.webp    รูปเจ้าของตัวจริง (จาก 1-Teams/face_*)
#    public/logo/<id>.webp     โลโก้กิจการ (จาก 1-Teams/logo_*)
#    public/hero/<TEAM>.webp   ฮีโร่ประจำทีม
#    public/costume/<TEAM>-<male|female>.webp  ชุดสูทประจำทีม
#
#  ต้องมี: cwebp (brew install webp) และ sips (มากับ macOS)
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP="$ROOT/4-App"
TEAMS="$ROOT/1-Teams"
CHARS="$ROOT/2-Production/5.1 Characters (ตัวละคร+ชุด)"
PUB="$APP/public"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$PUB/avatar" "$PUB/owner" "$PUB/logo" "$PUB/hero" "$PUB/costume"

# cwebp ไม่อ่าน EXIF orientation รูปจากมือถือที่ถ่ายแนวตั้งเลยออกมาตะแคง
# อ่านค่า orientation จริงแล้วบอกว่าต้องหมุนกี่องศาตามเข็ม (ต้องมี python3 + Pillow ไม่มีก็คืน 0)
exif_rot() {
  python3 - "$1" 2>/dev/null <<'PY' || echo 0
import sys
try:
    from PIL import Image
    o = Image.open(sys.argv[1]).getexif().get(274, 1)
    print({3: 180, 6: 90, 8: 270}.get(o, 0))
except Exception:
    print(0)
PY
}

# แปลงไฟล์อะไรก็ได้ (รวม HEIC/ai) → webp   $1=src $2=out $3=width $4=quality
# หมุนแก้รูปตะแคงให้เองตาม EXIF
to_webp() {
  local src="$1" out="$2" w="$3" q="$4" rot tmp
  rot="$(exif_rot "$src")"
  [ -f "$src" ] || { echo "  ✗ ไม่พบ: $src"; return 1; }
  case "${src##*.}" in
    HEIC|heic|ai|AI|PDF|pdf)
      tmp="$TMP/$(basename "${src%.*}").png"
      sips -s format png "$src" --out "$tmp" >/dev/null 2>&1 || { echo "  ✗ แปลงไม่ได้: $src"; return 1; }
      src="$tmp" ;;
  esac
  if [ "$rot" != "0" ]; then
    tmp="$TMP/rot-$(basename "$out" .webp).png"
    sips -s format png "$src" --out "$tmp" >/dev/null 2>&1
    sips -r "$rot" "$tmp" >/dev/null 2>&1 || { echo "  ✗ หมุนไม่ได้: $src"; return 1; }
    src="$tmp"
  fi
  cwebp -quiet -q "$q" -resize "$w" 0 "$src" -o "$out" 2>/dev/null || { echo "  ✗ cwebp ล้มเหลว: $src"; return 1; }
}

# ---------- 1) ตัวละคร ----------
# mapping ไม่ต้องระบุเลขเวอร์ชัน — สคริปต์หาไฟล์ <slug>-v<เลขมากสุด>.png ให้เอง
# regen ตัวละครใหม่แล้วตั้งชื่อ -v4 -v5 ต่อไปได้เลย ไม่ต้องมาแก้ไฟล์นี้
# หมายเหตุ: path มีช่องว่าง ต้อง glob แบบ "$dir/$slug"-v*.png (ครอบเฉพาะส่วนที่มีช่องว่าง)
newest_char() {
  local dir="$1" slug="$2" best="" bestn=-1 f n
  for f in "$dir/$slug"-v*.png; do
    [ -e "$f" ] || continue
    n="${f##*-v}"; n="${n%.png}"
    case "$n" in "" | *[!0-9]*) continue ;; esac
    if [ "$n" -gt "$bestn" ]; then bestn="$n"; best="$f"; fi
  done
  printf '%s' "$best"
}

echo "▸ ตัวละคร (avatar)"
while IFS='|' read -r id slug; do
  [ -z "${id:-}" ] && continue
  src="$(newest_char "$CHARS/v2-characters" "$slug")"
  if [ -z "$src" ]; then echo "  ✗ ไม่พบตัวละครของ $id ($slug-v*.png)"; continue; fi
  echo "  $id ← $(basename "$src")"
  to_webp "$src" "$PUB/avatar/$id.webp" 360 80 || true
done <<'EOF'
build-sirayooth|1-BUILD/sirayooth
build-broroma|1-BUILD/broroma
build-nps-plus|1-BUILD/nps
build-leo-residence|1-BUILD/leo
make-pc-foil|2-MAKE/pcfoil
make-foilmaster|2-MAKE/foilmaster
make-quality-flexpack|2-MAKE/qualityflexpack
make-mastercrafts|2-MAKE/mastercrafts
move-aps-commerce|3-MOVE/aps-jay
move-tpi|3-MOVE/tpi
move-atn|3-MOVE/atn
move-ch-pattana|3-MOVE/chpattana
grow-forth-smart|4-GROW/forthsmart
grow-kbank-wealth|4-GROW/kbank-ann
grow-profess-rent|4-GROW/professrent
grow-tower-tactic|4-GROW/towertactic
live-damrong|5-LIVE/damrong
live-yoksod|5-LIVE/yoksod
live-sirichai|5-LIVE/sirichai
live-vejpong|5-LIVE/vejpong
live-aday-fresh|5-LIVE/adayfresh-golf
live-pchw|5-LIVE/pchw
thrive-winds|6-THRIVE/winds
thrive-rebalance|6-THRIVE/rebalance
thrive-joyous|6-THRIVE/joyous
EOF

# ---------- 2) รูปประจำกลุ่ม (ฮีโร่ประจำทีม) ----------
# ชุด uniform ราย ชาย/หญิง (_costume-refs) ไม่เอาขึ้นเว็บแล้ว — ต้นฉบับยังอยู่ที่
# 2-Production/5.1 Characters (ตัวละคร+ชุด)/_costume-refs/ ถ้าอยากใช้อีกค่อยเปิดกลับ
echo "▸ รูปประจำกลุ่ม"
for T in BUILD MAKE MOVE GROW LIVE THRIVE; do
  to_webp "$CHARS/v2-characters/0-main/hero-$T.png" "$PUB/hero/$T.webp" 560 82 || true
done
to_webp "$CHARS/v2-characters/0-main/owner-protagonist.png" "$PUB/hero/owner.webp" 560 82 || true

# ---------- 3) รูปเจ้าของตัวจริง + โลโก้ ----------
# หาไฟล์เองจากชื่อที่ขึ้นต้นด้วย face_ / FACE_ / "face 1_" / logo_ / "LOGO " ฯลฯ
# (ชื่อไฟล์ที่เจ้าของธุรกิจส่งมาไม่ได้ตั้งเหมือนกันทุกคน เลยจับแบบไม่สนตัวพิมพ์)
# ถ้าเจอหลายไฟล์จะเลือกไฟล์ใหญ่สุด = ความละเอียดสูงสุด
# ข้าม .ai / .heic / วิดีโอ เพราะแปลงเป็นรูปเว็บไม่ได้
pick_asset() {
  local dir="$1" kind="$2"
  [ -d "$dir" ] || return 0
  find "$dir" -maxdepth 1 -type f -iname "${kind}[!a-zA-Z0-9]*" \
    ! -iname "*.ai" ! -iname "*.heic" ! -iname "*.mp4" ! -iname "*.mov" ! -iname "*.zip" \
    -print0 2>/dev/null | xargs -0 ls -S 2>/dev/null | head -1
}

echo "▸ รูปเจ้าของ + โลโก้"
while IFS='|' read -r id dir; do
  [ -z "${id:-}" ] && continue

  face="$(pick_asset "$TEAMS/$dir" face)"
  if [ -n "$face" ]; then
    r="$(exif_rot "$face")"
    echo "  $id ← $(basename "$face")${r:+$([ "$r" != 0 ] && echo "  (หมุน $r°)")}"
    to_webp "$face" "$PUB/owner/$id.webp" 480 82 || true
  else
    echo "  ✗ $id ยังไม่มีรูปเจ้าของ"
  fi

  logo="$(pick_asset "$TEAMS/$dir" logo)"
  [ -n "$logo" ] && { to_webp "$logo" "$PUB/logo/$id.webp" 400 88 || true; }
done <<'EOF'
build-sirayooth|1-BUILD/1.1-ศิรายุทธ
build-sp-engineering|1-BUILD/1.2-SP-Engineering
build-broroma|1-BUILD/1.3-Broroma
build-nps-plus|1-BUILD/1.4-NPS-Plus
build-absolute65|1-BUILD/1.5-Absolute65
build-leo-residence|1-BUILD/1.6-LEO-Residence
make-pc-foil|2-MAKE/2.1-PC-Foil
make-foilmaster|2-MAKE/2.2-Foilmaster
make-quality-flexpack|2-MAKE/2.3-Quality-Flexpack
make-mastercrafts|2-MAKE/2.4-Mastercrafts
move-aps-commerce|3-MOVE/3.1-APS-Commerce
move-tpi|3-MOVE/3.2-TPI
move-atn|3-MOVE/3.3-ATN
move-jaturong|3-MOVE/3.4-จตุรงค์
move-ch-pattana|3-MOVE/3.5-ช.พัฒนา
grow-forth-smart|4-GROW/4.1-Forth-Smart
grow-kbank-sme|4-GROW/4.2-KBank-SME
grow-kbank-wealth|4-GROW/4.3-KBank-Wealth
grow-profess-rent|4-GROW/4.4-Profess-Rent
grow-tower-tactic|4-GROW/4.5-Tower-Tactic
live-damrong|5-LIVE/5.1-กุ้งดำรงค์
live-yoksod|5-LIVE/5.2-หยกสด
live-sirichai|5-LIVE/5.3-ตราศิริชัย
live-vejpong|5-LIVE/5.4-เวชพงศ์
live-aday-fresh|5-LIVE/5.5-aDay-Fresh
live-pchw|5-LIVE/5.6-ปตท.ปากช่องไฮเวย์
thrive-winds|6-THRIVE/6.1-Winds-Hospital
thrive-rebalance|6-THRIVE/6.2-Rebalance
thrive-joyous|6-THRIVE/6.3-Joyous
thrive-leviya|6-THRIVE/6.4-LEVIYA
EOF

# ---------- 4) เขียน lib/assets.js จากไฟล์ที่มีจริง ----------
# ไม่ต้องมาแก้รายชื่อด้วยมือทุกครั้งที่มีรูปเพิ่ม
ids_of() { ls "$PUB/$1" 2>/dev/null | sed 's/\.webp$//' | sort | awk '{printf "  \"%s\",\n", $0}'; }

{
  echo "// ⚠️ ไฟล์นี้ถูกสร้างอัตโนมัติโดย scripts/build-assets.sh — อย่าแก้ด้วยมือ"
  echo "// มีรูปเพิ่ม? วางไฟล์ในโฟลเดอร์งานแล้วรัน: bash scripts/build-assets.sh"
  echo
  echo "// ตัวละคร (2-Production/5.1 Characters/v2-characters/)"
  echo "const AVATAR = new Set(["; ids_of avatar; echo "]);"
  echo
  echo "// รูปเจ้าของตัวจริง (1-Teams/**/face*)"
  echo "const OWNER = new Set(["; ids_of owner; echo "]);"
  echo
  echo "// โลโก้กิจการ (1-Teams/**/logo*)"
  echo "const LOGO = new Set(["; ids_of logo; echo "]);"
  echo
  echo 'export const avatarSrc = (id) => (AVATAR.has(id) ? `/avatar/${id}.webp` : null);'
  echo 'export const ownerSrc = (id) => (OWNER.has(id) ? `/owner/${id}.webp` : null);'
  echo 'export const logoSrc = (id) => (LOGO.has(id) ? `/logo/${id}.webp` : null);'
  echo 'export const heroSrc = (team) => `/hero/${team}.webp`;'
} > "$APP/lib/assets.js"
echo "▸ เขียน lib/assets.js ใหม่แล้ว"

echo
echo "── สรุป ──"
for d in avatar owner logo hero costume; do
  printf "%-9s %2d ไฟล์\n" "$d" "$(ls "$PUB/$d" | wc -l | tr -d ' ')"
done
du -sh "$PUB"
