# 🏥 Sangi Hospital — IPD Portal

A Hospital Management System for managing IPD patient registrations, admissions, discharge, billing and history across multiple branches.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or above)
- npm

### Installation
```bash
git clone https://github.com/IUIS-Team-2/HMS-Portal.git
cd HMS-Portal
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Login Credentials

Role, User ID, Password, Access
Super Admin - superadmin , super123, (Analytics + Both Branches)
Lakshmi Admin - admin_laxmi,laxmi123, Lakshmi Nagar Branch
Raya Admin - admin_raya,raya123, Raya Branch

> **Super Admin** has a branch switcher in the header to switch between branches.
> **Admin** accounts are locked to their respective branch automatically on login.

---

## ✨ Features

- 🔐 Role-based login (Super Admin / Admin per branch)
- 🏷️ Auto UHID generation for new patients
- 🔍 Search patients by Phone, National ID or Card Number
- 📋 Full IPD registration — Patient Info, Discharge, Services, Summary
- 💵 Payment Panel — Cash or Cashless (TPA Insurance / Panel Card)
- 🧾 Bill generation and print
- 📁 Patients History with admission timeline
- 🏥 Multi-branch support (Laxmi Nagar & Raya)

---

## 🏗️ Project Structure
```
src/
├── pages/          # SearchPage, PatientFormPage, DischargePage, ServicesPage, SummaryPage
├── components/     # Shared UI, Icons, Layout
├── data/           # constants.js (config, users, master data), mockDb.js
├── modals/         # UHID, Print, Patient Detail modals
└── utils/          # helpers.js
```

---

## 👥 Branches

| Branch | Location | Code |
|--------|----------|------|
| Laxmi Nagar | Mathura | LNM |
| Raya | Mathura | RYM |

---

*Built for Sangi Hospital — IPD Management*
