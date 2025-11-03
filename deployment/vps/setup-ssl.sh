#!/bin/bash
# SSL Setup Script for Contabo VPS (Optional)
# Run this AFTER basic deployment if you have a domain name

set -e

echo "🔒 Setting up SSL Certificate with Let's Encrypt"

# Configuration
DOMAIN="$1"
EMAIL="$2"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 yourdemo.com admin@yourdemo.com"
    exit 1
fi

# Install certbot
echo "📦 Installing Certbot..."
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
echo "🔒 Obtaining SSL certificate for $DOMAIN..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL

# Setup auto-renewal
echo "🔄 Setting up auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Test renewal
certbot renew --dry-run

echo "✅ SSL setup completed!"
echo "🌐 Your site is now available at: https://$DOMAIN"