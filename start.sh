#!/bin/bash

docker run -d --name db -p 8080:3306 -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=drawsql -v db_data:/var/lib/mysql --restart always mysql:5.7

screen -dmS qua sh scripts/autorestart.sh

echo "Quartz has started at port 4000."
