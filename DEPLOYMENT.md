# NRSport - Production Deployment Guide

คู่มือการ deploy ระบบ NRSport บน VPS/Server ด้วย Docker Compose

## Prerequisites

### System Requirements
- Ubuntu 20.04+ / Debian 11+ หรือ Linux distribution ที่รองรับ Docker
- RAM: อย่างน้อย 2GB (แนะนำ 4GB+)
- Disk Space: อย่างน้อย 10GB
- CPU: 2 cores ขึ้นไป

### Required Software
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### Installation Commands

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Deployment Steps

### 1. Clone Repository

```bash
git clone https://github.com/junior2nd/sportday-nrh-2025.git
cd sportday-nrh-2025
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

#### Required Environment Variables for Production

```env
# Django Settings
DJANGO_SECRET_KEY=<generate-strong-secret-key>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com,www.your-domain.com,<server-ip>

# Database Configuration
MYSQL_ROOT_PASSWORD=<strong-password>
MYSQL_DB_NAME=nrsport_db
MYSQL_DB_USER=nrsportuser
MYSQL_DB_PASSWORD=<strong-password>
MYSQL_DB_HOST=mysql
MYSQL_DB_PORT=3310

# Redis Configuration
REDIS_URL=redis://redis:6379/1
REDIS_PASSWORD=<optional-redis-password>

# CORS & CSRF Settings
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Next.js Frontend
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NODE_ENV=production
```

#### Generate Django Secret Key

```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Build and Start Services

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Database Setup

```bash
# Wait for database to be ready (usually takes 30-60 seconds)
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 5. Verify Deployment

```bash
# Check backend health
curl http://localhost:8000/api/health/

# Check frontend
curl http://localhost:3000

# Check all services
docker-compose -f docker-compose.prod.yml ps
```

## Nginx Reverse Proxy Setup (Recommended)

### Install Nginx

```bash
sudo apt install nginx -y
```

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/nrsport
```

### Nginx Configuration Example

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for Django Channels
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Enable and Start Nginx

```bash
sudo ln -s /etc/nginx/sites-available/nrsport /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## SSL Certificate Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

## Maintenance Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Database Backup

```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DB_NAME} > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DB_NAME} < backup_file.sql
```

### Stop Services

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose -f docker-compose.prod.yml down -v
```

## Troubleshooting

### Database Connection Issues

```bash
# Check MySQL logs
docker-compose -f docker-compose.prod.yml logs mysql

# Test database connection
docker-compose -f docker-compose.prod.yml exec backend python manage.py dbshell
```

### Static Files Not Loading

```bash
# Collect static files manually
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :8000
sudo lsof -i :3000

# Change ports in docker-compose.prod.yml if needed
```

### Container Won't Start

```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs <service-name>

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Inspect container
docker inspect <container-name>
```

### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix Docker permissions (if needed)
sudo usermod -aG docker $USER
# Log out and log back in
```

## Security Best Practices

1. **Change Default Passwords**: Always change default database and Redis passwords
2. **Use Strong Secret Keys**: Generate strong Django secret keys
3. **Enable Firewall**: Configure UFW or iptables
4. **Regular Updates**: Keep system and Docker images updated
5. **Backup Regularly**: Set up automated database backups
6. **Monitor Logs**: Regularly check application logs for errors
7. **Use HTTPS**: Always use SSL certificates in production
8. **Limit Access**: Restrict database ports to localhost only

### Firewall Setup

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

## Performance Optimization

### Database Optimization

```bash
# Add MySQL configuration in docker-compose.prod.yml
# Or create custom my.cnf
```

### Redis Optimization

- Configure Redis memory limits
- Set up Redis persistence properly
- Monitor Redis memory usage

### Frontend Optimization

- Enable Next.js production optimizations
- Configure CDN for static assets
- Enable compression in Nginx

## Monitoring

### Health Checks

All services include health checks. Monitor them with:

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Resource Usage

```bash
# Check resource usage
docker stats

# Check disk usage
docker system df
```

## Support

สำหรับปัญหาหรือคำถามเพิ่มเติม:
- ตรวจสอบ logs: `docker-compose -f docker-compose.prod.yml logs`
- ตรวจสอบ GitHub Issues: https://github.com/junior2nd/sportday-nrh-2025/issues

