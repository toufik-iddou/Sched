# 📅 Sched — MERN Scheduling App with Google Calendar & Meet Integration

**Sched** is a Calendly-like appointment scheduling app built with the MERN stack. It allows users to define their availability, generate a personal booking link, and let guests schedule meetings. Scheduled meetings are synced to **Google Calendar** and include a **Google Meet** link for video conferencing.

---

## 📌 Project Specification

### 🎯 Goal

Build a self-hosted alternative to Calendly where users:
- Authenticate with Google.
- Set their weekly availability.
- Share a public booking page.
- Let guests book meetings within available times.
- Have meetings automatically scheduled in Google Calendar with Meet links.

---

### 👥 User Roles

1. **Host (Registered User)**
   - Signs in with Google.
   - Manages their availability.
   - Shares a unique booking link (e.g., `mysched.app/username`).
   - Receives notifications and calendar invites for bookings.

2. **Guest**
   - Accesses the host’s booking page.
   - Selects an available time.
   - Submits name and email to confirm.
   - Gets a confirmation email with a Google Meet link.

---

### 🧱 Functional Requirements

| Module               | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| User Authentication  | Google OAuth 2.0 login with access to Calendar API.                         |
| Availability Manager | Hosts define weekly available time slots (e.g., M-F 9am–5pm).               |
| Booking Page         | Public URL where guests see availability and request meetings.              |
| Booking Logic        | Avoid double bookings; check for calendar conflicts before confirming.      |
| Google Calendar Sync | Bookings are added to Google Calendar with Google Meet links.              |
| Email Notification   | Send event confirmation to both host and guest.                             |
| Dashboard (Host)     | Host can view and manage upcoming meetings.                                 |

---

### 🧪 Non-Functional Requirements

- 🕒 Real-time availability updates
- 🔐 Secure session management with JWT
- 🌐 Responsive UI for mobile & desktop
- 📈 Scalable backend API
- 🗃️ Persistent storage (MongoDB)
- 🔄 Refresh token handling for Google APIs

---

## 🛠️ Tech Stack

| Layer     | Technology                |
|-----------|---------------------------|
| Frontend  | React, React Router, Axios|
| Backend   | Node.js, Express.js       |
| Auth      | Google OAuth2, JWT        |
| Database  | MongoDB + Mongoose        |
| APIs      | Google Calendar API       |
| Hosting   | Vercel (frontend), Railway/Render (backend), MongoDB Atlas |
