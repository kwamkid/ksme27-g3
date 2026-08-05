#!/usr/bin/env bash
# ทำรูปปกให้คลิปเปิดตัวของแต่ละทีม
#   ตอนที่ 1 ฉากปัญหา (teams.intro_url) → public/team/<KEY>.webp
#   ตอนที่ 2 เปิดตัวทีม (teams.hero_url) → public/team/<KEY>-2.webp
#
# ทำไมต้องมี: ถ้าให้ <video> โหลดเองเพื่อโชว์เฟรมแรก เบราว์เซอร์จะดึงคลิปมาทั้งหมด
# (~15 MB) ตั้งแต่เปิดหน้า มือถือรับไม่ไหว มีรูปปกแล้วเหลือไม่ถึง 400 KB
#
# เปลี่ยนคลิปทีมไหน? อัปเดต URL ใน DB แล้วรัน:
#   bash scripts/team-posters.sh            # ทำเฉพาะอันที่คลิปเปลี่ยน
#   bash scripts/team-posters.sh --force    # ทำใหม่ทั้งหมด
#
# จำ job_id ที่ทำไปแล้วไว้ใน public/team/.posters.json — คลิปไม่เปลี่ยนก็ไม่ทำซ้ำ
# เผื่อบางรูปเลือกเฟรมเองด้วยมือ จะได้ไม่โดนทับ
#
# ใช้ของที่มากับ macOS (qlmanage) + cwebp — ไม่ต้องลง ffmpeg
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=public/team
SEEN=$OUT/.posters.json
FORCE=${1:-}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"
[ -f "$SEEN" ] || echo '{}' > "$SEEN"

command -v cwebp >/dev/null || { echo "ไม่มี cwebp — ลงด้วย: brew install webp"; exit 1; }

DB=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d "'\"")
[ -n "$DB" ] || { echo "ไม่เจอ DATABASE_URL ใน .env.local"; exit 1; }

# ชื่อไฟล์<TAB>url<TAB>job_id
psql "$DB" -At -F $'\t' -c "
  select key,         intro_url, coalesce(intro_job_id, intro_url) from teams where intro_url is not null and intro_url <> ''
  union all
  select key || '-2', hero_url,  coalesce(hero_job_id,  hero_url)  from teams where hero_url  is not null and hero_url  <> ''
  order by 1" > "$TMP/list.tsv"

made=0; kept=0
while IFS=$'\t' read -r key url job; do
  [ -n "$key" ] || continue
  printf '%-9s ' "$key"

  # คลิปยังเป็นตัวเดิมและมีรูปอยู่แล้ว → ข้าม
  if [ "$FORCE" != "--force" ] && [ -f "$OUT/$key.webp" ] &&
     [ "$(node -e "process.stdout.write((require('./$SEEN')['$key']||''))" 2>/dev/null)" = "$job" ]; then
    echo "คลิปเดิม — ข้าม"
    kept=$((kept + 1))
    continue
  fi

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
  node -e "
    const fs=require('fs'), f='$SEEN';
    const m=JSON.parse(fs.readFileSync(f,'utf8')); m['$key']='$job';
    fs.writeFileSync(f, JSON.stringify(m,null,2)+'\n');
  "
  echo "→ $OUT/$key.webp  ($(du -h "$OUT/$key.webp" | cut -f1))"
  made=$((made + 1))
done < "$TMP/list.tsv"

echo
echo "ทำใหม่ $made รูป · ของเดิม $kept รูป — รวม $(du -sh "$OUT" | cut -f1)"
[ "$made" -gt 0 ] && echo "อย่าลืม commit รูปใน $OUT ด้วย"
exit 0
