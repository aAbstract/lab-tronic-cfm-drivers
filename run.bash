#!/bin/bash

if [ ! -d "./node_modules" ]; then
  echo "node_modules folder not found in the current directory."
  echo "Running 'npm install'..."
  npm install
  gnome-terminal -- npm run start
else
  gnome-terminal -- npm run start
fi
