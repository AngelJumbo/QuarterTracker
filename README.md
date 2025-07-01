# 🪙 QuarterTracker

A simple full stack web app to help you keep track of your U.S. quarter dollar coin collection.

[https://quartertracker.xyz](https://quartertracker.xyz)

## 📌 About

I built this app because I kept forgetting which quarters I already had in my collection. If you're into collecting U.S. quarters — from 1999 to 2025 — this app might help you too.

![Dashboard](https://i.ibb.co/Psjwn1vL/image.png "Dashboard")
![Collection](https://i.ibb.co/mrjkYGcw/image.png "Collection")


## 🔍 Features

- 🔐 Google login
- 🗂️ Browse coins by year and series or search for specific coins
- ✅ Check off coins you have in your collection
- 👥 Share your collection

## 🛠️ Tech Stack

- **Frontend:** Vite + React
- **Backend:** Node.js + Express
- **Database:** SQLite
- **Authentication:** Google OAuth

## 🚀 Running Locally

```bash
git clone https://github.com/AngelJumbo/QuarterTracker.git
cd QuarterTracker

npm install

```
You need to add your Google credentials for the auth in a .env file
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=/api/auth/google/callback
```
Run
```bash

npm run dev

```
Deploy
```bash

npm run build
npm run start

```




