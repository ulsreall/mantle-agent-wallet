#!/bin/bash
# Generate copyright-free electronic ambient music using FFmpeg synthesis
# Creates a modern, tech-sounding background track

OUTPUT_DIR="/root/mantle-agent-wallet/assets"
MUSIC_FILE="$OUTPUT_DIR/background-music.mp3"
DURATION=45  # seconds

echo "🎵 Generating electronic ambient music..."

# Layer 1: Deep bass drone (low frequency pad)
echo "  → Layer 1: Bass drone..."
ffmpeg -y -f lavfi -i "sine=frequency=55:duration=$DURATION" \
  -af "volume=0.3,lowpass=f=200,afade=t=in:st=0:d=3,afade=t=out:st=$((DURATION-3)):d=3" \
  -c:a libmp3lame -q:a 2 "$OUTPUT_DIR/_bass.mp3" 2>/dev/null

# Layer 2: Sub bass pulse
echo "  → Layer 2: Sub pulse..."
ffmpeg -y -f lavfi -i "sine=frequency=110:duration=$DURATION" \
  -af "volume=0.15,tremolo=f=2:d=0.4,lowpass=f=300,afade=t=in:st=0:d=3,afade=t=out:st=$((DURATION-3)):d=3" \
  -c:a libmp3lame -q:a 2 "$OUTPUT_DIR/_sub.mp3" 2>/dev/null

# Layer 3: Ethereal pad (chord-like with harmonics)
echo "  → Layer 3: Ethereal pad..."
ffmpeg -y -f lavfi -i "sine=frequency=220:duration=$DURATION" \
  -f lavfi -i "sine=frequency=277:duration=$DURATION" \
  -f lavfi -i "sine=frequency=330:duration=$DURATION" \
  -filter_complex "[0]volume=0.12[a];[1]volume=0.10[b];[2]volume=0.08[c];[a][b][c]amix=inputs=3:duration=longest,chorus=0.5:0.9:50:0.4:0.25:2,afade=t=in:st=0:d=5,afade=t=out:st=$((DURATION-5)):d=5" \
  -c:a libmp3lame -q:a 2 "$OUTPUT_DIR/_pad.mp3" 2>/dev/null

# Layer 4: High shimmer (airy texture)
echo "  → Layer 4: High shimmer..."
ffmpeg -y -f lavfi -i "sine=frequency=880:duration=$DURATION" \
  -f lavfi -i "sine=frequency=1100:duration=$DURATION" \
  -filter_complex "[0]volume=0.04[a];[1]volume=0.03[b];[a][b]amix=inputs=2:duration=longest,tremolo=f=0.5:d=0.8,highpass=f=500,afade=t=in:st=0:d=5,afade=t=out:st=$((DURATION-5)):d=5" \
  -c:a libmp3lame -q:a 2 "$OUTPUT_DIR/_shimmer.mp3" 2>/dev/null

# Layer 5: Rhythmic pulse (tech feel)
echo "  → Layer 5: Rhythmic pulse..."
ffmpeg -y -f lavfi -i "sine=frequency=165:duration=$DURATION" \
  -af "volume=0.08,tremolo=f=4:d=0.9,bandpass=f=165:w=50,afade=t=in:st=0:d=3,afade=t=out:st=$((DURATION-3)):d=3" \
  -c:a libmp3lame -q:a 2 "$OUTPUT_DIR/_pulse.mp3" 2>/dev/null

# Mix all layers together
echo "  → Mixing all layers..."
ffmpeg -y \
  -i "$OUTPUT_DIR/_bass.mp3" \
  -i "$OUTPUT_DIR/_sub.mp3" \
  -i "$OUTPUT_DIR/_pad.mp3" \
  -i "$OUTPUT_DIR/_shimmer.mp3" \
  -i "$OUTPUT_DIR/_pulse.mp3" \
  -filter_complex "[0][1][2][3][4]amix=inputs=5:duration=longest:dropout_transition=3,loudnorm=I=-14:TP=-1:LRA=11" \
  -c:a libmp3lame -q:a 2 "$MUSIC_FILE" 2>/dev/null

# Cleanup temp files
rm -f "$OUTPUT_DIR"/_*.mp3

echo ""
echo "✅ Background music generated!"
ls -lh "$MUSIC_FILE"
ffprobe -v quiet -show_format "$MUSIC_FILE" 2>/dev/null | grep -E "duration|size|bit_rate"
