#!/bin/bash
# ============================================
# VibeSync Blog Platform - EC2 Setup Script
# Run this script on a fresh Ubuntu EC2 instance
# ============================================
set -e

echo  "Setting up VibeSync Blog Platform..."
echo "==========================================="

APP_DIR="/var/www/vibesync"
SOURCE_DIR="${SOURCE_DIR:-$HOME/vibesync}"   # where you scp'd/cloned the project to first
DOMAIN="${DOMAIN:-_}"

# --- Update system ---
echo " Updating system packages..."
sudo apt update && sudo apt upgrade -y

# --- Install Node.js 22.x LTS ---
echo " Installing Node.js 22.x..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3 openssl
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"



# --- Install Nginx ---
echo " Installing Nginx..."
sudo apt install -y nginx

# --- Install PM2 (process manager) ---
echo " Installing PM2..."
sudo npm install -g pm2

# --- Set up project directory ---
echo "Setting up project..."
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

cp -r ~/VibeSync---Blog-DevSecOps-Pipeline/* /var/www/vibesync/

# --- Backend: install, configure, build ---
echo " Installing and building backend..."
cd "$APP_DIR/backend"
npm install --production

echo "Backend built"

# --- Build frontend ---
echo "Building frontend..."
cd "$APP_DIR/frontend"
npm install
npm run build
echo "Frontend built"

# --- Configure Nginx ---
echo "Configuring Nginx..."
sudo cp "$APP_DIR/deploy/vibesync-nginx.conf" /etc/nginx/sites-available/vibesync
sudo ln -sf /etc/nginx/sites-available/vibesync /etc/nginx/sites-enabled/vibesync
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# --- Start backend with PM2 ---
echo "Starting backend with PM2..."
cd "$APP_DIR/backend"
pm2 start dist/index.js --name vibesync-backend   # compiled output, not src/index.js
pm2 save
pm2 startup systemd -u "$USER" --hp "/home/$USER" | tail -1 | sudo bash

echo "VibeSync is now live!"


