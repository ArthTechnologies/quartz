#!/bin/sh

# One-shot permissions refresher for Quartz servers
# This mirrors the permission-fixing logic used in start.sh but only runs once.

set -e

if [ "$(id -u)" -ne 0 ]; then
  echo "Error: This script must be run with sudo or as root." >&2
  exit 1
fi

USERNAME="${SUDO_USER:-$(logname 2>/dev/null)}"
if [ -z "$USERNAME" ]; then
  echo "Error: Could not determine original user." >&2
  exit 1
fi

if [ "$USERNAME" = "root" ]; then
  FTP_UID=1000
  FTP_GID=1000
else
  FTP_UID=$(id -u "$USERNAME")
  FTP_GID=$(id -g "$USERNAME")
fi

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$SCRIPT_DIR/servers"

echo "Refreshing permissions on $SERVER_DIR..."
for dir in "$SERVER_DIR"/*/; do
  if [ -d "$dir" ]; then
    echo "Fixing $dir"
    chown -R "$FTP_UID:$FTP_GID" "$dir"
    chmod -R u+rwX,go-rwx "$dir"
  fi
done

echo "Permissions refresh completed."
