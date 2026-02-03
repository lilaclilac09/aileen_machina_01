#!/bin/bash

echo "🚀 AILEEN MECHANICALA Deployment Helper"
echo "========================================"
echo ""
echo "Choose your deployment method:"
echo "1. Netlify (Drag & Drop) - EASIEST ⭐"
echo "2. Vercel (CLI)"
echo "3. Surge.sh (CLI)"
echo "4. Show deployment instructions"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo ""
    echo "📦 Opening Netlify Drop..."
    echo "👉 Go to: https://app.netlify.com/drop"
    echo "👉 Drag and drop this folder: $(pwd)"
    echo ""
    open "https://app.netlify.com/drop" 2>/dev/null || echo "Please open https://app.netlify.com/drop in your browser"
    ;;
  2)
    if command -v vercel &> /dev/null; then
      echo "🚀 Deploying to Vercel..."
      vercel --prod
    else
      echo "❌ Vercel CLI not installed"
      echo "📥 Install with: npm install -g vercel"
    fi
    ;;
  3)
    if command -v surge &> /dev/null; then
      echo "🚀 Deploying to Surge..."
      surge
    else
      echo "❌ Surge not installed"
      echo "📥 Install with: npm install -g surge"
    fi
    ;;
  4)
    cat DEPLOY.md
    ;;
  *)
    echo "Invalid choice"
    ;;
esac
