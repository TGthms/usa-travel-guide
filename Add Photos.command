#!/bin/bash
# Double-click this file in Finder to open the Gallery Manager.
cd "$(dirname "$0")"
echo "Starting Gallery Manager…"
echo "A browser window should open. Press Ctrl+C here to stop."
echo ""
python3 tools/gallery_manager.py
