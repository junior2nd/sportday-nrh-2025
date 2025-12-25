# 🚂 Railway Quick Setup Guide

## ปัญหา: Railpack ไม่สามารถ detect monorepo

**Error:** `Railpack could not determine how to build the app`

**สาเหตุ:** Railway ใช้ Railpack ซึ่งไม่รองรับ monorepo (backend + frontend ใน repo เดียว)

## ✅ วิธีแก้: สร้าง 4 Services แยกกัน

### Service 1: Backend (Django)

**Settings:**
- **Name**: `nrsport-backend`
- **Root Directory**: `nrsport/backend`
- **Build Command**: (ว่าง - ใช้ Dockerfile)
- **Start Command**: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`

**Environment Variables:**
```
DJANGO_SECRET_KEY=<generate-random-key>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=*.railway.app
MYSQL_DB_NAME=${{nrsport-mysql.MYSQLDATABASE}}
MYSQL_DB_USER=${{nrsport-mysql.MYSQLUSER}}
MYSQL_DB_PASSWORD=${{nrsport-mysql.MYSQLPASSWORD}}
MYSQL_DB_HOST=${{nrsport-mysql.MYSQLHOST}}
MYSQL_DB_PORT=${{nrsport-mysql.MYSQLPORT}}
REDIS_URL=${{nrsport-redis.REDIS_URL}}
CORS_ALLOWED_ORIGINS=https://nrsport-frontend-production.up.railway.app
CSRF_TRUSTED_ORIGINS=https://nrsport-frontend-production.up.railway.app
```

### Service 2: Frontend (Next.js)

**Settings:**
- **Name**: `nrsport-frontend`
- **Root Directory**: `nrsport/frontend`
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://nrsport-backend-production.up.railway.app/api
NODE_ENV=production
```

### Service 3: MySQL

- คลิก **+ New** > **Database** > **MySQL**
- ตั้งชื่อ: `nrsport-mysql`
- Railway จะสร้างอัตโนมัติ

### Service 4: Redis

- คลิก **+ New** > **Database** > **Redis**
- ตั้งชื่อ: `nrsport-redis`
- Railway จะสร้างอัตโนมัติ

## 📝 ขั้นตอนละเอียด

### 1. สร้าง Project

1. เข้า https://railway.app
2. คลิก **New Project**
3. เลือก **Deploy from GitHub repo**
4. เลือก repository

### 2. สร้าง Backend Service

1. คลิก **+ New** > **GitHub Repo**
2. เลือก repository เดียวกัน
3. ตั้งค่า:
   - **Name**: `nrsport-backend`
   - **Root Directory**: `nrsport/backend` ⚠️ สำคัญ!
   - **Build Command**: (ว่าง)
   - **Start Command**: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`

4. ไปที่ **Settings** > **Dockerfile Path**: `Dockerfile.prod`

5. เพิ่ม Environment Variables (ดูด้านบน)

### 3. สร้าง Frontend Service

1. คลิก **+ New** > **GitHub Repo**
2. เลือก repository เดียวกัน
3. ตั้งค่า:
   - **Name**: `nrsport-frontend`
   - **Root Directory**: `nrsport/frontend` ⚠️ สำคัญ!
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

4. เพิ่ม Environment Variables (ดูด้านบน)

### 4. สร้าง Database Services

- MySQL: **+ New** > **Database** > **MySQL**
- Redis: **+ New** > **Database** > **Redis**

### 5. Run Migrations

หลังจาก backend deploy สำเร็จ:

```bash
# ใช้ Railway CLI
railway run --service nrsport-backend python manage.py migrate
railway run --service nrsport-backend python manage.py createsuperuser
railway run --service nrsport-backend python manage.py collectstatic --noinput
```

หรือใช้ **Shell** ใน Railway Dashboard

## ⚠️ สิ่งสำคัญ

1. **Root Directory ต้องถูกต้อง** - ไม่งั้นจะหาไฟล์ไม่เจอ
2. **Environment Variables ต้องใช้ Service References** - `${{service-name.VARIABLE}}`
3. **PORT variable** - Railway ใช้ `$PORT` แทน hardcode port
4. **CORS URLs** - ต้องใช้ URL ที่ Railway generate ให้

## 🔄 การอัปเดต

- Push code ไป GitHub → Railway จะ auto-deploy
- หรือคลิก **Redeploy** ในแต่ละ service

## 📚 เอกสารเพิ่มเติม

ดู `RAILWAY_DEPLOY.md` สำหรับรายละเอียดเพิ่มเติม

