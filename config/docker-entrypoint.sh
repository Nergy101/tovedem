#!/bin/sh
set -e
cat > /usr/share/nginx/html/assets/env.js <<EOF
window.APP_ENV = {
  PRODUCTION:          "${PRODUCTION:-false}",
  POCKETBASE_BASE_URL: "${POCKETBASE_BASE_URL:-}",
  POCKETBASE_ADMIN_URL:"${POCKETBASE_ADMIN_URL:-}",
  CAPTCHA_SITE_KEY:    "${CAPTCHA_SITE_KEY:-}",
  KUMA_STATUS_URL:     "${KUMA_STATUS_URL:-}",
  UMAMI_SCRIPT_URL:    "${UMAMI_SCRIPT_URL:-}",
  UMAMI_WEBSITE_ID:    "${UMAMI_WEBSITE_ID:-}"
};
EOF
exec nginx -g "daemon off;"
