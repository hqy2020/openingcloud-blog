#!/usr/bin/env sh
set -eu

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers ${GUNICORN_WORKERS:-2} \
  --threads ${GUNICORN_THREADS:-2} \
  --max-requests ${GUNICORN_MAX_REQUESTS:-1000} \
  --max-requests-jitter ${GUNICORN_MAX_REQUESTS_JITTER:-50}
