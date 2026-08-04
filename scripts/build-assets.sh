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

# แปลงไฟล์อะไรก็ได้ (รวม HEIC/ai) → webp   $1=src $2=out $3=width $4=quality $5=หมุนกี่องศาตามเข็ม (ไม่ใส่=0)
# หมายเหตุ: cwebp ไม่อ่าน EXIF orientation ถ้ารูปต้นฉบับตะแคงต้องสั่งหมุนเองผ่านคอลัมน์ rot
to_webp() {
  local src="$1" out="$2" w="$3" q="$4" rot="${5:-0}" tmp
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

# ---------- 1) ตัวละคร v2 ----------
echo "▸ ตัวละคร (avatar)"
while IFS='|' read -r id file; do
  [ -z "${id:-}" ] && continue
  to_webp "$CHARS/v2-characters/$file" "$PUB/avatar/$id.webp" 360 80 || true
done <<'EOF'
build-sirayooth|1-BUILD/sirayooth-v2.png
build-broroma|1-BUILD/broroma-v2.png
build-nps-plus|1-BUILD/nps-v2.png
build-leo-residence|1-BUILD/leo-v2.png
make-pc-foil|2-MAKE/pcfoil-v2.png
make-foilmaster|2-MAKE/foilmaster-v2.png
make-quality-flexpack|2-MAKE/qualityflexpack-v2.png
make-mastercrafts|2-MAKE/mastercrafts-v2.png
move-aps-commerce|3-MOVE/aps-jay-v2.png
move-tpi|3-MOVE/tpi-v2.png
move-atn|3-MOVE/atn-v2.png
move-ch-pattana|3-MOVE/chpattana-v2.png
grow-forth-smart|4-GROW/forthsmart-v2.png
grow-kbank-wealth|4-GROW/kbank-ann-v2.png
grow-profess-rent|4-GROW/professrent-v2.png
grow-tower-tactic|4-GROW/towertactic-v2.png
live-damrong|5-LIVE/damrong-v2.png
live-yoksod|5-LIVE/yoksod-v2.png
live-sirichai|5-LIVE/sirichai-v2.png
live-vejpong|5-LIVE/vejpong-v2.png
live-aday-fresh|5-LIVE/adayfresh-golf-v2.png
live-pchw|5-LIVE/pchw-v2.png
thrive-winds|6-THRIVE/winds-v2.png
thrive-rebalance|6-THRIVE/rebalance-v2.png
thrive-joyous|6-THRIVE/joyous-v2.png
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
# id|โฟลเดอร์ใน 1-Teams|ไฟล์รูปเจ้าของ|ไฟล์โลโก้|หมุนรูปเจ้าของกี่องศา   ("-" = ยังไม่มี)
echo "▸ รูปเจ้าของ + โลโก้"
while IFS='|' read -r id dir face logo rot; do
  [ -z "${id:-}" ] && continue
  [ "$face" != "-" ] && { to_webp "$TEAMS/$dir/$face" "$PUB/owner/$id.webp" 480 82 "${rot:-0}" || true; }
  [ "$logo" != "-" ] && { to_webp "$TEAMS/$dir/$logo" "$PUB/logo/$id.webp" 400 88 || true; }
done <<'EOF'
build-sirayooth|1-BUILD/1.1-ศิรายุทธ|face_IMG_0105.JPG|logo_Sirayooth_logo_color_1.png
build-sp-engineering|1-BUILD/1.2-SP-Engineering|-|-
build-broroma|1-BUILD/1.3-Broroma|face_B92C3F16-F421-471E-B465-D7DF092413E8 2.jpg|logo_BROROMA NEW LOGO.png
build-nps-plus|1-BUILD/1.4-NPS-Plus|face_4V7A5349.JPG|logo_NPS-Logo-E2-01.png
build-absolute65|1-BUILD/1.5-Absolute65|-|LOGO Absolute65.png
build-leo-residence|1-BUILD/1.6-LEO-Residence|face_รูปหน้าตรง.jpg|logo_leo-R-2.png
make-pc-foil|2-MAKE/2.1-PC-Foil|face_คุณณัฐพงศ์ (หน้าตรง).jpg|logo_LogoPCF.ai
make-foilmaster|2-MAKE/2.2-Foilmaster|face_OCT_8938.JPG|logo_Foilmasterlogo.png|270
make-quality-flexpack|2-MAKE/2.3-Quality-Flexpack|face_CT.jpg|logo_QFP.png
make-mastercrafts|2-MAKE/2.4-Mastercrafts|face_front view.jpg|logo_MASTERCRAFTS.png
move-aps-commerce|3-MOVE/3.1-APS-Commerce|face_Jayหน้าตรง.jpg|logo_LogoAPS.jpg
move-tpi|3-MOVE/3.2-TPI|face_Tata หน้าตรง.jpg|logo_TPI Logo.jpeg
move-atn|3-MOVE/3.3-ATN|face_6830CD42-4993-4ECC-89EF-6D5C6CB1C732.jpg|logo_messageImage_1785506492029.jpg
move-jaturong|3-MOVE/3.4-จตุรงค์|-|-
move-ch-pattana|3-MOVE/3.5-ช.พัฒนา|face_Thanyathorn Kijkunasatien 2.jpg|logo_2_chpattana_logo-01.png
grow-forth-smart|4-GROW/4.1-Forth-Smart|face_IMG_8645 2.jpg|logo_logo Capital_2_0.png
grow-kbank-sme|4-GROW/4.2-KBank-SME|-|-
grow-kbank-wealth|4-GROW/4.3-KBank-Wealth|face_1785774230030.jpg|logo_1785501178087.jpg
grow-profess-rent|4-GROW/4.4-Profess-Rent|face_picture นาฏนรี.jpg|logo_logoprofess-02.png
grow-tower-tactic|4-GROW/4.5-Tower-Tactic|face_7179B8CB-CAE6-400A-B2B5-CDAFBD7525A2.jpg|logo_TTG_Logo_ClearBG_CMYK_Vector_WhiteBorder.png
live-damrong|5-LIVE/5.1-กุ้งดำรงค์|face_IMG_6463.jpeg|logo_Logo_V01.png
live-yoksod|5-LIVE/5.2-หยกสด|face_IMG_6980.JPG|logo_Logo.jpg
live-sirichai|5-LIVE/5.3-ตราศิริชัย|face_jern1.jpg|logo_logo sirichai25.png
live-vejpong|5-LIVE/5.4-เวชพงศ์|face_Benjarat Vejpong.JPG|logo_น้ำผึ้งเวชพงศ์.PNG
live-aday-fresh|5-LIVE/5.5-aDay-Fresh|face_tunvarat aday.png|logo_Logo-01.png
live-pchw|5-LIVE/5.6-ปตท.ปากช่องไฮเวย์|face_IMG_5452.PNG|logo_ปากช่องไฮเวย์.png
thrive-winds|6-THRIVE/6.1-Winds-Hospital|face_20251210 Profile43115.jpg|logo_LOGO WIND Hospital (1).png
thrive-rebalance|6-THRIVE/6.2-Rebalance|face_Profile.jpg|logo_Logo_Rebalance.jpg
thrive-joyous|6-THRIVE/6.3-Joyous|face_JOYOUS รูปหน้าตรง.png|logo_Logo JOYOUS.png
thrive-leviya|6-THRIVE/6.4-LEVIYA|-|-
EOF

echo
echo "── สรุป ──"
for d in avatar owner logo hero costume; do
  printf "%-9s %2d ไฟล์\n" "$d" "$(ls "$PUB/$d" | wc -l | tr -d ' ')"
done
du -sh "$PUB"
