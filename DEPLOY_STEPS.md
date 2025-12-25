# DigitalOcean Deployment - Step by Step Guide

คู่มือการ deploy ระบบ NRSport บน DigitalOcean แบบทีละขั้นตอน

## ขั้นตอนที่ 1: เตรียมตัวบน Local Machine

### 1.1 ตรวจสอบไฟล์ที่จำเป็น

```bash
cd nrsport
ls -la
```

ต้องมีไฟล์เหล่านี้:
- `docker-compose.prod.yml` ✅
- `.env.example` ✅
- `backend/Dockerfile.prod` ✅
- `frontend/Dockerfile.prod` ✅

### 1.2 เตรียมไฟล์ .env สำหรับ Production

```bash
# คัดลอก .env.example เป็น .env (ถ้ายังไม่มี)
cp .env.example .env.production

# แก้ไขไฟล์ .env.production
nano .env.production
```

**ค่าที่ต้องตั้ง:**
```env
# Django Settings
DJANGO_SECRET_KEY=<generate-new-secret-key>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com,your-droplet-ip

# Database
MYSQL_ROOT_PASSWORD=<strong-password>
MYSQL_DB_NAME=nrsport_db
MYSQL_DB_USER=nrsportuser
MYSQL_DB_PASSWORD=<strong-password>
MYSQL_DB_HOST=mysql
MYSQL_DB_PORT=3306

# Redis
REDIS_URL=redis://redis:6379/1
REDIS_PASSWORD=<optional-strong-password>

# CORS & CSRF
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://your-droplet-ip:3000
CSRF_TRUSTED_ORIGINS=https://your-domain.com,http://your-droplet-ip:3000

# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com/api
# หรือ http://your-droplet-ip:8000/api ถ้าไม่มี domain

NODE_ENV=production
```

**Generate Django Secret Key:**
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## ขั้นตอนที่ 2: สร้าง DigitalOcean Droplet

### 2.1 เข้าสู่ DigitalOcean Dashboard

1. ไปที่ https://cloud.digitalocean.com
2. Login เข้าสู่ระบบ

### 2.2 สร้าง Droplet ใหม่

1. คลิก **"Create"** → **"Droplets"**
2. เลือกการตั้งค่า:
   - **Image**: Ubuntu 22.04 (LTS) x64
   - **Plan**: 
     - **Basic**: 2GB RAM / 1 vCPU (ขั้นต่ำ)
     - **Basic**: 4GB RAM / 2 vCPU (แนะนำสำหรับ production)
   - **Datacenter region**: เลือกตามที่ใกล้ที่สุด (เช่น Singapore)
   - **Authentication**: 
     - SSH keys (แนะนำ - ปลอดภัยกว่า)
     - หรือ Password (ต้องตั้งรหัสผ่านที่แข็งแรง)
3. คลิก **"Create Droplet"**
4. รอให้ Droplet สร้างเสร็จ (ประมาณ 1-2 นาที)

### 2.3 ตั้งค่า Firewall

1. ไปที่ **"Networking"** → **"Firewalls"**
2. คลิก **"Create Firewall"**
3. ตั้งชื่อ: `nrsport-firewall`
4. **Inbound Rules**:
   - SSH (22) - Allow
   - HTTP (80) - Allow
   - HTTPS (443) - Allow
   - Custom (3000) - Allow (สำหรับ Frontend)
   - Custom (8000) - Allow (สำหรับ Backend API)
5. **Outbound Rules**: Allow All
6. คลิก **"Create Firewall"**
7. Attach firewall ไปยัง Droplet ที่สร้าง

---

## ขั้นตอนที่ 3: เชื่อมต่อกับ Droplet

### 3.1 SSH เข้าสู่ Droplet

```bash
# ถ้าใช้ SSH Key
ssh root@your_droplet_ip

# ถ้าใช้ Password
ssh root@your_droplet_ip
# แล้วใส่ password ที่ตั้งไว้
```

**หมายเหตุ:** IP address จะแสดงใน DigitalOcean Dashboard หลังจากสร้าง Droplet

---

## ขั้นตอนที่ 4: ติดตั้ง Docker บน Droplet

### 4.1 Update System

```bash
apt update && apt upgrade -y
```

### 4.2 ติดตั้ง Docker

```bash
# ติดตั้ง Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# ตรวจสอบการติดตั้ง
docker --version
```

### 4.3 ติดตั้ง Docker Compose

```bash
# ติดตั้ง Docker Compose Plugin
apt install docker-compose-plugin -y

# ตรวจสอบการติดตั้ง
docker compose version
```

---

## ขั้นตอนที่ 5: Clone Repository

### 5.1 ติดตั้ง Git

```bash
apt install git -y
```

### 5.2 Clone Repository

```bash
# สร้างโฟลเดอร์สำหรับ application
mkdir -p /opt
cd /opt

# Clone repository (แทนที่ URL ด้วย repository ของคุณ)
git clone <your-repository-url> nrsport
cd nrsport
```

**หรือถ้าใช้ GitHub:**
```bash
git clone https://github.com/your-username/your-repo.git nrsport
cd nrsport
```

---

## ขั้นตอนที่ 6: ตั้งค่า Environment Variables

### 6.1 สร้างไฟล์ .env

```bash
cd /opt/nrsport

# คัดลอก .env.example
cp .env.example .env

# แก้ไขไฟล์ .env
nano .env
```

### 6.2 ตั้งค่าค่าใน .env

ใช้ค่าที่เตรียมไว้ในขั้นตอนที่ 1.2

**สำคัญ:** 
- เปลี่ยน `DJANGO_SECRET_KEY` เป็นค่าใหม่
- ตั้ง `DJANGO_DEBUG=False`
- ตั้ง `DJANGO_ALLOWED_HOSTS` ให้ถูกต้อง
- ตั้งรหัสผ่านที่แข็งแรงสำหรับ Database และ Redis

### 6.3 บันทึกและออกจาก Editor

- กด `Ctrl + X`
- กด `Y` เพื่อยืนยัน
- กด `Enter` เพื่อบันทึก

---

## ขั้นตอนที่ 7: Deploy Application

### 7.1 ใช้ Deployment Script (แนะนำ)

```bash
cd /opt/nrsport

# ให้สิทธิ์ execute
chmod +x deploy-digitalocean.sh

# รัน deployment script
./deploy-digitalocean.sh
```

### 7.2 หรือ Deploy แบบ Manual

```bash
cd /opt/nrsport

# Build images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# ตรวจสอบสถานะ
docker compose -f docker-compose.prod.yml ps

# ดู logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## ขั้นตอนที่ 8: ตั้งค่า Database

### 8.1 รอให้ Database พร้อม

```bash
# ตรวจสอบว่า MySQL container ทำงานแล้ว
docker compose -f docker-compose.prod.yml ps mysql

# ดู logs
docker compose -f docker-compose.prod.yml logs mysql
```

### 8.2 Run Migrations

```bash
# รอประมาณ 30 วินาทีให้ database พร้อม
sleep 30

# Run migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### 8.3 สร้าง Superuser

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

ใส่ข้อมูล:
- Username
- Email (optional)
- Password

---

## ขั้นตอนที่ 9: ตรวจสอบการ Deploy

### 9.1 ตรวจสอบ Services

```bash
# ดูสถานะ services
docker compose -f docker-compose.prod.yml ps

# ทุก service ควรแสดง "Up" และ "healthy"
```

### 9.2 ทดสอบ Backend API

```bash
# จาก server
curl http://localhost:8000/api/health/

# หรือจาก browser
http://your-droplet-ip:8000/api/health/
```

### 9.3 ทดสอบ Frontend

```bash
# จาก browser
http://your-droplet-ip:3000
```

---

## ขั้นตอนที่ 10: ตั้งค่า Nginx Reverse Proxy (แนะนำ)

### 10.1 ติดตั้ง Nginx

```bash
apt install nginx -y
```

### 10.2 สร้าง Nginx Configuration

```bash
nano /etc/nginx/sites-available/nrsport
```

**เพิ่ม configuration:**

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

    # WebSocket support
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

**หรือถ้าไม่มี domain ใช้ IP:**

```nginx
# Frontend
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 8000;
    server_name _;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 10.3 Enable Site

```bash
# Enable site
ln -s /etc/nginx/sites-available/nrsport /etc/nginx/sites-enabled/

# ลบ default site
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

---

## ขั้นตอนที่ 11: ตั้งค่า SSL Certificate (Let's Encrypt)

### 11.1 ติดตั้ง Certbot

```bash
apt install certbot python3-certbot-nginx -y
```

### 11.2 ขอ SSL Certificate

```bash
# ถ้ามี domain
certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# ทำตามคำแนะนำ:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (แนะนำ: Yes)
```

### 11.3 Auto-renewal

Auto-renewal ถูกตั้งค่าอัตโนมัติแล้ว ทดสอบด้วย:

```bash
certbot renew --dry-run
```

---

## ขั้นตอนที่ 12: ตั้งค่า Firewall (UFW)

### 12.1 ตั้งค่า UFW

```bash
# Install UFW
apt install ufw -y

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# ตรวจสอบสถานะ
ufw status
```

---

## ขั้นตอนที่ 13: ตั้งค่า Backup

### 13.1 สร้าง Backup Script

```bash
nano /opt/nrsport/backup.sh
```

**เพิ่มเนื้อหา:**

```bash
#!/bin/bash
BACKUP_DIR="/opt/nrsport/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

cd /opt/nrsport

# Backup database
docker compose -f docker-compose.prod.yml exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DB_NAME} > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# ลบ backup เก่ากว่า 7 วัน
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### 13.2 ให้สิทธิ์ Execute

```bash
chmod +x /opt/nrsport/backup.sh
```

### 13.3 ตั้งค่า Crontab

```bash
crontab -e
```

**เพิ่มบรรทัดนี้ (backup ทุกวันเวลา 2:00 AM):**

```
0 2 * * * /opt/nrsport/backup.sh
```

---

## คำสั่งที่มีประโยชน์

### ดู Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Update Application

```bash
cd /opt/nrsport
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Stop Services

```bash
docker compose -f docker-compose.prod.yml down
```

### Start Services

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check MySQL logs
docker compose -f docker-compose.prod.yml logs mysql

# Test connection
docker compose -f docker-compose.prod.yml exec backend python manage.py dbshell
```

### Port Already in Use

```bash
# Check what's using the port
netstat -tulpn | grep :8000
netstat -tulpn | grep :3000
```

### Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs <service-name>

# Check status
docker compose -f docker-compose.prod.yml ps
```

---

## Security Checklist

- [ ] เปลี่ยน default passwords ทั้งหมด
- [ ] ตั้งค่า `DJANGO_DEBUG=False`
- [ ] ตั้งค่า `DJANGO_ALLOWED_HOSTS` ให้ถูกต้อง
- [ ] ใช้ HTTPS (SSL certificate)
- [ ] ตั้งค่า firewall (UFW)
- [ ] ใช้ SSH keys แทน password
- [ ] ตั้งค่า Redis password
- [ ] ตั้งค่า database backup อัตโนมัติ
- [ ] ตรวจสอบ logs เป็นประจำ
- [ ] อัปเดตระบบเป็นประจำ

---

## Support

หากพบปัญหา:
1. ตรวจสอบ logs: `docker compose -f docker-compose.prod.yml logs`
2. ตรวจสอบ service status: `docker compose -f docker-compose.prod.yml ps`
3. ตรวจสอบ resource usage: `docker stats`

