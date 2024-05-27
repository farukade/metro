#!/bin/bash

# Navigate to your project directory
cd /home/techtink/metro || exit

# Pull the latest changes from the GitHub repository
git pull origin main

# Stop service
pm2 stop metro

# Rebuild the Node.js application
yarn install
yarn build

# Restart the PM2 instance
pm2 restart metro
pm2 logs metro

