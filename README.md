# NRSport - Event Platform System

ระบบกลางสำหรับจัดกิจกรรมหน่วยงาน (Multi-Organization Event Platform)

## Quick Start

### 1. ตั้งค่า Environment Variables
```bash
# คัดลอกไฟล์ template
cp .env.example .env

# แก้ไขค่าตามต้องการ (หรือใช้ค่าที่มีอยู่แล้วสำหรับทดสอบ)
# nano .env
```

### 2. เริ่มระบบ
```bash
make up
```

### 3. สร้าง Admin User
```bash
make createsuperuser
```

### 4. เปิดใช้งาน
- **Frontend:** http://localhost:3000
- **Backend Admin:** http://localhost:8000/admin
- **API:** http://localhost:8000/api

## Environment Variables

ไฟล์ `.env` อยู่ที่ root ของโปรเจค (`nrsport/.env`) และใช้ร่วมกันทั้ง Frontend และ Backend

ดูรายละเอียดใน `.env.example`

## Tech Stack

### Backend
- Django 5.2.7
- Django REST Framework
- Django Channels (WebSocket)
- MySQL 8.0
- Redis 7
- JWT Authentication

### Frontend
- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4

## Features

### Core Module
- Multi-tenant architecture (org_id based)
- Authentication & Authorization (4 roles)
- Organization & Department management
- Event management
- Import system (xlsx/csv)
- Audit logging
- Module registry (global + org level)

### Module A: Color Team Management
- Import participants from xlsx/csv
- Team assignment (Random, Balanced, Rule-based)
- Team management (drag-drop, pin, move)
- Export team lists

### Module B: Raffle System
- Create raffle events with multiple rounds
- Configurable rules (no duplicate, no department duplicate)
- Realtime display (WebSocket)
- Audit trail with seed values
- Export reports

### Module C: Sports Day System
- Template-driven sport types
- Tournament generation (round robin, elimination)
- Multiple scoring systems (numeric, set-based, time-based)
- Realtime score updates (WebSocket)
- Live scoreboard

## Commands

### Development

```bash
make up              # Start system
make down            # Stop system
make restart         # Restart system
make logs            # View logs
make shell           # Open backend shell
make migrate         # Run migrations
make makemigrations  # Create migrations
make createsuperuser # Create admin user
```

### Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

## Project Structure

```
nrsport/
├── backend/         # Django backend
│   ├── core/       # Core module
│   ├── accounts/   # Authentication
│   ├── teams/      # Module A
│   ├── raffle/     # Module B
│   ├── sports/      # Module C
│   └── dashboard/  # Dashboard API
├── frontend/       # Next.js frontend
├── docker-compose.yml          # Development configuration
├── docker-compose.prod.yml     # Production configuration
└── DEPLOYMENT.md               # Production deployment guide
```

## Deployment

สำหรับการ deploy บน production server (VPS/Cloud) ดูรายละเอียดใน [DEPLOYMENT.md](DEPLOYMENT.md)

### Quick Production Setup

```bash
# 1. Clone repository
git clone https://github.com/junior2nd/sportday-nrh-2025.git
cd sportday-nrh-2025

# 2. Setup environment
cp .env.example .env
nano .env  # แก้ไขค่าตาม production

# 3. Build and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. Setup database
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## License

MIT

