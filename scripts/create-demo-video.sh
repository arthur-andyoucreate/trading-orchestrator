#!/bin/bash

# Trading Orchestrator - Demo Video Creation
# Creates professional demo videos from recordings

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RECORDINGS_DIR="./recordings"
OUTPUT_DIR="./videos"
TEMP_DIR="./temp_video"

# Create directories
mkdir -p "$OUTPUT_DIR" "$TEMP_DIR"

echo "🎬 Creating Trading Orchestrator Demo Video - $TIMESTAMP"

# Function to create title cards
create_title_card() {
    local title="$1"
    local subtitle="$2"
    local output="$3"
    
    ffmpeg -f lavfi -i color=c=0x1a1a1a:size=1920x1080:duration=3 \
        -vf "drawtext=text='$title':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-50,drawtext=text='$subtitle':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=0x888888:x=(w-text_w)/2:y=(h-text_h)/2+50" \
        -y "$output"
    
    echo "📝 Title card created: $title"
}

# Function to add overlay to screenshots
add_overlay_to_screenshots() {
    local input_dir="$1"
    local output_dir="$2"
    
    mkdir -p "$output_dir"
    
    for img in "$input_dir"/*.png; do
        if [ -f "$img" ]; then
            basename_img=$(basename "$img")
            output_img="$output_dir/overlay_$basename_img"
            
            # Add timestamp and branding overlay
            ffmpeg -i "$img" \
                -vf "drawtext=text='Trading Orchestrator':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=white:x=50:y=50,drawtext=text='%{localtime}':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=18:fontcolor=0x888888:x=w-200:y=50" \
                -y "$output_img"
        fi
    done
    
    echo "✅ Overlays added to screenshots"
}

# Function to create section video from screenshots
create_section_video() {
    local section_name="$1"
    local duration="$2"
    local output_file="$3"
    
    echo "🎥 Creating $section_name video..."
    
    # Create title card for section
    create_title_card "$section_name" "Trading Intelligence Enhancement" "$TEMP_DIR/${section_name}_title.mp4"
    
    # Convert screenshots to video
    if ls "$RECORDINGS_DIR"/*"$section_name"*.png 1> /dev/null 2>&1; then
        ffmpeg -framerate 0.5 \
            -pattern_type glob \
            -i "$RECORDINGS_DIR/*${section_name}*.png" \
            -c:v libx264 \
            -r 30 \
            -pix_fmt yuv420p \
            -t "$duration" \
            "$TEMP_DIR/${section_name}_slides.mp4"
        
        # Combine title + slides
        ffmpeg -i "$TEMP_DIR/${section_name}_title.mp4" \
            -i "$TEMP_DIR/${section_name}_slides.mp4" \
            -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" \
            -map "[v]" \
            -y "$output_file"
    else
        # Just use title card if no screenshots
        cp "$TEMP_DIR/${section_name}_title.mp4" "$output_file"
    fi
    
    echo "✅ Section video created: $output_file"
}

# Function to create comprehensive demo
create_comprehensive_demo() {
    echo "🚀 Creating comprehensive demo video..."
    
    # Create intro
    create_title_card "Trading Orchestrator" "Multi-Source Intelligence Trading System" "$TEMP_DIR/intro.mp4"
    
    # Create section videos
    create_section_video "Dashboard" 10 "$TEMP_DIR/dashboard.mp4"
    create_section_video "Intelligence" 15 "$TEMP_DIR/intelligence.mp4"
    create_section_video "Signals" 12 "$TEMP_DIR/signals.mp4"
    create_section_video "Risk" 10 "$TEMP_DIR/risk.mp4"
    create_section_video "Hyperliquid" 8 "$TEMP_DIR/hyperliquid.mp4"
    create_section_video "Analytics" 10 "$TEMP_DIR/analytics.mp4"
    
    # Create outro
    create_title_card "Enhancement Complete" "Solide + Multi-Source Intelligence" "$TEMP_DIR/outro.mp4"
    
    # Combine all sections
    echo "🎬 Combining all sections..."
    
    # Create list file for concatenation
    cat > "$TEMP_DIR/video_list.txt" << EOF
file 'intro.mp4'
file 'dashboard.mp4'
file 'intelligence.mp4'
file 'signals.mp4'
file 'risk.mp4'
file 'hyperliquid.mp4'
file 'analytics.mp4'
file 'outro.mp4'
EOF

    ffmpeg -f concat -safe 0 -i "$TEMP_DIR/video_list.txt" \
        -c copy \
        "$OUTPUT_DIR/trading_orchestrator_demo_${TIMESTAMP}.mp4"
    
    echo "🎉 Comprehensive demo created: $OUTPUT_DIR/trading_orchestrator_demo_${TIMESTAMP}.mp4"
}

# Function to create time-lapse from development
create_development_timelapse() {
    echo "⚡ Creating development timelapse..."
    
    if ls "$RECORDINGS_DIR"/dev_*.png 1> /dev/null 2>&1; then
        ffmpeg -framerate 8 \
            -pattern_type glob \
            -i "$RECORDINGS_DIR/dev_*.png" \
            -filter:v "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setpts=0.125*PTS" \
            -c:v libx264 \
            -preset fast \
            -crf 20 \
            -pix_fmt yuv420p \
            "$OUTPUT_DIR/development_timelapse_${TIMESTAMP}.mp4"
        
        echo "⚡ Development timelapse created"
    else
        echo "⚠️  No development screenshots found"
    fi
}

# Function to create Neo agent progress video
create_neo_progress_video() {
    local run_id="$1"
    echo "🤖 Creating Neo agent progress video for run: $run_id"
    
    # Create logs visualization
    if [ -f "$RECORDINGS_DIR/logs/neo_${run_id}_*.log" ]; then
        # Convert logs to text overlay video
        ffmpeg -f lavfi -i color=c=black:size=1920x1080:duration=60 \
            -vf "drawtext=textfile='$RECORDINGS_DIR/logs/neo_${run_id}_*.log':fontfile=/System/Library/Fonts/Monaco.ttc:fontsize=16:fontcolor=green:x=50:y=50:reload=1" \
            "$OUTPUT_DIR/neo_progress_${run_id}_${TIMESTAMP}.mp4"
        
        echo "🤖 Neo progress video created"
    else
        echo "⚠️  No Neo logs found for run: $run_id"
    fi
}

# Main execution
case "${1:-help}" in
    "demo")
        add_overlay_to_screenshots "$RECORDINGS_DIR" "$TEMP_DIR/overlays"
        create_comprehensive_demo
        ;;
    "timelapse")
        create_development_timelapse
        ;;
    "neo")
        NEO_RUN_ID="${2:-$(neo runs --last 1 | tail -1 | cut -d' ' -f1)}"
        create_neo_progress_video "$NEO_RUN_ID"
        ;;
    "full")
        echo "🎬 Creating full video suite..."
        add_overlay_to_screenshots "$RECORDINGS_DIR" "$TEMP_DIR/overlays"
        create_comprehensive_demo
        create_development_timelapse
        NEO_RUN_ID=$(neo runs --last 1 | tail -1 | cut -d' ' -f1)
        create_neo_progress_video "$NEO_RUN_ID"
        echo "🎉 Full video suite completed!"
        ;;
    "help"|*)
        echo "🎬 Trading Orchestrator - Demo Video Creation"
        echo ""
        echo "Usage:"
        echo "  $0 demo                    - Create comprehensive demo video"
        echo "  $0 timelapse              - Create development timelapse"  
        echo "  $0 neo [run_id]           - Create Neo agent progress video"
        echo "  $0 full                   - Create complete video suite"
        echo ""
        echo "Output directory: $OUTPUT_DIR"
        ;;
esac

# Cleanup
rm -rf "$TEMP_DIR"

echo "🎬 Video creation completed at $(date)"