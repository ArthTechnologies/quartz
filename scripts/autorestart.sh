#!/bin/bash

while true; do
   newgrp 100 <<EOF
   node run
EOF

   echo "Restarting in 5 seconds..."
   echo "Press CTRL + C to stop."
   sleep 5
done
