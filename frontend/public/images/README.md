# Images Folder

เก็บรูปภาพสำหรับใช้ใน frontend ที่นี่

## การใช้งาน

### Background Image สำหรับ Login
- วางไฟล์รูปภาพชื่อ `login-bg.jpg` หรือ `login-bg.png` ในโฟลเดอร์นี้
- รองรับไฟล์: `.jpg`, `.jpeg`, `.png`, `.webp`
- ขนาดแนะนำ: 1920x1080 หรือใหญ่กว่า

### การอ้างอิงรูปภาพ
- ในโค้ด: `/images/filename.jpg`
- Next.js จะ serve ไฟล์จาก `/public` folder อัตโนมัติ

### ตัวอย่าง
```
public/
  images/
    login-bg.jpg      # Background สำหรับหน้า login
    logo.png          # Logo
    favicon.ico       # Favicon
```

