#!/bin/bash

Help()
{
    echo "Available options:"
    echo "-h  Display this help text"
    echo "-b  Build the project using Docker"
    echo "-u  Build (if needed) and run container"
    echo "-d  Bring down all containers"
    echo "-c  Remove all the containers and data"
}

Build()
{
    docker compose build
}

Up()
{
    docker compose up -d
}

Down()
{
    docker compose down
}

Clean()
{
    docker compose down -v --remove-orphans
    docker builder prune -af
    docker image prune -af
    docker volume prune -af
}

while getopts ":h :b :u :c :d" option; do
   case $option in
      h) # display Help
         Help
         exit;;
      b)
         Build
         exit;;
      u)
         Up
         exit;;
      c)
         Clean
         exit;;
      d)
         Down
         exit;;
      \?)
         echo "Valid options are h, b, u and c"
   esac
done