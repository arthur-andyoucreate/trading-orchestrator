#!/bin/bash

# Trading Orchestrator - Complete Enhancement Recording
# Records the entire Solide enhancement process

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PROJECT_NAME="solide-enhancement"

echo "🎬 Starting Complete Enhancement Recording Session"
echo "📅 Timestamp: $TIMESTAMP"
echo "🎯 Project: $PROJECT_NAME"

# Get current Neo run
NEO_RUN_ID=$(neo runs --last 1 | tail -1 | cut -d' ' -f1 2>/dev/null || echo "no-run")

echo "🤖 Current Neo run: $NEO_RUN_ID"

# Function to record Neo progress
record_neo_progress() {
    echo "🤖 Recording Neo agent progress..."
    
    if [ "$NEO_RUN_ID" != "no-run" ]; then
        # Follow Neo logs
        neo logs -f "$NEO_RUN_ID" > "recordings/logs/neo_${NEO_RUN_ID}_${TIMESTAMP}.log" &
        NEO_LOGS_PID=$!
        
        echo "📊 Neo logs recording started (PID: $NEO_LOGS_PID)"
        
        # Monitor Neo status
        while neo runs "$NEO_RUN_ID" | grep -q "running"; do
            echo "⏳ Neo agent still working..."
            sleep 30
        done
        
        # Stop logging
        kill $NEO_LOGS_PID 2>/dev/null || true
        echo "✅ Neo agent completed - logs saved"
    fi
}

# Function to record development environment
record_development() {
    echo "🖥️ Recording development environment..."
    
    # Start screen recording
    ./scripts/record-progress.sh terminal "enhancement-development" 600 &
    SCREEN_PID=$!
    
    echo "📹 Screen recording started (PID: $SCREEN_PID)"
    
    # Take periodic screenshots
    for i in {1..40}; do
        screenshot_file="recordings/screenshots/dev_${i}_${TIMESTAMP}.png"
        screencapture -x "$screenshot_file" 2>/dev/null || true
        echo "📸 Screenshot $i/40 captured"
        sleep 15
    done
    
    # Stop screen recording
    kill $SCREEN_PID 2>/dev/null || true
    echo "🎬 Screen recording completed"
}

# Function to record browser sessions
record_browser_sessions() {
    echo "🌐 Recording browser sessions..."
    
    # Wait for development server to be ready
    echo "⏳ Waiting for dev server..."
    while ! curl -s http://localhost:3000 > /dev/null; do
        sleep 5
    done
    
    echo "🚀 Dev server ready - starting browser recordings"
    
    # Record different sections
    npx playwright test --project=progress-recording --grep="@dashboard" || true
    npx playwright test --project=progress-recording --grep="@intelligence" || true
    npx playwright test --project=progress-recording --grep="@signals" || true
    npx playwright test --project=progress-recording --grep="@risk" || true
    npx playwright test --project=progress-recording --grep="@hyperliquid" || true
    npx playwright test --project=progress-recording --grep="@analytics" || true
    
    echo "✅ Browser recordings completed"
}

# Function to create final videos
create_final_videos() {
    echo "🎞️ Creating final demo videos..."
    
    # Create comprehensive demo
    ./scripts/create-demo-video.sh demo
    
    # Create development timelapse
    ./scripts/create-demo-video.sh timelapse
    
    # Create Neo progress video
    if [ "$NEO_RUN_ID" != "no-run" ]; then
        ./scripts/create-demo-video.sh neo "$NEO_RUN_ID"
    fi
    
    # Create full suite
    ./scripts/create-demo-video.sh full
    
    echo "🎉 All videos created successfully!"
}

# Main execution
main() {
    # Create recordings directory
    mkdir -p recordings/{videos,screenshots,logs,reports}
    
    echo "🎬 Starting parallel recording processes..."
    
    # Start Neo monitoring in background
    record_neo_progress &
    NEO_MONITOR_PID=$!
    
    # Start development recording in background  
    record_development &
    DEV_RECORD_PID=$!
    
    # Record browser sessions (sequential)
    record_browser_sessions
    
    # Wait for background processes
    echo "⏳ Waiting for background recordings to complete..."
    wait $NEO_MONITOR_PID 2>/dev/null || true
    wait $DEV_RECORD_PID 2>/dev/null || true
    
    # Create final videos
    create_final_videos
    
    # Summary
    echo ""
    echo "🎉 RECORDING SESSION COMPLETED!"
    echo "================================="
    echo "📁 Output directory: ./videos/"
    echo "🎥 Main demo: ./videos/trading_orchestrator_demo_${TIMESTAMP}.mp4"
    echo "⚡ Timelapse: ./videos/development_timelapse_${TIMESTAMP}.mp4"
    
    if [ "$NEO_RUN_ID" != "no-run" ]; then
        echo "🤖 Neo progress: ./videos/neo_progress_${NEO_RUN_ID}_${TIMESTAMP}.mp4"
    fi
    
    echo ""
    echo "📊 Recording Stats:"
    echo "- Screenshots: $(ls recordings/screenshots/*.png 2>/dev/null | wc -l) files"
    echo "- Video files: $(ls videos/*.mp4 2>/dev/null | wc -l) files"
    echo "- Total size: $(du -sh videos/ 2>/dev/null | cut -f1)"
    echo ""
    echo "🚀 Ready to share progress with Arthur!"
}

# Trap cleanup
cleanup() {
    echo "🧹 Cleaning up background processes..."
    jobs -p | xargs -r kill 2>/dev/null || true
    echo "✅ Cleanup completed"
}

trap cleanup EXIT

# Execute main function
main "$@"