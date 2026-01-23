#!/bin/bash

Help()
{
    echo "Available options:"
    echo "-h  Display this help text"
    echo "-b  Build the project using Docker"
    echo "-u  Build (if needed) and run container"
    echo "-d  Bring down all containers"
    echo "-c  Remove all the containers and data"
    echo "-s  Setup certificates and data directories"
}

Setup()
{
    echo "Creating data directories"
    mkdir -p data/db data/avatars certs

	# HTTPS / WSS cert
	if [ ! -f certs/cert.pem ] || [ ! -f certs/key.pem ]; then
		echo "Generating SSL certificates with openssl"
		if ! openssl req -x509 -nodes -days 365 \
			-newkey rsa:2048 \
			-keyout certs/key.pem \
			-out certs/cert.pem \
			-subj "/CN=localhost" \
			-addext "subjectAltName=DNS:localhost,IP:127.0.0.1"; then
			echo "Error: Failed to generate certificates"
			return 1
		fi
		echo "Certificates generated successfully!"
	else
		echo "Certificates already exist in certs/"
	fi
    
    echo "Setup complete!"
    return 0
}

Build()
{
    Setup || exit 1
    docker compose build
}

Up()
{
    Setup || exit 1
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

while getopts ":h :b :u :c :d :s" option; do
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
      s)
         Setup
         exit;;
      \?)
         echo "Valid options are h, b, u, c, d and s"
   esac
done
