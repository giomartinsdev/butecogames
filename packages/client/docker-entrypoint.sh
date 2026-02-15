#!/bin/sh
set -e

# Replace placeholder env vars in JS bundles with actual runtime values
# This allows the same Docker image to work across different environments
for file in /usr/share/nginx/html/assets/*.js; do
  sed -i "s|__VITE_API_URL__|${VITE_API_URL:-}|g" "$file"
  sed -i "s|__VITE_WS_URL__|${VITE_WS_URL:-}|g" "$file"
done

# Start nginx
exec nginx -g 'daemon off;'
