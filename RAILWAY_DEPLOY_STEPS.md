# Railway Deployment - Step by Step Guide

คู่มือการ deploy ระบบ NRSport บน Railway แบบทีละขั้นตอน

## ❓ คำถามที่พบบ่อย: ต้องแยก Repository ไหม?

**คำตอบ: ไม่จำเป็น!** 

Railway รองรับ **Monorepo** (backend + frontend ใน repo เดียวกัน) ได้โดยใช้ **Root Directory** เพื่อแยก service

### วิธีทำงาน:
- **Backend Service**: ตั้ง Root Directory = `nrsport/backend`
- **Frontend Service**: ตั้ง Root Directory = `nrsport/frontend`
- Railway จะ build และ deploy แยกกันอัตโนมัติ

---

## ขั้นตอนที่ 1: เตรียม GitHub Repository

### 1.1 ตรวจสอบว่า Repository ถูก Push ไป GitHub แล้วหรือยัง

```bash
# ตรวจสอบ git remote
git remote -v

# ถ้ายังไม่มี remote
git remote add origin https://github.com/your-username/your-repo.git
```

### 1.2 Push Code ไป GitHub

```bash
# ตรวจสอบสถานะ
git status

# Add ไฟล์ทั้งหมด
git add .

# Commit
git commit -m "Prepare for Railway deployment"

# Push ไป GitHub
git push origin main
# หรือ git push origin master (ถ้าใช้ branch master)
```

**สำคัญ:** ต้อง push code ไป GitHub ก่อน เพราะ Railway จะ deploy จาก GitHub repository

---

## ขั้นตอนที่ 2: สร้าง Railway Project

### 2.1 เข้าสู่ Railway

1. ไปที่ https://railway.app
2. Login ด้วย GitHub account
3. คลิก **"New Project"**

### 2.2 Connect GitHub Repository

1. เลือก **"Deploy from GitHub repo"**
2. เลือก repository ของคุณ
3. Railway จะสร้าง project อัตโนมัติ

---

## ขั้นตอนที่ 3: สร้าง MySQL Database

1. ใน Railway Project คลิก **"+ New"**
2. เลือก **"Database"** → **"MySQL"**
3. ตั้งชื่อ: `nrsport-mysql`
4. Railway จะสร้าง database และให้ connection variables อัตโนมัติ

**หมายเหตุ:** เก็บชื่อ service ไว้ เพราะจะใช้ใน Environment Variables

---

## ขั้นตอนที่ 4: สร้าง Redis Database

1. คลิก **"+ New"** อีกครั้ง
2. เลือก **"Database"** → **"Redis"**
3. ตั้งชื่อ: `nrsport-redis`
4. Railway จะสร้าง Redis instance อัตโนมัติ

---

## ขั้นตอนที่ 5: สร้าง Backend Service

### 5.1 สร้าง Service

1. คลิก **"+ New"** → **"GitHub Repo"**
2. เลือก **repository เดียวกัน** (ไม่ต้องแยก repo!)
3. Railway จะสร้าง service ใหม่

### 5.2 ตั้งค่า Service

ไปที่ **Settings** → **Source**:

- **Name**: `nrsport-backend`
- **Root Directory**: `nrsport/backend` ⚠️ **สำคัญมาก!**
- **Build Command**: (ว่างไว้ - ใช้ Dockerfile)
- **Start Command**: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`

### 5.3 ตั้งค่า Dockerfile

ไปที่ **Settings** → **Docker**:

- **Dockerfile Path**: `Dockerfile.prod`

### 5.4 เพิ่ม Environment Variables

ไปที่ **Variables** tab และเพิ่ม:

```bash
# Django Settings
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

# CORS (จะอัปเดตหลังจากได้ frontend URL)
CORS_ALLOWED_ORIGINS=https://nrsport-frontend-production.up.railway.app
CSRF_TRUSTED_ORIGINS=https://nrsport-frontend-production.up.railway.app
```

**Generate Django Secret Key:**
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**หมายเหตุ:** 
- ใช้ `${{service-name.VARIABLE}}` format สำหรับ service references
- CORS URLs จะอัปเดตหลังจากได้ frontend URL จริง

---

## ขั้นตอนที่ 6: สร้าง Frontend Service

### 6.1 สร้าง Service

1. คลิก **"+ New"** → **"GitHub Repo"**
2. เลือก **repository เดียวกัน** (repo เดียวกับ backend!)
3. Railway จะสร้าง service ใหม่

### 6.2 ตั้งค่า Service

ไปที่ **Settings** → **Source**:

- **Name**: `nrsport-frontend`
- **Root Directory**: `nrsport/frontend` ⚠️ **สำคัญมาก!**
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`

### 6.3 เพิ่ม Environment Variables

ไปที่ **Variables** tab และเพิ่ม:

```bash
NEXT_PUBLIC_API_URL=https://nrsport-backend-production.up.railway.app/api
NODE_ENV=production
```

**หมายเหตุ:** URL จะอัปเดตหลังจากได้ backend URL จริง

---

## ขั้นตอนที่ 7: รอให้ Services Deploy

### 7.1 ตรวจสอบ Deployments

1. ไปที่แต่ละ service → **Deployments** tab
2. รอให้ build และ deploy เสร็จ (ประมาณ 5-10 นาที)
3. ตรวจสอบ **Logs** ว่ามี error หรือไม่

### 7.2 ตรวจสอบ Logs

- คลิก **Deployments** → เลือก deployment ล่าสุด → **View Logs**
- ตรวจสอบว่ามี error หรือไม่

---

## ขั้นตอนที่ 8: อัปเดต Environment Variables

หลังจาก deploy เสร็จ Railway จะให้ URL สำหรับแต่ละ service:

### 8.1 ดู URLs

1. ไปที่ **Frontend Service** → **Settings** → **Networking**
2. คัดลอก URL (เช่น: `https://nrsport-frontend-production.up.railway.app`)
3. ไปที่ **Backend Service** → **Settings** → **Networking**
4. คัดลอก URL (เช่น: `https://nrsport-backend-production.up.railway.app`)

### 8.2 อัปเดต Backend Variables

ไปที่ **Backend Service** → **Variables**:

- อัปเดต `CORS_ALLOWED_ORIGINS` = `https://nrsport-frontend-production.up.railway.app`
- อัปเดต `CSRF_TRUSTED_ORIGINS` = `https://nrsport-frontend-production.up.railway.app`

### 8.3 อัปเดต Frontend Variables

ไปที่ **Frontend Service** → **Variables**:

- อัปเดต `NEXT_PUBLIC_API_URL` = `https://nrsport-backend-production.up.railway.app/api`

### 8.4 Redeploy Services

หลังจากอัปเดต variables:

1. ไปที่ **Backend Service** → **Deployments** → **Redeploy**
2. ไปที่ **Frontend Service** → **Deployments** → **Redeploy**

---

## ขั้นตอนที่ 9: Run Database Migrations

### 9.1 ใช้ Railway CLI (แนะนำ)

```bash
# ติดตั้ง Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run --service nrsport-backend python manage.py migrate

# สร้าง superuser
railway run --service nrsport-backend python manage.py createsuperuser

# Collect static files
railway run --service nrsport-backend python manage.py collectstatic --noinput
```

### 9.2 หรือใช้ Shell ใน Railway Dashboard

1. ไปที่ **Backend Service** → **Deployments** → เลือก deployment ล่าสุด
2. คลิก **"Shell"**
3. รันคำสั่ง:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

---

## ขั้นตอนที่ 10: ตรวจสอบการ Deploy

### 10.1 ทดสอบ Backend API

```bash
# ใช้ curl
curl https://nrsport-backend-production.up.railway.app/api/health/

# หรือเปิดใน browser
https://nrsport-backend-production.up.railway.app/api/health/
```

ควรได้ response 200 OK

### 10.2 ทดสอบ Frontend

เปิดใน browser:
```
https://nrsport-frontend-production.up.railway.app
```

ควรเห็นหน้าเว็บทำงานปกติ

### 10.3 ทดสอบ Login

1. ไปที่หน้า login
2. ใช้ superuser ที่สร้างไว้
3. ตรวจสอบว่าสามารถ login ได้

---

## ขั้นตอนที่ 11: ตั้งค่า Custom Domain (Optional)

### 11.1 ตั้งค่า Frontend Domain

1. ไปที่ **Frontend Service** → **Settings** → **Networking**
2. คลิก **"Generate Domain"** หรือ **"Add Custom Domain"**
3. ถ้าใช้ custom domain:
   - เพิ่ม DNS records ตามที่ Railway แนะนำ
   - รอให้ DNS propagate (ประมาณ 5-10 นาที)

### 11.2 ตั้งค่า Backend Domain

1. ไปที่ **Backend Service** → **Settings** → **Networking**
2. คลิก **"Generate Domain"** หรือ **"Add Custom Domain"**

### 11.3 อัปเดต Environment Variables

หลังจากตั้งค่า custom domain:

1. อัปเดต `CORS_ALLOWED_ORIGINS` และ `CSRF_TRUSTED_ORIGINS` ใน backend
2. อัปเดต `NEXT_PUBLIC_API_URL` ใน frontend
3. Redeploy ทั้ง 2 services

---

## การอัปเดต Application

### Auto-Deploy

เมื่อ push code ใหม่ไป GitHub:
- Railway จะ auto-deploy ทุก service อัตโนมัติ
- ตรวจสอบ Deployments tab เพื่อดูสถานะ

### Manual Redeploy

1. ไปที่ Service → **Deployments**
2. คลิก **"Redeploy"** บน deployment ที่ต้องการ

### หลังจาก Update Code

```bash
# บน local machine
git add .
git commit -m "Update application"
git push origin main

# Railway จะ auto-deploy อัตโนมัติ
# ถ้ามี migrations ใหม่:
railway run --service nrsport-backend python manage.py migrate
```

---

## คำสั่งที่มีประโยชน์

### Railway CLI

```bash
# View logs
railway logs --service nrsport-backend
railway logs --service nrsport-frontend

# Run command
railway run --service nrsport-backend python manage.py migrate
railway run --service nrsport-backend python manage.py shell

# View service info
railway status
```

### ตรวจสอบ Logs

- ไปที่ Service → **Deployments** → เลือก deployment → **View Logs**
- หรือใช้ Railway CLI: `railway logs --service service-name`

---

## Troubleshooting

### Backend ไม่สามารถเชื่อมต่อ Database

**ปัญหา:** `django.db.utils.OperationalError`

**วิธีแก้:**
1. ตรวจสอบว่า MySQL service ทำงานอยู่
2. ตรวจสอบ Environment Variables ว่าใช้ service reference ถูกต้อง:
   - ใช้ format: `${{nrsport-mysql.MYSQLDATABASE}}`
   - ตรวจสอบชื่อ service ว่าตรงกันหรือไม่
3. ตรวจสอบว่า service references ถูกต้องใน Variables tab

### Frontend ไม่สามารถเรียก API

**ปัญหา:** CORS error หรือ 404

**วิธีแก้:**
1. ตรวจสอบ `NEXT_PUBLIC_API_URL` ว่าเป็น URL ของ backend service
2. ตรวจสอบ CORS settings ใน backend:
   - `CORS_ALLOWED_ORIGINS` ต้องมี frontend URL
   - `CSRF_TRUSTED_ORIGINS` ต้องมี frontend URL
3. Redeploy backend หลังจากอัปเดต CORS settings

### Build ล้มเหลว

**ปัญหา:** Build error ใน logs

**วิธีแก้:**
1. ตรวจสอบ logs ใน Railway dashboard
2. ตรวจสอบว่า Root Directory ถูกต้อง:
   - Backend: `nrsport/backend`
   - Frontend: `nrsport/frontend`
3. ตรวจสอบว่า Build Command ถูกต้อง
4. ตรวจสอบว่า Dockerfile มีอยู่และถูกต้อง

### Port Already in Use

**ปัญหา:** Port conflict

**วิธีแก้:**
- Railway ใช้ `$PORT` environment variable อัตโนมัติ
- ตรวจสอบว่า start command ใช้ `$PORT` ไม่ใช่ hardcode port

### Static Files ไม่โหลด

**ปัญหา:** 404 สำหรับ static files

**วิธีแก้:**
```bash
railway run --service nrsport-backend python manage.py collectstatic --noinput
```

---

## Security Checklist

- [ ] เปลี่ยน `DJANGO_SECRET_KEY` เป็นค่าใหม่
- [ ] ตั้งค่า `DJANGO_DEBUG=False`
- [ ] ตั้งค่า `DJANGO_ALLOWED_HOSTS` ให้ถูกต้อง
- [ ] ใช้ HTTPS (Railway ให้อัตโนมัติ)
- [ ] ตั้งค่ารหัสผ่านที่แข็งแรงสำหรับ database
- [ ] ตรวจสอบ logs เป็นประจำ
- [ ] ตั้งค่า custom domain (ถ้าต้องการ)

---

## สรุป

### ไม่ต้องแยก Repository!

✅ **ใช้ repository เดียวกัน**
- Backend: Root Directory = `nrsport/backend`
- Frontend: Root Directory = `nrsport/frontend`

✅ **Railway จะ build และ deploy แยกกันอัตโนมัติ**

✅ **ง่ายต่อการจัดการและอัปเดต**

---

## Support

หากพบปัญหา:
1. ตรวจสอบ logs: `railway logs --service service-name`
2. ตรวจสอบ service status ใน Railway dashboard
3. ตรวจสอบ Environment Variables ว่าถูกต้อง
4. ดู Railway documentation: https://docs.railway.app

