#!/usr/bin/env bash
set -euo pipefail

expected_ip="47.119.132.149"
resolved_ip="$(getent ahostsv4 www.jasongame.com | awk 'NR == 1 { print $1 }')"

if [[ "$resolved_ip" != "$expected_ip" ]]; then
  exit 0
fi

if certbot certificates 2>/dev/null | grep -q "Domains:.*www.jasongame.com"; then
  systemctl disable --now jason-www-cert.timer || true
  exit 0
fi

certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email --redirect --expand -d jasongame.com -d www.jasongame.com
systemctl disable --now jason-www-cert.timer || true
