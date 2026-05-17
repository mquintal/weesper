#!/bin/bash

# Exit on error
set -e

echo "🎨 Generating icons for build..."

# Navigate to the root of the project (two levels up from scripts/)
cd "$(dirname "$0")/.."

SOURCE_ICON="apps/admin/public/logo.png"
BUILD_DIR="apps/admin/build"

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p "$BUILD_DIR"
cp "$SOURCE_ICON" "$BUILD_DIR/icon.png"

# --- macOS Specific High-Quality .icns Generation ---
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected: Generating high-quality .icns file..."
    
    ICONSET_DIR="$BUILD_DIR/icon.iconset"
    mkdir -p "$ICONSET_DIR"

    # Create all required sizes using sips
    sips -z 16 16     "$SOURCE_ICON" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null 2>&1
    sips -z 32 32     "$SOURCE_ICON" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null 2>&1
    sips -z 32 32     "$SOURCE_ICON" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null 2>&1
    sips -z 64 64     "$SOURCE_ICON" --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null 2>&1
    sips -z 128 128   "$SOURCE_ICON" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null 2>&1
    sips -z 256 256   "$SOURCE_ICON" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null 2>&1
    sips -z 256 256   "$SOURCE_ICON" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null 2>&1
    sips -z 512 512   "$SOURCE_ICON" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null 2>&1
    sips -z 512 512   "$SOURCE_ICON" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null 2>&1
    sips -z 1024 1024 "$SOURCE_ICON" --out "$ICONSET_DIR/icon_512x512@2x.png" > /dev/null 2>&1

    # Convert iconset to icns
    iconutil -c icns "$ICONSET_DIR" -o "$BUILD_DIR/icon.icns"
    
    # Cleanup
    rm -rf "$ICONSET_DIR"
    echo "✅ Native .icns generated."
else
    echo "🐧 Linux/Other detected: Skipping native .icns generation (electron-builder will handle it)."
fi

echo "✨ Done! Icons are ready in $BUILD_DIR"
