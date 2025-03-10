#!/bin/bash

while true; do
   sg 100 -c 'node run'

   echo "Restarting in 5 seconds..."
   echo "Press CTRL + C to stop."
   sleep 5
done
