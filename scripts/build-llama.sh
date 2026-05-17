#!/bin/bash
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../apps/admin" && pwd )"
RESOURCES_DIR="$PROJECT_ROOT/resources"

# Create a temporary directory for cloning
TEMP_DIR=$(mktemp -d)

# Ensure temp directory is removed on exit
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "Cloning llama.cpp to $TEMP_DIR..."
git clone --depth 1 https://github.com/ggml-org/llama.cpp.git "$TEMP_DIR"

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
cmake -B build -DBUILD_SHARED_LIBS=OFF -DLLAMA_METAL=ON -DLLAMA_CURL=OFF -DLLAMA_OPENSSL=OFF -DCMAKE_OSX_ARCHITECTURES="arm64" -DGGML_NATIVE=OFF -DLLAMA_NATIVE=OFF && cmake --build build -j $NPROC --config Release

echo "Ensuring resources directory exists..."
mkdir -p "$RESOURCES_DIR"

echo "Copying binaries to $RESOURCES_DIR/llama.cpp/..."
# Remove existing dir if it exists to avoid nested copies
rm -rf "$RESOURCES_DIR/llama.cpp"
mkdir -p "$RESOURCES_DIR/llama.cpp"
cp build/bin/llama-server "$RESOURCES_DIR/llama.cpp/llama-server"

echo "Successfully built and copied llama-server to $RESOURCES_DIR/llama.cpp"
