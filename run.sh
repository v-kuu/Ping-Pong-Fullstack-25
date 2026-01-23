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

    if ! command -v mkcert &> /dev/null; then
        echo "Error: mkcert is not installed."
        echo "Install it with:"
        echo "  - Arch Linux: pacman -S mkcert"
        echo "  - macOS: brew install mkcert"
        echo "  - Debian/Ubuntu: apt install mkcert"
        echo "  - Other: see https://github.com/FiloSottile/mkcert"
        return 1
    fi

    if [ ! -f certs/cert.pem ] || [ ! -f certs/key.pem ]; then
        echo "Generating SSL certificates with mkcert"
        if ! mkcert -cert-file certs/cert.pem -key-file certs/key.pem localhost 127.0.0.1 ::1; then
            echo "Error: Failed to generate certificates"
            return 1
        fi
        echo "Certificates generated successfully!"
    else
        echo "Certificates already exist in certs/"
    fi

    if [ ! -f certs/pong.pem ] || [ ! -f certs/pong-key.pem ]; then
        echo "Generating SSL certificates for pong with mkcert"
        if ! mkcert -cert-file certs/pong.pem -key-file certs/key.pem localhost 127.0.0.1 ::1; then
            echo "Error: Failed to generate pong certificates"
            return 1
        fi
        echo "Pong certificates generated successfully!"
    else
        echo "Pong certificates already exist in certs/"
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
