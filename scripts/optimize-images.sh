#!/usr/bin/env bash
# optimize-images.sh
# Installs @funboxteam/optimizt and runs lossless image optimization on a chosen folder.
# Output is written to an 'output' subfolder inside the target folder.
# https://github.com/funbox/optimizt

set -euo pipefail

# Install optimizt globally if not already present
if command -v optimizt &>/dev/null; then
    echo "optimizt is already installed, skipping."
else
    echo "Installing @funboxteam/optimizt..."
    npm install --global @funboxteam/optimizt
fi

# Accept folder as argument or prompt for it
if [[ -n "${1:-}" ]]; then
    target_folder="$1"
else
    read -rp "Enter the path to the folder you want to optimize: " target_folder
fi

if [[ -z "$target_folder" ]]; then
    echo "Error: No folder path provided. Exiting." >&2
    exit 1
fi

# Strip any surrounding quotes the user may have included
target_folder="${target_folder#[\"\']}"
target_folder="${target_folder%[\"\']}"

if [[ ! -d "$target_folder" ]]; then
    echo "Error: Folder not found: $target_folder" >&2
    exit 1
fi

# Resolve to an absolute path
target_folder="$(cd "$target_folder" && pwd)"
output_folder="$target_folder/output"

mkdir -p "$output_folder"

echo ""
echo "Target folder : $target_folder"
echo "Output folder : $output_folder"
echo ""
echo "Running optimizt ..."

optimizt --output "$output_folder" "$target_folder"

echo ""
echo "Done! Optimized images saved to: $output_folder"
