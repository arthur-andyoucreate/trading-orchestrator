#!/bin/bash

# Trading Orchestrator - Demo Presentation Creator
# Creates video presentations from our specifications

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="./videos"
TEMP_DIR="./temp_presentation"

mkdir -p "$OUTPUT_DIR" "$TEMP_DIR"

echo "🎬 Creating Trading Orchestrator Presentation Video"

# Function to create text-based slides
create_text_slide() {
    local title="$1"
    local content="$2"
    local output="$3"
    local duration="${4:-5}"
    
    # Create background
    ffmpeg -f lavfi -i color=c=0x0a0a0a:size=1920x1080:duration="$duration" \
        -vf "
        drawtext=text='$title':fontfile=/System/Library/Fonts/SF-Pro-Display-Bold.otf:fontsize=64:fontcolor=white:x=(w-text_w)/2:y=150,
        drawtext=text='$content':fontfile=/System/Library/Fonts/SF-Pro.otf:fontsize=32:fontcolor=0xcccccc:x=100:y=300:text_shaping=1
        " \
        -y "$output" 2>/dev/null
    
    echo "📄 Created slide: $title"
}

# Function to create project overview slide
create_project_overview() {
    local output="$TEMP_DIR/01_overview.mp4"
    local title="Trading Orchestrator"
    local content="Multi-Source Intelligence Trading System\n\n• Reddit Sentiment Analysis\n• DeFi TVL Monitoring\n• Breaking News Analysis\n• Time Series Forecasting\n• Risk Management\n• Hyperliquid Integration"
    
    create_text_slide "$title" "$content" "$output" 8
}

# Function to create architecture slide
create_architecture_slide() {
    local output="$TEMP_DIR/02_architecture.mp4"
    local title="System Architecture"
    local content="Next.js 15 + TypeScript Frontend\n↓\nAPI Routes + Data Aggregation\n↓\nSignal Generation Engine\n↓\nRisk Management Layer\n↓\nHyperliquid Execution\n↓\nSupabase Database"
    
    create_text_slide "$title" "$content" "$output" 10
}

# Function to create signals slide
create_signals_slide() {
    local output="$TEMP_DIR/03_signals.mp4"
    local title="Multi-Factor Signals"
    local content="COMPOSITE SIGNAL FORMULA:\n\n25% Reddit Sentiment\n+\n25% DeFi TVL Changes\n+\n20% Breaking News\n+\n30% Time Series Forecasting\n\n= Trading Signal (0-100)"
    
    create_text_slide "$title" "$content" "$output" 10
}

# Function to create risk management slide
create_risk_slide() {
    local output="$TEMP_DIR/04_risk.mp4"
    local title="Risk Management"
    local content="Kelly Criterion Position Sizing\n\nPortfolio Heat Limits:\n• Max 15% per position\n• Max 80% total exposure\n• Max 10% drawdown\n\nCascading Stop Losses:\n• Level 1: -3% → Reduce 25%\n• Level 2: -5% → Reduce 50%\n• Level 3: -8% → Exit Full"
    
    create_text_slide "$title" "$content" "$output" 12
}

# Function to create performance targets slide
create_performance_slide() {
    local output="$TEMP_DIR/05_performance.mp4"
    local title="Performance Targets"
    local content="TARGET METRICS:\n\nSharpe Ratio: >2.0\nMax Drawdown: <10%\nHit Rate: >55%\nProfit Factor: >1.5\n\nBENCHMARKS:\n• BTC Buy & Hold\n• ETH Buy & Hold\n• Top 10 Market Cap"
    
    create_text_slide "$title" "$content" "$output" 10
}

# Function to create neo workflow slide
create_neo_slide() {
    local output="$TEMP_DIR/06_neo.mp4"
    local title="Neo Agent Orchestration"
    local content="DEVELOPMENT WORKFLOW:\n\n1. Product Manager → Specifications\n2. Trading Expert → Strategy Design\n3. System Architect → Technical Design\n4. Developer Agent → Implementation\n5. Code Reviewer → Quality Assurance\n6. Bug Fixer → Issue Resolution\n\nAUTOMATED END-TO-END DELIVERY"
    
    create_text_slide "$title" "$content" "$output" 12
}

# Function to create status slide
create_status_slide() {
    local output="$TEMP_DIR/07_status.mp4"
    local title="Current Status"
    local content="✅ PROJECT SETUP COMPLETE\n✅ CI/CD PIPELINE READY\n✅ CUSTOM NEO AGENTS CREATED\n✅ ARCHITECTURE DESIGNED ($1.40)\n✅ TRADING STRATEGY DEFINED ($0.85)\n🔄 DEVELOPER AGENT ACTIVE\n\nREADY FOR SOLIDE ENHANCEMENT!\n\nTotal Investment: $2.25 in AI Agents"
    
    create_text_slide "$title" "$content" "$output" 10
}

# Function to create enhancement approach slide
create_enhancement_slide() {
    local output="$TEMP_DIR/08_enhancement.mp4"
    local title="Solide Enhancement Strategy"
    local content="ADDITIVE INTELLIGENCE APPROACH:\n\n✅ Preserve existing Hyperliquid core\n✅ Add sentiment analysis layer\n✅ Add DeFi monitoring layer\n✅ Add news analysis layer\n✅ Add forecasting layer\n✅ Enhanced risk management\n✅ Real-time dashboard upgrades\n\nZERO BREAKING CHANGES"
    
    create_text_slide "$title" "$content" "$output" 12
}

# Function to combine all slides
combine_slides() {
    local output="$OUTPUT_DIR/trading_orchestrator_presentation_${TIMESTAMP}.mp4"
    
    echo "🎞️ Combining all slides..."
    
    # Create concat file
    cat > "$TEMP_DIR/slides.txt" << EOF
file '01_overview.mp4'
file '02_architecture.mp4'
file '03_signals.mp4'
file '04_risk.mp4'
file '05_performance.mp4'
file '06_neo.mp4'
file '07_status.mp4'
file '08_enhancement.mp4'
EOF

    # Combine slides
    ffmpeg -f concat -safe 0 -i "$TEMP_DIR/slides.txt" \
        -c copy \
        "$output" 2>/dev/null
    
    echo "🎉 Presentation created: $output"
    
    # Get file size
    local size=$(du -h "$output" | cut -f1)
    local duration=$(ffprobe -v quiet -select_streams v:0 -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$output" 2>/dev/null | cut -d. -f1)
    
    echo "📊 Video stats: ${size} | ${duration}s duration"
}

# Function to create Neo progress visualization
create_neo_progress() {
    local run_id="10e69d9a"
    local output="$OUTPUT_DIR/neo_agent_progress_${TIMESTAMP}.mp4"
    local title="Neo Developer Agent Progress"
    local content="AGENT ID: $run_id\n\nTASK: Enhance Solide with Intelligence\n\nMODULES:\n• Reddit Sentiment Engine\n• DeFi TVL Monitor  \n• News Impact Analyzer\n• Time Series Forecaster\n• Multi-Factor Signal Generator\n• Enhanced Risk Management\n\nSTATUS: ACTIVE"
    
    create_text_slide "$title" "$content" "$output" 15
    
    echo "🤖 Neo progress video created"
}

# Main execution
echo "🎬 Creating presentation slides..."

create_project_overview
create_architecture_slide  
create_signals_slide
create_risk_slide
create_performance_slide
create_neo_slide
create_status_slide
create_enhancement_slide

combine_slides

create_neo_progress

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "🎉 PRESENTATION VIDEOS CREATED!"
echo "================================"
echo "📁 Output directory: $OUTPUT_DIR"
echo "🎬 Main presentation: trading_orchestrator_presentation_${TIMESTAMP}.mp4"
echo "🤖 Neo progress: neo_agent_progress_${TIMESTAMP}.mp4"
echo ""
echo "🚀 Ready to share with Arthur!"

# List created files
echo "📋 Created files:"
ls -la "$OUTPUT_DIR"/*.mp4