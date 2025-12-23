FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy project
COPY . .

# Create necessary directories
RUN mkdir -p /app/static /app/media

# Expose port
EXPOSE 8000

# Create wait script
RUN echo '#!/bin/sh\n\
set -e\n\
\n\
host="$1"\n\
shift\n\
port="$1"\n\
shift\n\
\n\
until nc -z "$host" "$port"; do\n\
  >&2 echo "Waiting for $host:$port to be available..."\n\
  sleep 1\n\
done\n\
\n\
>&2 echo "$host:$port is available - executing command"\n\
exec "$@"' > /wait-for.sh && chmod +x /wait-for.sh

# Install netcat for wait script
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Start server (migrations should be run manually with make migrate)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]

