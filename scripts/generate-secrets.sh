#!/bin/bash
# Generate secrets file for Cloudflare deployment
# Replace the placeholder with your actual Cloudflare API token

echo "CF_API_TOKEN=your_actual_cloudflare_api_token" > .env
echo "Secrets file generated. Remember to:"
echo "1. Replace 'your_actual_cloudflare_api_token' with your real token"
echo "2. Keep this file secure and never commit it to version control"