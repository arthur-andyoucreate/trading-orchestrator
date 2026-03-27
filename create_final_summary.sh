#!/bin/bash

# Final Summary Video
echo "🎬 Creating Final Summary Video for Arthur"

OUTPUT="./videos/FINAL_SUMMARY_$(date +%H%M%S).mp4"

# Create summary slide
ffmpeg -f lavfi -i color=c=black:size=1920x1080:duration=15 \
    -vf "
    drawtext=text='Trading Orchestrator - LIVE DEMO':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=100,
    drawtext=text='✅ PROJECT SETUP COMPLETE':fontsize=32:fontcolor=lime:x=100:y=250,
    drawtext=text='✅ ARCHITECTURE DESIGNED ($1.40)':fontsize=32:fontcolor=lime:x=100:y=300,
    drawtext=text='✅ TRADING STRATEGY DEFINED ($0.85)':fontsize=32:fontcolor=lime:x=100:y=350,
    drawtext=text='🔄 NEO DEVELOPER AGENT ACTIVE (1 HOUR)':fontsize=32:fontcolor=yellow:x=100:y=400,
    drawtext=text='🎥 VIDEO RECORDING SYSTEM READY':fontsize=32:fontcolor=cyan:x=100:y=450,
    drawtext=text='🚀 ENHANCING SOLIDE WITH INTELLIGENCE':fontsize=32:fontcolor=orange:x=100:y=500,
    drawtext=text='NEXT: AWAIT NEO COMPLETION':fontsize=28:fontcolor=white:x=(w-text_w)/2:y=600,
    drawtext=text='Total Investment: $2.25':fontsize=24:fontcolor=gold:x=(w-text_w)/2:y=700
    " \
    -y "$OUTPUT" 2>/dev/null

echo "🎉 FINAL SUMMARY CREATED: $OUTPUT"
echo "📁 File size: $(du -h "$OUTPUT" | cut -f1)"

# Show all videos
echo ""
echo "📺 ALL VIDEOS CREATED FOR ARTHUR:"
echo "================================="
ls -la videos/ | grep ".mp4" | awk '{print "🎬 " $9 " - " $5 " bytes"}'

echo ""
echo "🚀 READY TO SHARE WITH ARTHUR!"

# Show total
echo "💾 Total size: $(du -sh videos/ | cut -f1)"