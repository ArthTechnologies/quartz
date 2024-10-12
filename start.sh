#!/bin/bash

while [ true ]; do
   screen -dmS qua sh scripts/autorestart.sh

   echo Restarting...
   echo CTRL + C to stop.

done
