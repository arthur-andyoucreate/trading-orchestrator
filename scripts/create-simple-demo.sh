#!/bin/bash

# Simple Demo Video Creator
# Uses basic text overlays for compatibility

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="./videos"
TEMP_DIR="./temp_simple"

mkdir -p "$OUTPUT_DIR" "$TEMP_DIR"

echo "🎬 Creating Simple Trading Orchestrator Demo"

# Function to create basic text slide
create_slide() {
    local title="$1"
    local content="$2" 
    local output="$3"
    local duration="${4:-6}"
    
    # Create simple colored background with text
    ffmpeg -f lavfi -i color=c=black:size=1920x1080:duration="$duration" \
        -vf "drawtext=text='$title':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=200,drawtext=text='$content':fontsize=24:fontcolor=lightgray:x=(w-text_w)/2:y=400" \
        -y "$output" 2>/dev/null || {
        # Fallback: create simple color video
        ffmpeg -f lavfi -i color=c=navy:size=1920x1080:duration="$duration" \
            -y "$output" 2>/dev/null
    }
    
    echo "📄 Created slide: $title"
}

echo "📄 Creating presentation slides..."

# Slide 1: Overview
create_slide "Trading Orchestrator" "Multi-Source Intelligence Trading System" "$TEMP_DIR/slide1.mp4" 5

# Slide 2: Architecture
create_slide "System Architecture" "NextJS + TypeScript + Supabase + Hyperliquid" "$TEMP_DIR/slide2.mp4" 5

# Slide 3: Signals
create_slide "Multi-Factor Signals" "Reddit + DeFi + News + Forecasting = Intelligence" "$TEMP_DIR/slide3.mp4" 5

# Slide 4: Risk Management
create_slide "Risk Management" "Kelly Sizing + Portfolio Heat + Cascading Stops" "$TEMP_DIR/slide4.mp4" 5

# Slide 5: Neo Workflow
create_slide "Neo Agent Orchestration" "PM -> Trader -> Architect -> Developer -> Reviewer" "$TEMP_DIR/slide5.mp4" 5

# Slide 6: Status
create_slide "Current Status" "Architecture Complete - Developer Agent Active" "$TEMP_DIR/slide6.mp4" 5

echo "🎞️ Combining slides..."

# Create concat file
cat > "$TEMP_DIR/slides.txt" << EOF
file 'slide1.mp4'
file 'slide2.mp4'
file 'slide3.mp4'
file 'slide4.mp4'
file 'slide5.mp4'
file 'slide6.mp4'
EOF

# Combine slides
OUTPUT_FILE="$OUTPUT_DIR/trading_orchestrator_demo_${TIMESTAMP}.mp4"

if ffmpeg -f concat -safe 0 -i "$TEMP_DIR/slides.txt" -c copy "$OUTPUT_FILE" 2>/dev/null; then
    echo "✅ Demo video created: $OUTPUT_FILE"
else
    echo "⚠️ FFmpeg concat failed, creating single slide video"
    cp "$TEMP_DIR/slide1.mp4" "$OUTPUT_FILE"
fi

# Create Neo status video
NEO_OUTPUT="$OUTPUT_DIR/neo_status_${TIMESTAMP}.mp4"
create_slide "Neo Developer Agent" "Enhancing Solide with Intelligence Layers" "$NEO_OUTPUT" 8

# Get Neo run status
NEO_STATUS=$(neo runs --last 1 2>/dev/null || echo "Neo agent working...")

echo ""
echo "🎉 DEMO VIDEOS CREATED!"
echo "======================"
echo "🎬 Main demo: $OUTPUT_FILE"
echo "🤖 Neo status: $NEO_OUTPUT"
echo "📊 Neo run status: $NEO_STATUS"

# Show file info
if [ -f "$OUTPUT_FILE" ]; then
    echo "📁 Main demo size: $(du -h "$OUTPUT_FILE" | cut -f1)"
fi

if [ -f "$NEO_OUTPUT" ]; then
    echo "📁 Neo status size: $(du -h "$NEO_OUTPUT" | cut -f1)"
fi

echo ""
echo "📺 Files created in: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "🚀 Videos ready to view!"