# 🏥 SHEFA — Secure Telemedicine Platform

> **شفاء** (Arabic: *Healing & Recovery*)

A trust-first, privacy-focused telemedicine platform built with Next.js 14, featuring appointment-based access control, in-app video consultations, digital prescriptions, and role-based dashboards.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/your-repo/shefa.git
cd shefa

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI, NextAuth secret, etc.

# Seed the database (optional, adds test data)
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test Accounts (after seeding)

| Role    | Email                | Password     |
|---------|----------------------|--------------|
| Admin   | admin@shefa.health   | password123  |
| Doctor  | sarah@shefa.health   | password123  |
| Doctor  | ravi@shefa.health    | password123 (pending approval) |
| Patient | john@example.com     | password123  |
| Patient | alice@example.com    | password123  |

---

## 🏗️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 14, React 18, TypeScript    |
| Styling    | Tailwind CSS, custom design system  |
| Backend    | Next.js API Routes, REST            |
| Database   | MongoDB + Mongoose ODM              |
| Auth       | NextAuth v4 (Credentials + Google)  |
| Payments   | Stripe (integration ready)          |
| Video      | WebRTC (browser-native)             |
| Real-time  | Socket.io (ready for integration)   |
| Icons      | Lucide React                        |

---

## 👥 User Roles

### 🧑‍💼 Admin
- Approve/reject doctor registrations
- Suspend/activate users
- View platform analytics & revenue

### 👨‍⚕️ Doctor (Requires Admin Approval)
- Manage professional profile, fees & availability
- View confirmed appointments & start video calls
- Create digital prescriptions
- Access only appointment-linked patient data

### 🧑‍🦱 Patient
- Browse verified doctors & book appointments
- Pay consultation fees
- Join video consultations
- View prescriptions & medical records
- Rate doctors after consultations

---

## 🔐 Security Model

**Core Rule:** No appointment = no access to medical data.

- Password hashing with bcrypt (12 rounds)
- JWT session tokens (24hr expiry)
- Role-based API authorization via middleware
- Appointment-based data isolation
- Suspension checks in auth flow
- Input validation with Zod on all endpoints
- HIPAA-inspired access control

---

## 📁 Project Structure

```
shefa/
├── scripts/
│   └── seed.ts              # Database seeding script
├── src/
│   ├── app/
│   │   ├── (dashboard)/     # Role-based dashboards
│   │   │   ├── admin/       # Admin pages
│   │   │   ├── doctor/      # Doctor pages
│   │   │   ├── patient/     # Patient pages
│   │   │   └── notifications/
│   │   ├── api/             # REST API routes
│   │   ├── auth/            # Login & Register pages
│   │   ├── consultation/    # Video consultation page
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   └── layout/          # AuthProvider, DashboardLayout
│   ├── lib/
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── db/connection.ts # MongoDB connection
│   │   ├── models/          # 10 Mongoose schemas
│   │   ├── utils/api.ts     # API helpers & RBAC
│   │   └── validators/      # Zod validation schemas
│   ├── styles/globals.css   # Tailwind + custom design
│   ├── types/index.ts       # TypeScript definitions
│   └── middleware.ts        # Route protection
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 📊 Database Collections

| Collection      | Description                      | Key Indexes                       |
|-----------------|----------------------------------|-----------------------------------|
| users           | All platform users               | email (unique), role              |
| doctors         | Doctor profiles                  | userId (unique), isApproved       |
| patients        | Patient profiles                 | userId (unique)                   |
| appointments    | Central entity                   | doctorId+date, patientId+date     |
| payments        | Transaction records              | appointmentId (unique)            |
| videoSessions   | Consultation rooms               | appointmentId (unique), roomId    |
| prescriptions   | Digital prescriptions            | appointmentId, doctorId           |
| medicalRecords  | Uploaded documents               | patientId, appointmentId          |
| reviews         | Patient ratings                  | appointmentId (unique), doctorId  |
| notifications   | User notifications               | userId, isRead                    |

---

## 🌐 API Endpoints

### Auth
- `POST /api/auth/register` — Register (patient/doctor)
- `GET/POST /api/auth/[...nextauth]` — NextAuth handlers

### Admin
- `GET/PATCH /api/admin/doctors` — Doctor verification
- `GET/PATCH /api/admin/users` — User management
- `GET /api/admin/analytics` — Platform analytics

### Doctor
- `GET/PATCH /api/doctor/me` — Profile management
- `GET/PATCH /api/doctor/appointments` — Appointment actions

### Patient & Shared
- `GET/PATCH /api/patient/me` — Patient profile
- `GET /api/doctors` — Browse verified doctors
- `POST/GET/PATCH /api/appointments` — Appointment CRUD
- `POST/PATCH/GET /api/payments` — Payment flow
- `GET /api/video` — Join video session
- `POST/GET /api/patient/prescriptions` — Prescriptions
- `POST/GET /api/patient/records` — Medical records
- `POST/GET /api/appointments/reviews` — Doctor reviews
- `GET/PATCH /api/notifications` — Notifications

---

## 📅 Appointment Lifecycle

```
Patient Books → PENDING
     ↓
Payment Made → PAID
     ↓
Admin/Auto Confirm → CONFIRMED
     ↓
Video Call + Prescription → COMPLETED
     |
     └→ CANCELLED (at any point before completion)
```

---

## 🎨 Design System

Custom Tailwind theme with:
- **Fonts:** Playfair Display (display), DM Sans (body), JetBrains Mono (code)
- **Colors:** shefa-50 to shefa-950 (medical green palette)
- **Components:** `btn-primary`, `card`, `input-field`, `status-badge`, `glass`
- **Animations:** fade-in, slide-up, pulse-soft, scale-in

---

## 👨‍💻 Team Structure (6 Members)

1. **Team Lead** — Architecture, code review, integration
2. **Auth & RBAC** — Authentication system, middleware
3. **Doctor Dashboard** — Doctor features, prescriptions
4. **Patient Dashboard** — Patient features, booking
5. **WebRTC Video** — Video consultation system
6. **Payments & Analytics** — Stripe integration, admin panel

---

## 🚀 Future Scope

- [ ] Mobile app (React Native)
- [ ] AI symptom checker
- [ ] In-app doctor chat
- [ ] Emergency consultations
- [ ] Multi-language support
- [ ] File upload (S3/Cloudinary)
- [ ] Email notifications
- [ ] Stripe real webhook integration

---

## 📜 License

This project is developed as an academic/portfolio project for the SHEFA telemedicine platform.
