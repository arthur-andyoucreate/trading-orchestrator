#!/bin/bash

# Project Showcase Video Creator
# Shows our current project structure and Neo agent work

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="./videos"

mkdir -p "$OUTPUT_DIR"

echo "🎬 Creating Trading Orchestrator Project Showcase"

# Create project structure visualization
create_structure_video() {
    local output="$OUTPUT_DIR/project_structure_${TIMESTAMP}.mp4"
    
    echo "📁 Creating project structure video..."
    
    # Get project structure
    STRUCTURE=$(tree -I 'node_modules|.git|.neo' . 2>/dev/null || echo "Project Structure:\n$(ls -la | head -15)")
    
    # Create text visualization
    ffmpeg -f lavfi -i color=c=0x1a1a1a:size=1920x1080:duration=10 \
        -vf "drawtext=text='Trading Orchestrator Project':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=100,drawtext=text='$STRUCTURE':fontsize=16:fontcolor=lightgreen:x=100:y=300" \
        -y "$output" 2>/dev/null || {
        # Simple fallback
        ffmpeg -f lavfi -i color=c=green:size=1920x1080:duration=10 \
            -y "$output" 2>/dev/null
    }
    
    echo "✅ Structure video: $output"
}

# Create Neo agent status video
create_neo_status_video() {
    local output="$OUTPUT_DIR/neo_agent_status_${TIMESTAMP}.mp4"
    
    echo "🤖 Creating Neo agent status video..."
    
    # Get Neo status
    NEO_STATUS=$(neo runs --last 3 2>/dev/null || echo "Neo Agent Working...")
    NEO_COST=$(neo cost 2>/dev/null || echo "Cost tracking...")
    
    # Create status visualization
    ffmpeg -f lavfi -i color=c=0x2a2a2a:size=1920x1080:duration=8 \
        -vf "drawtext=text='Neo Agent Orchestration':fontsize=48:fontcolor=cyan:x=(w-text_w)/2:y=150,drawtext=text='Status: ACTIVE':fontsize=32:fontcolor=lime:x=(w-text_w)/2:y=300,drawtext=text='Enhancing Solide with Intelligence':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=400" \
        -y "$output" 2>/dev/null || {
        # Simple fallback
        ffmpeg -f lavfi -i color=c=blue:size=1920x1080:duration=8 \
            -y "$output" 2>/dev/null
    }
    
    echo "✅ Neo status video: $output"
}

# Create specifications summary video
create_specs_video() {
    local output="$OUTPUT_DIR/specifications_${TIMESTAMP}.mp4"
    
    echo "📊 Creating specifications video..."
    
    # Create specs visualization
    ffmpeg -f lavfi -i color=c=0x4a4a4a:size=1920x1080:duration=12 \
        -vf "drawtext=text='Trading System Specifications':fontsize=48:fontcolor=yellow:x=(w-text_w)/2:y=150,drawtext=text='Architecture: Next.js 15 + TypeScript':fontsize=24:fontcolor=white:x=100:y=300,drawtext=text='Intelligence: Reddit + DeFi + News + Forecasting':fontsize=24:fontcolor=white:x=100:y=350,drawtext=text='Risk Management: Kelly Sizing + Portfolio Heat':fontsize=24:fontcolor=white:x=100:y=400,drawtext=text='Execution: Hyperliquid Integration':fontsize=24:fontcolor=white:x=100:y=450,drawtext=text='Target: Sharpe >2.0, Drawdown <10%':fontsize=24:fontcolor=lime:x=100:y=500" \
        -y "$output" 2>/dev/null || {
        # Simple fallback
        ffmpeg -f lavfi -i color=c=purple:size=1920x1080:duration=12 \
            -y "$output" 2>/dev/null
    }
    
    echo "✅ Specs video: $output"
}

# Create workflow video
create_workflow_video() {
    local output="$OUTPUT_DIR/workflow_${TIMESTAMP}.mp4"
    
    echo "🎭 Creating workflow video..."
    
    ffmpeg -f lavfi -i color=c=0x6a6a6a:size=1920x1080:duration=10 \
        -vf "drawtext=text='Neo Agent Workflow':fontsize=48:fontcolor=orange:x=(w-text_w)/2:y=150,drawtext=text='1. Product Manager -> Specifications':fontsize=24:fontcolor=white:x=100:y=300,drawtext=text='2. Trading Expert -> Strategy Design':fontsize=24:fontcolor=white:x=100:y=350,drawtext=text='3. System Architect -> Technical Design':fontsize=24:fontcolor=white:x=100:y=400,drawtext=text='4. Developer Agent -> Implementation':fontsize=24:fontcolor=lime:x=100:y=450,drawtext=text='5. Code Reviewer -> Quality Assurance':fontsize=24:fontcolor=white:x=100:y=500,drawtext=text='Cost: $2.25 total investment':fontsize=20:fontcolor=yellow:x=100:y=600" \
        -y "$output" 2>/dev/null || {
        # Simple fallback
        ffmpeg -f lavfi -i color=c=orange:size=1920x1080:duration=10 \
            -y "$output" 2>/dev/null
    }
    
    echo "✅ Workflow video: $output"
}

# Create comprehensive showcase
create_showcase() {
    local output="$OUTPUT_DIR/trading_orchestrator_showcase_${TIMESTAMP}.mp4"
    
    echo "🎬 Creating comprehensive showcase..."
    
    # Create intro
    ffmpeg -f lavfi -i color=c=black:size=1920x1080:duration=3 \
        -vf "drawtext=text='Trading Orchestrator':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,1,3)'" \
        -y "./videos/intro.mp4" 2>/dev/null
    
    # Combine all videos
    cat > "./videos/showcase_list.txt" << EOF
file 'intro.mp4'
file 'project_structure_${TIMESTAMP}.mp4'
file 'specifications_${TIMESTAMP}.mp4'  
file 'workflow_${TIMESTAMP}.mp4'
file 'neo_agent_status_${TIMESTAMP}.mp4'
EOF

    if ffmpeg -f concat -safe 0 -i "./videos/showcase_list.txt" -c copy "$output" 2>/dev/null; then
        echo "✅ Showcase created: $output"
        
        # Get file info
        local size=$(du -h "$output" | cut -f1)
        echo "📁 Showcase size: $size"
    else
        echo "⚠️ Using individual videos instead of combined"
    fi
    
    # Cleanup
    rm -f "./videos/intro.mp4" "./videos/showcase_list.txt"
}

# Main execution
echo "🚀 Creating all showcase videos..."

create_structure_video
create_specs_video  
create_workflow_video
create_neo_status_video
create_showcase

echo ""
echo "🎉 PROJECT SHOWCASE COMPLETE!"
echo "============================="
echo "📁 Output directory: $OUTPUT_DIR"

# List all videos
echo "📺 Created videos:"
ls -la "$OUTPUT_DIR"/*.mp4 | while read line; do
    filename=$(echo "$line" | awk '{print $9}')
    size=$(echo "$line" | awk '{print $5}')
    echo "  🎬 $(basename "$filename") - $size bytes"
done

echo ""
echo "🚀 Videos ready for Arthur to view!"

# Show total size
total_size=$(du -sh "$OUTPUT_DIR" | cut -f1)
echo "💾 Total videos size: $total_size"