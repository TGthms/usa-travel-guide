#!/bin/bash
# Double-click this file in Finder to open the Gallery Manager for use from
# other devices on your home wifi (phone, iPad, another laptop).
#
# Only use this at home. The script itself will refuse to run if your
# current wifi isn't in tools/.trusted_wifi — see tools/README.md.
cd "$(dirname "$0")"
echo "Starting Gallery Manager (home wifi — reachable from other devices)…"
echo "A browser window should open. Press Ctrl+C here to stop."
echo ""
python3 tools/gallery_manager.py --host 0.0.0.0
