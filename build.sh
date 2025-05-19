#!/bin/bash

echo "🔨 Building BrowserMagic.ai extension..."

# Run webpack to bundle and copy files
npx webpack

# Check if webpack build was successful
if [ $? -eq 0 ]; then
  # Make sure directories have proper permissions
  chmod -R 755 dist
  
  echo "✅ Build completed successfully. Extension files are in the 'dist' directory."
  echo "📝 Load the extension in Chrome by going to chrome://extensions/, enabling Developer mode, and clicking 'Load unpacked'."
else
  echo "❌ Build failed. Please check the error messages above."
fi