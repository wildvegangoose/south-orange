# Polite, retrying downloader for Wikimedia Commons thumbnails (Commons rate-limits bursts with HTTP 429).
cd "$(dirname "$0")/../../img/landmarks"
while IFS=$'\t' read -r id name url; do
  [ -s "$name" ] && continue
  for i in 1 2 3 4 5 6 7 8; do
    code=$(curl -sS -m 90 -A "MaplewoodThroughTime/0.1 (non-commercial fan history site)" -o "$name.part" -w "%{http_code}" "$url")
    if [ "$code" = "200" ]; then mv "$name.part" "$name"; echo "ok $name"; break; fi
    rm -f "$name.part"; echo "retry $name ($code)"; sleep $((i * 45))
  done
  sleep 20
done < ../../tools/landmarks/photos.tsv
echo done
