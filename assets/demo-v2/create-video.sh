#!/bin/bash
set -e

# Colors
BG="#0a0a0f"
CARD="#1a1a2e"
ACCENT="#7c3aed"
GREEN="#10b981"
CYAN="#06b6d4"
TEXT="#e0e0e0"
MUTED="#888888"

# Resolution
W=1920
H=1080

echo "=== Creating Demo Video v2 ==="

# Scene 1: Title (5s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=5" \
  -vf "\
drawtext=text='🤖 MANTLEAGENT':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=300:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='Autonomous AI Agent Wallet':fontcolor=${CYAN}:fontsize=36:x=(w-text_w)/2:y=400:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Mantle Mainnet | ERC-8004 | 4 Strategies':fontcolor=${MUTED}:fontsize=24:x=(w-text_w)/2:y=460:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='The Turing Test Hackathon 2026':fontcolor=${ACCENT}:fontsize=28:x=(w-text_w)/2:y=520:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" \
  -c:v libx264 -pix_fmt yuv420p -t 5 scene1_title.mp4

echo "✅ Scene 1: Title"

# Scene 2: Stats Dashboard (5s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=5" \
  -vf "\
drawtext=text='📊 LIVE DASHBOARD':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=100:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='Balance: 2.62 MNT (\$1.71)':fontcolor=${GREEN}:fontsize=32:x=200:y=250:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Price: \$0.6474':fontcolor=${CYAN}:fontsize=32:x=200:y=300:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Transactions: 41 on-chain':fontcolor=${TEXT}:fontsize=32:x=200:y=350:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='ERC-8004: Token #98':fontcolor=${ACCENT}:fontsize=32:x=200:y=400:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Live on Mantle Mainnet (Chain ID: 5000)':fontcolor=${MUTED}:fontsize=24:x=200:y=480:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" \
  -c:v libx264 -pix_fmt yuv420p -t 5 scene2_stats.mp4

echo "✅ Scene 2: Stats"

# Scene 3: Connect Wallet (5s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=5" \
  -vf "\
drawtext=text='🔗 CONNECT WALLET':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=100:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='MetaMask Integration':fontcolor=${CYAN}:fontsize=32:x=(w-text_w)/2:y=200:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Connect your own wallet':fontcolor=${TEXT}:fontsize=28:x=300:y=300:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Auto-detect Mantle Network':fontcolor=${TEXT}:fontsize=28:x=300:y=350:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Switch chain automatically':fontcolor=${TEXT}:fontsize=28:x=300:y=400:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='No private keys stored':fontcolor=${GREEN}:fontsize=28:x=300:y=450:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='User signs transactions in their wallet':fontcolor=${MUTED}:fontsize=24:x=300:y=500:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" \
  -c:v libx264 -pix_fmt yuv420p -t 5 scene3_wallet.mp4

echo "✅ Scene 3: Connect Wallet"

# Scene 4: Price Chart (5s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=5" \
  -vf "\
drawtext=text='📈 LIVE PRICE CHART':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=100:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='24h MNT/USD Price':fontcolor=${CYAN}:fontsize=32:x=(w-text_w)/2:y=200:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Auto-refresh every 30 seconds':fontcolor=${TEXT}:fontsize=28:x=300:y=300:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Canvas-based line chart':fontcolor=${TEXT}:fontsize=28:x=300:y=350:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='High/Low price markers':fontcolor=${TEXT}:fontsize=28:x=300:y=400:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='24h change percentage':fontcolor=${GREEN}:fontsize=28:x=300:y=450:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Real-time from CoinGecko API':fontcolor=${MUTED}:fontsize=24:x=300:y=500:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" \
  -c:v libx264 -pix_fmt yuv420p -t 5 scene4_chart.mp4

echo "✅ Scene 4: Price Chart"

# Scene 5: Transaction History (5s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=5" \
  -vf "\
drawtext=text='📋 TRANSACTION HISTORY':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=100:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='Real on-chain transactions':fontcolor=${CYAN}:fontsize=32:x=(w-text_w)/2:y=200:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Fetched from MantleScan API':fontcolor=${TEXT}:fontsize=28:x=300:y=300:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='41 confirmed transactions':fontcolor=${GREEN}:fontsize=28:x=300:y=350:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Paginated with 10 items per page':fontcolor=${TEXT}:fontsize=28:x=300:y=400:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Tx hash, method, value, gas, timestamp':fontcolor=${TEXT}:fontsize=28:x=300:y=450:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Click to view on MantleScan':fontcolor=${MUTED}:fontsize=24:x=300:y=500:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" \
  -c:v libx264 -pix_fmt yuv420p -t 5 scene5_history.mp4

echo "✅ Scene 5: Transaction History"

# Scene 6: Strategies (5s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=5" \
  -vf "\
drawtext=text='⚡ 4 AUTONOMOUS STRATEGIES':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=100:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='📊 DCA — Auto-buy MNT at intervals':fontcolor=${GREEN}:fontsize=28:x=300:y=250:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='📐 Grid Trading — Buy/sell at price levels':fontcolor=${CYAN}:fontsize=28:x=300:y=300:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='🔍 Arbitrage — Scan Agni vs Merchant Moe':fontcolor=${ACCENT}:fontsize=28:x=300:y=350:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='🛡️ Stop Loss — Auto-sell at thresholds':fontcolor=${GREEN}:fontsize=28:x=300:y=400:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='All tested with real on-chain transactions':fontcolor=${MUTED}:fontsize=24:x=300:y=500:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" \
  -c:v libx264 -pix_fmt yuv420p -t 5 scene6_strategies.mp4

echo "✅ Scene 6: Strategies"

# Scene 7: On-Chain Proof (5s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=5" \
  -vf "\
drawtext=text='🔗 ON-CHAIN PROOF':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=100:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='41 Real Transactions on Mantle Mainnet':fontcolor=${GREEN}:fontsize=32:x=(w-text_w)/2:y=200:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Smart Contract: 0xb22c...9507':fontcolor=${CYAN}:fontsize=28:x=300:y=300:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='ERC-8004: Token #98':fontcolor=${ACCENT}:fontsize=28:x=300:y=350:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='DCA: 0xf194...a71f ✅':fontcolor=${GREEN}:fontsize=24:x=300:y=420:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Grid: 0x3b08...016 ✅':fontcolor=${GREEN}:fontsize=24:x=300:y=460:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='StopLoss: 0xcd8c...5596 ✅':fontcolor=${GREEN}:fontsize=24:x=300:y=500:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" \
  -c:v libx264 -pix_fmt yuv420p -t 5 scene7_proof.mp4

echo "✅ Scene 7: On-Chain Proof"

# Scene 8: Outro (5s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=5" \
  -vf "\
drawtext=text='🚀 MANTLEAGENT':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=300:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='Built for Mantle Turing Test Hackathon 2026':fontcolor=${CYAN}:fontsize=28:x=(w-text_w)/2:y=400:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Track 6: Agentic Wallets & Economy':fontcolor=${ACCENT}:fontsize=24:x=(w-text_w)/2:y=450:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='mantle-agent.vercel.app':fontcolor=${GREEN}:fontsize=28:x=(w-text_w)/2:y=520:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='github.com/ulsreall/mantle-agent-wallet':fontcolor=${MUTED}:fontsize=24:x=(w-text_w)/2:y=570:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" \
  -c:v libx264 -pix_fmt yuv420p -t 5 scene8_outro.mp4

echo "✅ Scene 8: Outro"

# Concatenate all scenes
echo "=== Concatenating scenes ==="
cat > concat.txt << EOF
file 'scene1_title.mp4'
file 'scene2_stats.mp4'
file 'scene3_wallet.mp4'
file 'scene4_chart.mp4'
file 'scene5_history.mp4'
file 'scene6_strategies.mp4'
file 'scene7_proof.mp4'
file 'scene8_outro.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i concat.txt -c copy ../mantle-agent-demo-v2.mp4

echo "✅ Video created: ../mantle-agent-demo-v2.mp4"
echo "Duration: 40 seconds (8 scenes × 5s)"
