# Reservation Timeline - تایم‌لاین رزرو

## 🇮🇷 فارسی

**تایم‌لاین رزرو** یک برنامه مدیریت رزرو است که برای رزرو میز در رستوران‌ها، باشگاه‌های بیلیارد یا هر فضای قابل رزرو در طول روز طراحی شده است.

### 🎯 هدف پروژه

این پروژه با هدف ساده‌سازی فرآیند رزرو و پیگیری زمان‌بندی‌ها توسعه یافته است. کاربران می‌توانند به‌راحتی زمان‌های خالی را مشاهده کرده، رزرو انجام دهند، و تاریخچه رزروهای گذشته را مرور کنند.

### 🛠 ویژگی‌ها

- رزرو بازه‌های زمانی برای میز یا فضا  
- پشتیبانی از انواع مکان‌ها (رستوران، باشگاه، اتاق جلسه و ...)  
- بایگانی خودکار رزروهای انجام‌شده  
- قابلیت جستجو در تاریخچه رزروها  
- رابط کاربری ساده و قابل توسعه  

### 📦 نصب و اجرا

```bash
git clone https://github.com/your-username/reservation-timeline.git  
cd reservation-timeline  
npm install  
npm start  
```

---

## 🇬🇧 English

## Project Overview
**Reservation Timeline** is a table reservation management application designed for restaurants, billiard clubs, or any venue that needs to manage time-based reservations throughout the day. The application features a visual timeline interface that shows available and booked time slots.

## Current State
✅ **Fully functional and deployed on Replit**
- PHP 8.2 backend running on port 5000
- Frontend serving static HTML/CSS/JS with Persian (RTL) interface
- Data storage using JSON files (no database required)
- Working table management, reservation system, and settings

## Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (jQuery 3.6.0)
- **Backend**: PHP 8.2
- **Data Storage**: JSON files (settings.json, table.json, reservations.json)
- **Server**: PHP built-in development server

## Project Architecture

### File Structure
```
.
├── index.html              # Main application UI
├── style.css               # Application styling (RTL Persian)
├── script.js               # Frontend logic and AJAX calls
├── save_settings.php       # Settings management endpoint
├── save_table.php          # Create new table endpoint
├── save_reservation.php    # Create reservation endpoint
├── delete_table.php        # Delete table endpoint
├── settings.json           # App configuration storage
├── table.json              # Tables data storage
└── reservations.json       # Reservations data storage
```

### Key Features
1. **Table Management**: Add and delete tables/spaces
2. **Reservation System**: Book time slots with conflict detection
3. **Visual Timeline**: See free and booked time slots at a glance
4. **Settings**: Configure app name, start time, and end time
5. **Persian Interface**: Full RTL (Right-to-Left) support

### Data Flow
- Frontend (JavaScript/jQuery) → AJAX requests → PHP endpoints → JSON file storage
- No external database needed - uses file-based JSON storage
- Automatic conflict detection prevents double-booking

## Development Setup
The application runs on Replit with:
- Workflow: `php -S 0.0.0.0:5000` (PHP built-in server on port 5000)
- No build step required
- No package manager dependencies

## Recent Changes
- **2025-10-29**: Initial Replit setup
  - Installed PHP 8.2
  - Configured workflow to run on port 5000
  - Verified all features working (table management, reservations, settings)
  - Set up deployment configuration for production

## User Preferences
- None documented yet

## Notes
- The application uses jQuery loaded from CDN (no npm dependencies)
- All text is in Persian (Farsi) with RTL layout
- Time slots are customizable through settings
- Reservations are validated for time conflicts on the backend