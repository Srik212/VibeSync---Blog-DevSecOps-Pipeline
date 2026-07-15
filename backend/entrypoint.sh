#!/bin/sh
set -e

# Named volumes are mounted as root regardless of the image's chown,
# so fix ownership on every start before dropping to the app user.
if [ -d /app/data ]; then
  chown -R appuser:appgroup /app/data
fi

exec su-exec appuser "$@"
