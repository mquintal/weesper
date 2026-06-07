#!/bin/bash
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../apps/admin" && pwd )"
RESOURCES_DIR="$PROJECT_ROOT/resources"

# Version (can be overridden via env var, e.g. from CI)
LLAMA_VERSION="${LLAMA_VERSION:-b9265}"

# Create a temporary directory for cloning
TEMP_DIR=$(mktemp -d)

# Ensure temp directory is removed on exit
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "Cloning llama.cpp $LLAMA_VERSION to $TEMP_DIR..."
git clone --depth 1 --branch "$LLAMA_VERSION" https://github.com/ggml-org/llama.cpp.git "$TEMP_DIR"

cd "$TEMP_DIR"

# Patch for missing errno include on some systems
echo "Patching ggml/src/gguf.cpp for missing includes..."
sed -i '' '1i\
#include <cerrno>\
#include <cstring>
' ggml/src/gguf.cpp

echo "Patching tools/server/server-http.h for missing unordered_map include..."
sed -i '' '1i\
#include <unordered_map>
' tools/server/server-http.h


echo "Compiling llama.cpp (static)..."
NPROC=$(nproc 2>/dev/null || sysctl -n hw.logicalcpu 2>/dev/null || echo 2)

ARCH="$(uname -m)"
EXTRA_FLAGS=""
METAL_FLAG="ON"
if [ "$ARCH" = "x86_64" ]; then
  EXTRA_FLAGS="-DGGML_AVX2=ON -DGGML_FMA=ON -DGGML_F16C=ON"
  METAL_FLAG="OFF"
fi

cmake -B build -DBUILD_SHARED_LIBS=OFF -DLLAMA_METAL=$METAL_FLAG -DLLAMA_CURL=OFF -DLLAMA_OPENSSL=OFF -DCMAKE_OSX_ARCHITECTURES="$ARCH" -DGGML_NATIVE=OFF -DLLAMA_NATIVE=OFF $EXTRA_FLAGS && cmake --build build -j $NPROC --config Release

echo "Ensuring resources directory exists..."
mkdir -p "$RESOURCES_DIR"

echo "Copying binaries to $RESOURCES_DIR/llama.cpp/..."
# Remove existing dir if it exists to avoid nested copies
rm -rf "$RESOURCES_DIR/llama.cpp"
mkdir -p "$RESOURCES_DIR/llama.cpp"
cp build/bin/llama-server "$RESOURCES_DIR/llama.cpp/llama-server"

echo "Successfully built and copied llama-server to $RESOURCES_DIR/llama.cpp"
