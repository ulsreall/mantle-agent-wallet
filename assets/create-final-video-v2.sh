#!/bin/bash
# Create premium demo video - fixed version

FRAMES_DIR="/root/mantle-agent-wallet/assets/demo-frames"
OUTPUT_DIR="/root/mantle-agent-wallet/assets"
VIDEO_OUTPUT="$OUTPUT_DIR/mantle-agent-demo-final.mp4"
MUSIC="$OUTPUT_DIR/background-music.mp3"

FPS=30
SCENE_DUR=5

echo "🎬 Creating premium demo video (fixed)..."

# Clean up any existing temp files
rm -f "$OUTPUT_DIR"/scene_*.mp4

# Scene 0: Title card
echo "  [1/10] Title card..."
ffmpeg -y -f lavfi -i "color=c=#0a0a1a:s=1920x1080:d=5:r=$FPS" \
  -vf "drawtext=text='MantleAgent':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=(h/2)-100:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:enable='gte(t,0.5)',\
drawtext=text='Autonomous AI Agent Wallet':fontcolor=#a78bfa:fontsize=36:x=(w-text_w)/2:y=(h/2)-10:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='gte(t,1)',\
drawtext=text='Powered by ERC-8004 on Mantle Mainnet':fontcolor=#666666:fontsize=22:x=(w-text_w)/2:y=(h/2)+40:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='gte(t,1.5)',\
drawtext=text='Mantle Turing Test Hackathon 2026':fontcolor=#444444:fontsize=18:x=(w-text_w)/2:y=(h/2)+80:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='gte(t,2)'" \
  -c:v libx264 -pix_fmt yuv420p "$OUTPUT_DIR/scene_00.mp4" 2>/dev/null

# Dashboard screenshots with labels
declare -A SCENES
SCENES[1]="01-dashboard-overview.png|Dashboard Overview|Real-time agent status on Mantle Mainnet"
SCENES[2]="02-stats-section.png|Live Stats|Balance · Price · Transactions · Agent Identity"
SCENES[3]="03-price-chart.png|24h Price Chart|Live MNT/USD price from CoinGecko"
SCENES[4]="04-activity-tab.png|Transaction History|41 real on-chain transactions confirmed"
SCENES[5]="05-strategies-tab.png|Autonomous Strategies|DCA · Grid Trading · Arbitrage · Stop Loss"
SCENES[6]="06-strategies-grid.png|Strategy Details|Each strategy tested with real MNT"
SCENES[7]="07-full-page.png|Complete Dashboard|React + TypeScript + Tailwind"
SCENES[8]="08-mobile-view.png|Mobile Responsive|Works on any device"

for i in $(seq 1 8); do
  IFS='|' read -r img label sublabel <<< "${SCENES[$i]}"
  printf "  [%d/10] %s...\n" $((i+1)) "$label"
  
  ffmpeg -y -loop 1 -i "$FRAMES_DIR/$img" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#0a0a1a,\
zoompan=z='1+0.03*on/($FPS*$SCENE_DUR)':d=$((FPS*$SCENE_DUR)):s=1920x1080:fps=$FPS,\
drawbox=x=0:y=970:w=1920:h=110:color=black@0.75:t=fill,\
drawtext=text='$label':fontcolor=white:fontsize=30:x=60:y=990:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='$sublabel':fontcolor=#999999:fontsize=18:x=60:y=1030:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
    -c:v libx264 -t $SCENE_DUR -pix_fmt yuv420p "$OUTPUT_DIR/scene_0${i}.mp4" 2>/dev/null
done

# Outro
echo "  [10/10] Outro..."
ffmpeg -y -f lavfi -i "color=c=#0a0a1a:s=1920x1080:d=5:r=$FPS" \
  -vf "drawtext=text='Try it Live':fontcolor=#a78bfa:fontsize=24:x=(w-text_w)/2:y=(h/2)-80:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='gte(t,0.5)',\
drawtext=text='mantle-agent.vercel.app':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h/2)-30:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:enable='gte(t,0.8)',\
drawtext=text='github.com/ulsreall/mantle-agent-wallet':fontcolor=#aaaaaa:fontsize=22:x=(w-text_w)/2:y=(h/2)+40:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='gte(t,1.2)',\
drawtext=text='8004scan.io/agents/mantle/98':fontcolor=#888888:fontsize=20:x=(w-text_w)/2:y=(h/2)+75:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='gte(t,1.5)'" \
  -c:v libx264 -pix_fmt yuv420p "$OUTPUT_DIR/scene_09.mp4" 2>/dev/null

# Verify all scenes exist
echo ""
echo "Checking scenes..."
ls -lh "$OUTPUT_DIR"/scene_*.mp4

# Concatenate using concat demuxer
echo ""
echo "  → Concatenating 10 scenes..."
cat > "$OUTPUT_DIR/concat.txt" << 'EOF'
file 'scene_00.mp4'
file 'scene_01.mp4'
file 'scene_02.mp4'
file 'scene_03.mp4'
file 'scene_04.mp4'
file 'scene_05.mp4'
file 'scene_06.mp4'
file 'scene_07.mp4'
file 'scene_08.mp4'
file 'scene_09.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$OUTPUT_DIR/concat.txt" \
  -c copy "$OUTPUT_DIR/_video_nosound.mp4" 2>/dev/null

echo "Video without sound:"
ffprobe -v quiet -show_format "$OUTPUT_DIR/_video_nosound.mp4" 2>/dev/null | grep duration

# Add background music
echo "  → Adding background music..."
ffmpeg -y -i "$OUTPUT_DIR/_video_nosound.mp4" -stream_loop -1 -i "$MUSIC" \
  -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 128k \
  -af "volume=0.35,afade=t=in:st=0:d=3,afade=t=out:st=47:d=3" \
  -shortest -movflags +faststart \
  "$VIDEO_OUTPUT" 2>/dev/null

# Cleanup
rm -f "$OUTPUT_DIR"/scene_*.mp4 "$OUTPUT_DIR/concat.txt" "$OUTPUT_DIR/_video_nosound.mp4"

echo ""
echo "✅ Final demo video created!"
echo ""
ls -lh "$VIDEO_OUTPUT"
echo ""
ffprobe -v quiet -show_format "$VIDEO_OUTPUT" 2>/dev/null | grep -E "duration|size|bit_rate"
