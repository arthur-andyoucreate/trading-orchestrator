#!/bin/bash

# Trading Orchestrator - Progress Recording Script
# Records development progress with Playwright + FFmpeg

set -e

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RECORDINGS_DIR="./recordings"
VIDEO_DIR="$RECORDINGS_DIR/videos"
SCREENSHOTS_DIR="$RECORDINGS_DIR/screenshots"

# Create directories
mkdir -p "$VIDEO_DIR" "$SCREENSHOTS_DIR"

echo "🎥 Starting Trading Orchestrator Progress Recording - $TIMESTAMP"

# Function to record browser session
record_browser_session() {
    local session_name="$1"
    local duration="$2"
    local output_file="$VIDEO_DIR/${session_name}_${TIMESTAMP}.mp4"
    
    echo "📹 Recording $session_name for ${duration}s..."
    
    # Start Playwright with recording
    npx playwright test \
        --headed \
        --video=on \
        --screenshot=on \
        tests/progress-recording.spec.ts \
        --grep="$session_name" || true
    
    echo "✅ Browser session recorded: $output_file"
}

# Function to record terminal/IDE
record_terminal_session() {
    local session_name="$1"
    local duration="$2"
    local output_file="$VIDEO_DIR/terminal_${session_name}_${TIMESTAMP}.mp4"
    
    echo "🖥️ Recording terminal session: $session_name"
    
    # Use FFmpeg to record screen
    ffmpeg -f avfoundation \
        -i "1:0" \
        -t "$duration" \
        -r 30 \
        -c:v libx264 \
        -preset fast \
        -crf 23 \
        -c:a aac \
        -b:a 128k \
        "$output_file" &
    
    FFMPEG_PID=$!
    echo "🎬 Terminal recording started (PID: $FFMPEG_PID)"
    echo "⏰ Recording for ${duration}s..."
    
    return $FFMPEG_PID
}

# Function to create development timelapse
create_dev_timelapse() {
    local project_name="$1"
    local output_file="$VIDEO_DIR/timelapse_${project_name}_${TIMESTAMP}.mp4"
    
    echo "⚡ Creating development timelapse..."
    
    # Take screenshot every 30 seconds
    for i in {1..20}; do
        screenshot_file="$SCREENSHOTS_DIR/dev_${i}_${TIMESTAMP}.png"
        
        # Screenshot of VS Code/terminal
        screencapture -x "$screenshot_file"
        echo "📸 Screenshot $i/20 taken"
        
        sleep 30
    done
    
    # Create timelapse from screenshots
    ffmpeg -framerate 4 \
        -pattern_type glob \
        -i "$SCREENSHOTS_DIR/dev_*_${TIMESTAMP}.png" \
        -c:v libx264 \
        -pix_fmt yuv420p \
        "$output_file"
    
    echo "🎞️ Timelapse created: $output_file"
}

# Function to record Neo agent logs
record_neo_logs() {
    local run_id="$1"
    local output_file="$RECORDINGS_DIR/logs/neo_${run_id}_${TIMESTAMP}.log"
    
    mkdir -p "$RECORDINGS_DIR/logs"
    
    echo "📝 Recording Neo agent logs for run: $run_id"
    
    # Follow Neo logs and save to file
    neo logs -f "$run_id" > "$output_file" &
    LOGS_PID=$!
    
    echo "📊 Neo logs recording started (PID: $LOGS_PID)"
    return $LOGS_PID
}

# Function to create summary video
create_summary_video() {
    local project_name="$1"
    local output_file="$VIDEO_DIR/summary_${project_name}_${TIMESTAMP}.mp4"
    
    echo "🎬 Creating project summary video..."
    
    # Combine multiple video sources
    ffmpeg -i "$VIDEO_DIR/terminal_${project_name}_${TIMESTAMP}.mp4" \
        -i "$VIDEO_DIR/timelapse_${project_name}_${TIMESTAMP}.mp4" \
        -filter_complex "[0:v][1:v]hstack=inputs=2[v]" \
        -map "[v]" \
        -c:v libx264 \
        -preset fast \
        -crf 20 \
        "$output_file"
    
    echo "🎥 Summary video created: $output_file"
}

# Main recording functions
case "${1:-help}" in
    "browser")
        record_browser_session "${2:-development}" "${3:-60}"
        ;;
    "terminal")
        record_terminal_session "${2:-coding}" "${3:-300}"
        ;;
    "timelapse")
        create_dev_timelapse "${2:-trading-orchestrator}"
        ;;
    "neo-logs")
        record_neo_logs "${2:-latest}"
        ;;
    "full")
        echo "🎬 Starting comprehensive recording session..."
        
        # Record Neo agent progress
        NEO_RUN_ID=$(neo runs --last 1 | tail -1 | cut -d' ' -f1)
        record_neo_logs "$NEO_RUN_ID"
        
        # Record terminal session
        record_terminal_session "development" 180 &
        TERMINAL_PID=$!
        
        # Create development timelapse
        create_dev_timelapse "solide-enhancement" &
        TIMELAPSE_PID=$!
        
        # Wait for recordings to complete
        wait $TERMINAL_PID $TIMELAPSE_PID
        
        # Create summary
        create_summary_video "solide-enhancement"
        
        echo "🎉 Full recording session completed!"
        ;;
    "help"|*)
        echo "📹 Trading Orchestrator - Progress Recording"
        echo ""
        echo "Usage:"
        echo "  $0 browser [session_name] [duration]     - Record browser session"
        echo "  $0 terminal [session_name] [duration]    - Record terminal/IDE"
        echo "  $0 timelapse [project_name]             - Create development timelapse"
        echo "  $0 neo-logs [run_id]                    - Record Neo agent logs"
        echo "  $0 full [project_name]                  - Comprehensive recording"
        echo ""
        echo "Examples:"
        echo "  $0 browser solide-dashboard 120"
        echo "  $0 terminal coding-session 300"
        echo "  $0 timelapse solide-enhancement"
        echo "  $0 full trading-orchestrator"
        ;;
esac

echo "🎬 Recording completed at $(date)"