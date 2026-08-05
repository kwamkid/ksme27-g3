#!/usr/bin/env bash
# ทำรูปปกให้คลิปเปิดตัวของแต่ละทีม → public/team/<KEY>.webp
#
# ทำไมต้องมี: ถ้าให้ <video> โหลดเองเพื่อโชว์เฟรมแรก เบราว์เซอร์จะดึงคลิปมาทั้ง 6 ไฟล์
# (~15 MB) ตั้งแต่เปิดหน้าแรก มือถือรับไม่ไหว มีรูปปกแล้วเหลือไม่ถึง 300 KB
#
# มีคลิปทีมใหม่/เปลี่ยนคลิป? อัปเดต teams.intro_url ใน DB แล้วรัน:
#   bash scripts/team-posters.sh
#
# ใช้ของที่มากับ macOS (qlmanage) + cwebp — ไม่ต้องลง ffmpeg
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=public/team
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

command -v cwebp >/dev/null || { echo "ไม่มี cwebp — ลงด้วย: brew install webp"; exit 1; }

DB=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d "'\"")
[ -n "$DB" ] || { echo "ไม่เจอ DATABASE_URL ใน .env.local"; exit 1; }

# ชื่อไฟล์<TAB>url — ตอนที่ 1 เป็น <KEY> ตอนที่ 2 เป็น <KEY>-2
psql "$DB" -At -F $'\t' -c "
  select key,          intro_url from teams where intro_url is not null and intro_url <> ''
  union all
  select key || '-2',  hero_url  from teams where hero_url  is not null and hero_url  <> ''
  order by 1" > "$TMP/list.tsv"

n=0
while IFS=$'\t' read -r key url; do
  [ -n "$key" ] || continue
  printf '%-7s ' "$key"

  if ! curl -fsS -o "$TMP/$key.mp4" "$url"; then
    echo "โหลดคลิปไม่ได้ — ข้าม"
    continue
  fi

  # qlmanage เลือกเฟรมตัวแทนให้เอง ได้ภาพที่สื่อกว่าเฟรมแรก (เฟรมแรกมักดำ)
  rm -f "$TMP/$key.mp4.png"
  qlmanage -t -s 1280 -o "$TMP" "$TMP/$key.mp4" >/dev/null 2>&1 || true
  if [ ! -f "$TMP/$key.mp4.png" ]; then
    echo "ทำรูปปกไม่ได้ — ข้าม"
    continue
  fi

  cwebp -quiet -q 82 -resize 960 0 "$TMP/$key.mp4.png" -o "$OUT/$key.webp"
  echo "→ $OUT/$key.webp  ($(du -h "$OUT/$key.webp" | cut -f1))"
  n=$((n + 1))
done < "$TMP/list.tsv"

echo
echo "เสร็จแล้ว $n รูป — รวม $(du -sh "$OUT" | cut -f1)"
