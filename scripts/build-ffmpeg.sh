#!/bin/bash
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../apps/admin" && pwd )"
RESOURCES_DIR="$PROJECT_ROOT/resources"

# Version (can be overridden via env var, e.g. from CI)
FFMPEG_VERSION="${FFMPEG_VERSION:-n8.1.1}"

# Create a temporary directory for cloning
TEMP_DIR=$(mktemp -d)

# Ensure temp directory is removed on exit
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "Cloning ffmpeg $FFMPEG_VERSION to $TEMP_DIR..."
git clone -b "$FFMPEG_VERSION" --depth 1 https://git.ffmpeg.org/ffmpeg.git "$TEMP_DIR"

cd "$TEMP_DIR"

echo "Configuring ffmpeg with minimal footprint..."
./configure \
  --enable-static \
  --disable-shared \
  --disable-autodetect \
  --disable-everything \
  --enable-decoder=opus \
  --enable-demuxer=matroska \
  --enable-parser=opus \
  --enable-encoder=pcm_s16le \
  --enable-muxer=wav \
  --enable-protocol=file,pipe \
  --enable-filter=aresample,aformat

echo "Compiling ffmpeg..."
# nproc is Linux specific, sysctl is for macOS. 
# Using a fallback to ensure it works on the user's Mac.
NPROC=$(nproc 2>/dev/null || sysctl -n hw.logicalcpu 2>/dev/null || echo 1)
make -j$NPROC

echo "Ensuring resources directory exists..."
# Clean up existing directory if it has the source tree
rm -rf "$RESOURCES_DIR/ffmpeg"
mkdir -p "$RESOURCES_DIR/ffmpeg"

echo "Copying the ffmpeg executable to $RESOURCES_DIR/ffmpeg/"
cp ffmpeg "$RESOURCES_DIR/ffmpeg/ffmpeg"

echo "Successfully built and copied ffmpeg to $RESOURCES_DIR/ffmpeg/ffmpeg"
