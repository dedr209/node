#!/bin/bash
set -euo pipefail

# This script runs inside the official MongoDB image during initialization
# It creates a non-root application user on the application database.

if [ -z "${MONGO_INITDB_DATABASE:-}" ]; then
  echo "MONGO_INITDB_DATABASE not set; skipping app user creation"
  exit 0
fi

if [ -z "${MONGO_APP_USER:-}" ] || [ -z "${MONGO_APP_PASSWORD:-}" ]; then
  echo "MONGO_APP_USER or MONGO_APP_PASSWORD not set; skipping app user creation"
  exit 0
fi

echo "Creating application user '$MONGO_APP_USER' on database '$MONGO_INITDB_DATABASE'"

mongosh <<EOF
use ${MONGO_INITDB_DATABASE}
try {
  db.createUser({
    user: "${MONGO_APP_USER}",
    pwd: "${MONGO_APP_PASSWORD}",
    roles: [{ role: "readWrite", db: "${MONGO_INITDB_DATABASE}" }]
  })
} catch (e) {
  print('createUser error: ' + e);
}
EOF

