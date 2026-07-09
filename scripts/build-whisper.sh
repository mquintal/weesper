#!/bin/bash
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../apps/admin" && pwd )"
RESOURCES_DIR="$PROJECT_ROOT/resources"

# Version (can be overridden via env var, e.g. from CI)
WHISPER_VERSION="${WHISPER_VERSION:-v1.8.4}"

# Create a temporary directory for cloning
TEMP_DIR=$(mktemp -d)

# Ensure temp directory is removed on exit
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "Cloning whisper.cpp $WHISPER_VERSION to $TEMP_DIR..."
git clone --depth 1 --branch "$WHISPER_VERSION" https://github.com/ggml-org/whisper.cpp.git "$TEMP_DIR"

cd "$TEMP_DIR"

# Patch for missing errno include on some systems
echo "Patching ggml/src/gguf.cpp for missing includes..."
sed -i '' '1i\
#include <cerrno>\
#include <cstring>
' ggml/src/gguf.cpp

echo "Compiling whisper.cpp (static)..."
NPROC=$(nproc 2>/dev/null || sysctl -n hw.logicalcpu 2>/dev/null || echo 2)

ARCH="$(uname -m)"
EXTRA_FLAGS=""
METAL_FLAG="ON"
if [ "$ARCH" = "x86_64" ]; then
  EXTRA_FLAGS="-DGGML_AVX2=ON -DGGML_FMA=ON -DGGML_F16C=ON"
  METAL_FLAG="OFF"
fi

cmake -B build -DBUILD_SHARED_LIBS=OFF -DWHISPER_METAL=$METAL_FLAG -DGGML_METAL=$METAL_FLAG -DWHISPER_FLASH_ATTN=$METAL_FLAG -DCMAKE_OSX_ARCHITECTURES="$ARCH" -DGGML_NATIVE=OFF -DWHISPER_NATIVE=OFF $EXTRA_FLAGS && cmake --build build -j $NPROC --config Release

echo "Ensuring resources directory exists..."
mkdir -p "$RESOURCES_DIR"

echo "Copying the entire build directory to $RESOURCES_DIR/whisper.cpp/..."
# Remove existing build dir if it exists to avoid nested copies
rm -rf "$RESOURCES_DIR/whisper.cpp"
mkdir -p "$RESOURCES_DIR/whisper.cpp"
cp -R build/bin/whisper-server "$RESOURCES_DIR/whisper.cpp/whisper-server"

echo "Downloading Silero VAD model..."
VAD_DIR="$RESOURCES_DIR/whisper.cpp/vad"
mkdir -p "$VAD_DIR"
curl -L -o "$VAD_DIR/ggml-silero-v6.2.0.bin" \
  "https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin"

echo "Successfully built and copied the build folder to $RESOURCES_DIR/whisper.cpp"
