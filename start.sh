#!/bin/bash

# Check if the script is run as root
if [[ "$EUID" -ne 0 ]]; then
  echo "This script must be run as root. Please use sudo."
  exit 1
fi

# Start the screen session
screen -dmS qua sh scripts/autorestart.sh

echo "Quartz has started at port 4000."