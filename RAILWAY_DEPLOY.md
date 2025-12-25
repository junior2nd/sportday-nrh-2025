# คู่มือการ Deploy ไป Railway

## ปัญหาที่เจอ

Railway ใช้ Railpack ซึ่งไม่สามารถ detect monorepo (backend + frontend) ได้อัตโนมัติ

## วิธีแก้ไข: แยกเป็น 2 Services

วิธีที่ดีที่สุดคือสร้าง **2 services แยกกัน** บน Railway:

### Service 1: Backend (Django)

1. สร้าง Service ใหม่ชื่อ `nrsport-backend`
2. Connect GitHub repository
3. ตั้งค่า Root Directory: `nrsport/backend`
4. ตั้งค่า Build Command: (ว่างไว้ หรือใช้ Dockerfile)
5. ตั้งค่า Start Command: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`

**Environment Variables:**
```
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-backend.railway.app
MYSQL_DB_NAME=nrsport_db
MYSQL_DB_USER=root
MYSQL_DB_PASSWORD=from-mysql-service
MYSQL_DB_HOST=mysql.railway.internal
MYSQL_DB_PORT=3306
REDIS_URL=redis://redis.railway.internal:6379/1
CORS_ALLOWED_ORIGINS=https://your-frontend.railway.app
```

### Service 2: Frontend (Next.js)

1. สร้าง Service ใหม่ชื่อ `nrsport-frontend`
2. Connect GitHub repository (same repo)
3. ตั้งค่า Root Directory: `nrsport/frontend`
4. ตั้งค่า Build Command: `npm ci && npm run build`
5. ตั้งค่า Start Command: `npm start`

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NODE_ENV=production
```

### Service 3: MySQL (Database)

1. สร้าง MySQL Service จาก Railway Template
2. ตั้งชื่อ: `nrsport-mysql`
3. Railway จะสร้าง database อัตโนมัติ

### Service 4: Redis (Cache & WebSocket)

1. สร้าง Redis Service จาก Railway Template
2. ตั้งชื่อ: `nrsport-redis`
3. Railway จะสร้าง Redis อัตโนมัติ

## ขั้นตอนการ Setup

### 1. สร้าง Project บน Railway

1. เข้า https://railway.app
2. คลิก **New Project**
3. เลือก **Deploy from GitHub repo**
4. เลือก repository ของคุณ

### 2. สร้าง Backend Service

1. คลิก **+ New** > **GitHub Repo**
2. เลือก repository เดียวกัน
3. ตั้งค่า:
   - **Name**: `nrsport-backend`
   - **Root Directory**: `nrsport/backend`
   - **Build Command**: (ว่างไว้ - ใช้ Dockerfile)
   - **Start Command**: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`

4. ไปที่ **Settings** > **Dockerfile Path**: `Dockerfile.prod`

5. เพิ่ม Environment Variables (ดูด้านบน)

### 3. สร้าง Frontend Service

1. คลิก **+ New** > **GitHub Repo**
2. เลือก repository เดียวกัน
3. ตั้งค่า:
   - **Name**: `nrsport-frontend`
   - **Root Directory**: `nrsport/frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

4. เพิ่ม Environment Variables (ดูด้านบน)

### 4. สร้าง MySQL Service

1. คลิก **+ New** > **Database** > **MySQL**
2. ตั้งชื่อ: `nrsport-mysql`
3. Railway จะสร้าง database และให้ connection string อัตโนมัติ

### 5. สร้าง Redis Service

1. คลิก **+ New** > **Database** > **Redis**
2. ตั้งชื่อ: `nrsport-redis`
3. Railway จะสร้าง Redis instance อัตโนมัติ

### 6. Setup Environment Variables

#### Backend Service Variables:

```bash
# Django
DJANGO_SECRET_KEY=<generate-secret-key>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=*.railway.app,your-custom-domain.com

# Database (จาก MySQL service)
MYSQL_DB_NAME=${{nrsport-mysql.MYSQLDATABASE}}
MYSQL_DB_USER=${{nrsport-mysql.MYSQLUSER}}
MYSQL_DB_PASSWORD=${{nrsport-mysql.MYSQLPASSWORD}}
MYSQL_DB_HOST=${{nrsport-mysql.MYSQLHOST}}
MYSQL_DB_PORT=${{nrsport-mysql.MYSQLPORT}}

# Redis (จาก Redis service)
REDIS_URL=${{nrsport-redis.REDIS_URL}}

# CORS
CORS_ALLOWED_ORIGINS=https://nrsport-frontend-production.up.railway.app
CSRF_TRUSTED_ORIGINS=https://nrsport-frontend-production.up.railway.app
```

#### Frontend Service Variables:

```bash
NEXT_PUBLIC_API_URL=https://nrsport-backend-production.up.railway.app/api
NODE_ENV=production
```

### 7. Run Migrations

หลังจาก backend service เริ่มทำงาน:

1. ไปที่ Backend Service
2. คลิก **Deployments** > เลือก deployment ล่าสุด
3. คลิก **View Logs**
4. เปิด **Shell** หรือใช้ Railway CLI:

```bash
railway run --service nrsport-backend python manage.py migrate
railway run --service nrsport-backend python manage.py createsuperuser
railway run --service nrsport-backend python manage.py collectstatic --noinput
```

### 8. ตั้งค่า Custom Domain (Optional)

1. ไปที่ Frontend Service > **Settings** > **Networking**
2. คลิก **Generate Domain** หรือเพิ่ม Custom Domain
3. ทำแบบเดียวกันกับ Backend Service

## การอัปเดต

เมื่อ push code ใหม่ไป GitHub:
- Railway จะ auto-deploy ทุก service อัตโนมัติ
- หรือคลิก **Redeploy** ในแต่ละ service

## Troubleshooting

### Backend ไม่สามารถเชื่อมต่อ Database

- ตรวจสอบว่า MySQL service ทำงานอยู่
- ตรวจสอบ Environment Variables ว่าใช้ service reference ถูกต้อง
- ใช้ `${{service-name.VARIABLE}}` format

### Frontend ไม่สามารถเรียก API

- ตรวจสอบ `NEXT_PUBLIC_API_URL` ว่าเป็น URL ของ backend service
- ตรวจสอบ CORS settings ใน backend

### Build ล้มเหลว

- ตรวจสอบ logs ใน Railway dashboard
- ตรวจสอบว่า Root Directory ถูกต้อง
- ตรวจสอบว่า Build Command ถูกต้อง

## ใช้ Railway CLI (Optional)

```bash
# ติดตั้ง Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up

# View logs
railway logs

# Run command
railway run python manage.py migrate
```

