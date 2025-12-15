#!/bin/sh

Help()
{
    echo "Available options:"
    echo "h - Display this help text"
    echo "b - Build the project using Docker"
    echo "u - Build (if needed) and run container"
}

while getopts ":h" option; do
   case $option in
      h) # display Help
         Help
         exit;;
   esac
done

echo "Hello world!"