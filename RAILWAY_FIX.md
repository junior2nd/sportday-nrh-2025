# 🔧 แก้ปัญหา Railway Build Error

## ปัญหา

```
⚠ Script start.sh not found
✖ Railpack could not determine how to build the app.
```

## ✅ วิธีแก้: สร้าง Services แยกกัน

Railway ไม่สามารถ detect monorepo ได้ ต้องสร้าง **4 services แยกกัน**:

### 📋 Checklist

- [ ] Service 1: Backend (Django) - Root: `nrsport/backend`
- [ ] Service 2: Frontend (Next.js) - Root: `nrsport/frontend`  
- [ ] Service 3: MySQL Database
- [ ] Service 4: Redis Cache

## 🚀 ขั้นตอนการ Setup

### 1. สร้าง Backend Service

1. คลิก **+ New** > **GitHub Repo**
2. เลือก repository ของคุณ
3. ตั้งค่า:
   ```
   Name: nrsport-backend
   Root Directory: nrsport/backend  ⚠️ สำคัญมาก!
   Build Command: (ว่าง - ใช้ Dockerfile)
   Start Command: daphne -b 0.0.0.0 -p $PORT config.asgi:application
   ```
4. ไปที่ **Settings** > **Dockerfile Path**: `Dockerfile.prod`
5. เพิ่ม Environment Variables (ดูด้านล่าง)

### 2. สร้าง Frontend Service

1. คลิก **+ New** > **GitHub Repo**
2. เลือก repository เดียวกัน
3. ตั้งค่า:
   ```
   Name: nrsport-frontend
   Root Directory: nrsport/frontend  ⚠️ สำคัญมาก!
   Build Command: npm ci && npm run build
   Start Command: npm start
   ```
4. เพิ่ม Environment Variables (ดูด้านล่าง)

### 3. สร้าง MySQL

- คลิก **+ New** > **Database** > **MySQL**
- ตั้งชื่อ: `nrsport-mysql`

### 4. สร้าง Redis

- คลิก **+ New** > **Database** > **Redis`
- ตั้งชื่อ: `nrsport-redis`

## 🔑 Environment Variables

### Backend Service

```bash
# Django
DJANGO_SECRET_KEY=<generate-random-secret-key>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=*.railway.app

# Database (ใช้ Service Reference)
MYSQL_DB_NAME=${{nrsport-mysql.MYSQLDATABASE}}
MYSQL_DB_USER=${{nrsport-mysql.MYSQLUSER}}
MYSQL_DB_PASSWORD=${{nrsport-mysql.MYSQLPASSWORD}}
MYSQL_DB_HOST=${{nrsport-mysql.MYSQLHOST}}
MYSQL_DB_PORT=${{nrsport-mysql.MYSQLPORT}}

# Redis (ใช้ Service Reference)
REDIS_URL=${{nrsport-redis.REDIS_URL}}

# CORS (ใช้ URL ที่ Railway generate)
CORS_ALLOWED_ORIGINS=https://nrsport-frontend-production.up.railway.app
CSRF_TRUSTED_ORIGINS=https://nrsport-frontend-production.up.railway.app
```

### Frontend Service

```bash
NEXT_PUBLIC_API_URL=https://nrsport-backend-production.up.railway.app/api
NODE_ENV=production
```

**หมายเหตุ:** แทนที่ URL ด้วย URL จริงที่ Railway generate ให้ (ดูใน Settings > Networking)

## 🗄️ Run Migrations

หลังจาก backend deploy สำเร็จ:

1. ไปที่ Backend Service
2. คลิก **Deployments** > เลือก deployment ล่าสุด
3. เปิด **Shell** หรือใช้ Railway CLI:

```bash
railway run --service nrsport-backend python manage.py migrate
railway run --service nrsport-backend python manage.py createsuperuser
railway run --service nrsport-backend python manage.py collectstatic --noinput
```

## ⚠️ สิ่งสำคัญ

1. **Root Directory ต้องถูกต้อง** - ไม่งั้นจะหาไฟล์ไม่เจอ
2. **Service References** - ใช้ `${{service-name.VARIABLE}}` format
3. **PORT Variable** - Railway ใช้ `$PORT` (ไม่ต้อง hardcode)
4. **CORS URLs** - ต้องใช้ URL ที่ Railway generate ให้

## 📚 เอกสารเพิ่มเติม

- `RAILWAY_DEPLOY.md` - คู่มือละเอียด
- `RAILWAY_QUICK_SETUP.md` - คู่มือย่อ

