# DigitalOcean Deployment Guide

คู่มือการ deploy ระบบ NRSport บน DigitalOcean

## Prerequisites

- DigitalOcean account
- Docker และ Docker Compose ติดตั้งบน Droplet
- Domain name (optional แต่แนะนำ)
- SSH access ไปยัง Droplet

## 1. สร้าง DigitalOcean Droplet

1. เข้าสู่ DigitalOcean Dashboard
2. สร้าง Droplet ใหม่:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: อย่างน้อย 2GB RAM, 1 vCPU (แนะนำ 4GB RAM สำหรับ production)
   - **Datacenter region**: เลือกตามที่ใกล้ที่สุด
   - **Authentication**: SSH keys (แนะนำ) หรือ Password
3. ตั้งค่า Firewall:
   - เปิด port 22 (SSH)
   - เปิด port 80 (HTTP)
   - เปิด port 443 (HTTPS)
   - เปิด port 3000 (Frontend - ถ้าต้องการ)
   - เปิด port 8000 (Backend - ถ้าต้องการ)

## 2. ติดตั้ง Docker บน Droplet

```bash
# SSH เข้าสู่ Droplet
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# ติดตั้ง Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# ติดตั้ง Docker Compose
apt install docker-compose-plugin -y

# ตรวจสอบการติดตั้ง
docker --version
docker compose version
```

## 3. Clone Repository

```bash
# ติดตั้ง Git
apt install git -y

# Clone repository
cd /opt
git clone <your-repository-url> nrsport
cd nrsport
```

## 4. ตั้งค่า Environment Variables

```bash
# สร้างไฟล์ .env จาก .env.example
cp .env.example .env

# แก้ไขไฟล์ .env
nano .env
```

### Environment Variables ที่ต้องตั้งค่า:

```env
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com,your-droplet-ip

# Database
MYSQL_ROOT_PASSWORD=strong-root-password
MYSQL_DB_NAME=nrsport_db
MYSQL_DB_USER=nrsportuser
MYSQL_DB_PASSWORD=strong-db-password
MYSQL_DB_HOST=mysql
MYSQL_DB_PORT=3306

# Redis
REDIS_URL=redis://redis:6379/1
REDIS_PASSWORD=strong-redis-password  # Optional แต่แนะนำ

# CORS & CSRF
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://your-droplet-ip:3000
CSRF_TRUSTED_ORIGINS=https://your-domain.com,http://your-droplet-ip:3000

# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com/api
# หรือ http://your-droplet-ip:8000/api ถ้าไม่มี domain

# Node Environment
NODE_ENV=production
```

## 5. Build และ Start Services

```bash
# Build และ start services
docker compose -f docker-compose.prod.yml up -d --build

# ตรวจสอบ logs
docker compose -f docker-compose.prod.yml logs -f

# ตรวจสอบสถานะ services
docker compose -f docker-compose.prod.yml ps
```

## 6. สร้าง Superuser (ครั้งแรก)

```bash
# เข้าสู่ backend container
docker compose -f docker-compose.prod.yml exec backend bash

# สร้าง superuser
python manage.py createsuperuser

# ออกจาก container
exit
```

## 7. ตั้งค่า Nginx Reverse Proxy (แนะนำ)

### ติดตั้ง Nginx

```bash
apt install nginx -y
```

### สร้าง Nginx Configuration

```bash
nano /etc/nginx/sites-available/nrsport
```

เพิ่ม configuration:

```nginx
# Backend API
server {
    listen 80;
    server_name api.your-domain.com;  # หรือ your-droplet-ip

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com;  # หรือ your-droplet-ip

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable Site และ Restart Nginx

```bash
# Enable site
ln -s /etc/nginx/sites-available/nrsport /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

## 8. ตั้งค่า SSL Certificate (Let's Encrypt)

```bash
# ติดตั้ง Certbot
apt install certbot python3-certbot-nginx -y

# ขอ SSL certificate
certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal จะถูกตั้งค่าอัตโนมัติ
```

## 9. Firewall Configuration

```bash
# เปิดใช้งาน UFW
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# ตรวจสอบสถานะ
ufw status
```

## 10. Monitoring และ Maintenance

### ตรวจสอบ Logs

```bash
# Backend logs
docker compose -f docker-compose.prod.yml logs backend -f

# Frontend logs
docker compose -f docker-compose.prod.yml logs frontend -f

# All logs
docker compose -f docker-compose.prod.yml logs -f
```

### Restart Services

```bash
# Restart ทั้งหมด
docker compose -f docker-compose.prod.yml restart

# Restart service เฉพาะ
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend
```

### Backup Database

```bash
# สร้าง backup script
nano /opt/nrsport/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/nrsport/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker compose -f docker-compose.prod.yml exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DB_NAME} > $BACKUP_DIR/backup_$DATE.sql

# ลบ backup เก่ากว่า 7 วัน
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x /opt/nrsport/backup.sh

# เพิ่มใน crontab สำหรับ backup รายวัน
crontab -e
# เพิ่มบรรทัดนี้:
0 2 * * * /opt/nrsport/backup.sh
```

## 11. Troubleshooting

### Database Connection Issues

```bash
# ตรวจสอบ MySQL logs
docker compose -f docker-compose.prod.yml logs mysql

# ตรวจสอบ connection
docker compose -f docker-compose.prod.yml exec backend python manage.py dbshell
```

### Redis Connection Issues

```bash
# ตรวจสอบ Redis logs
docker compose -f docker-compose.prod.yml logs redis

# Test Redis connection
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

### Static Files Issues

```bash
# Collect static files ใหม่
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### Port Already in Use

```bash
# ตรวจสอบ port ที่ใช้งาน
netstat -tulpn | grep :8000
netstat -tulpn | grep :3000

# Kill process ที่ใช้ port
kill -9 <PID>
```

## 12. Update Application

```bash
# Pull latest code
cd /opt/nrsport
git pull origin main

# Rebuild และ restart
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

## Security Checklist

- [ ] เปลี่ยน default passwords ทั้งหมด
- [ ] ตั้งค่า `DJANGO_DEBUG=False`
- [ ] ตั้งค่า `DJANGO_ALLOWED_HOSTS` ให้ถูกต้อง
- [ ] ใช้ HTTPS (SSL certificate)
- [ ] ตั้งค่า firewall (UFW)
- [ ] ใช้ SSH keys แทน password authentication
- [ ] ตั้งค่า Redis password (ถ้าใช้)
- [ ] ตั้งค่า database backup อัตโนมัติ
- [ ] ตรวจสอบ logs เป็นประจำ
- [ ] อัปเดตระบบและ packages เป็นประจำ

## Performance Optimization

1. **Database Indexing**: ตรวจสอบว่า database มี indexes ที่เหมาะสม
2. **Caching**: ใช้ Redis caching สำหรับข้อมูลที่ใช้บ่อย
3. **Static Files**: ใช้ CDN หรือ Nginx สำหรับ serve static files
4. **Database Connection Pooling**: ตั้งค่า connection pooling ใน Django
5. **Frontend Optimization**: ใช้ Next.js production build และ caching

## Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
- ตรวจสอบ logs: `docker compose -f docker-compose.prod.yml logs`
- ตรวจสอบ health checks: `docker compose -f docker-compose.prod.yml ps`
- ตรวจสอบ resource usage: `docker stats`

