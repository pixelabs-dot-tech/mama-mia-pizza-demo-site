#!/bin/bash
# Cut the story clips into small silent loops (4:5, 720x900) plus a poster frame each.
set -e
SRC=/home/claude/mamamia/src.mp4
OUT=/home/claude/mamamia/site/assets/video
mkdir -p "$OUT"
clip () { # name start dur y0
  local name=$1 ss=$2 dur=$3 y0=$4
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$SRC" -an \
    -vf "crop=1320:1650:0:${y0},scale=720:900:flags=lanczos,fps=30,format=yuv420p" \
    -c:v libx264 -preset slow -crf 27 -profile:v high -level 4.0 -movflags +faststart "$OUT/$name.mp4"
  ffmpeg -v error -y -ss 0.4 -i "$OUT/$name.mp4" -frames:v 1 -vf "scale=720:900" -q:v 3 "$OUT/$name.jpg"
  printf "%-12s %s\n" "$name" "$(du -h "$OUT/$name.mp4" | cut -f1)"
}
clip storefront 0.2 6.0 700
clip oven       9.3 2.9 760
clip dining     19.0 6.0 800
clip pub        30.4 6.0 800
clip joy        58.2 7.4 570
clip happy      67.6 8.2 515
clip magic      77.6 6.2 800
clip parm       104.8 2.8 750
clip lasagna    108.2 6.4 770
clip pepperoni  115.6 6.4 770
