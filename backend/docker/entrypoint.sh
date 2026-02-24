#!/usr/bin/env sh
set -eu

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# 幂等创建/更新 superuser（使用环境变量）
if [ -n "${DJANGO_SUPERUSER_USERNAME:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
  python manage.py shell -c "
import os
from django.contrib.auth import get_user_model
User = get_user_model()
u, _ = User.objects.get_or_create(username=os.environ['DJANGO_SUPERUSER_USERNAME'])
u.email = os.environ.get('DJANGO_SUPERUSER_EMAIL', '')
u.set_password(os.environ['DJANGO_SUPERUSER_PASSWORD'])
u.is_staff = True
u.is_superuser = True
u.save()
print('Superuser ready:', u.username)
"
fi

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers ${GUNICORN_WORKERS:-2} \
  --threads ${GUNICORN_THREADS:-2} \
  --max-requests ${GUNICORN_MAX_REQUESTS:-1000} \
  --max-requests-jitter ${GUNICORN_MAX_REQUESTS_JITTER:-50}
