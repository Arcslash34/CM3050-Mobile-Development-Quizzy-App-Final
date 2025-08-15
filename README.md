# 🧠 Quizzy – Gamified Trivia App

**Quizzy** is an engaging, educational mobile trivia app built with **React Native** and **Expo**, backed by **Supabase** and using quiz content from the **Open Trivia API**.  
It features personalized quiz gameplay, XP and badge rewards, daily challenges, social connections, and real-time push notifications — all in a sleek dark-themed UI with multilingual support.

---

## 📦 Features

- 🔐 Authentication (Signup, Login, Forgot Password – Vercel-hosted reset flow)
- 🧠 Category-based and Daily Trivia Quizzes
- 🎖️ XP, Score, and Badge Tracking
- 📈 Quiz History and Review
- 🏆 Ranking System (Daily, Weekly, All-Time)
- 👥 Friend Requests, Messaging, Blocking
- 🔕 Push Notifications (Daily quiz & message alerts)
- 🗣️ Manual Language Switching with Dynamic Text Translation
- 📶 Saving Support via AsyncStorage
- 🌙 Modern Dark UI Design

---

## 🛠️ Tech Stack

| Layer           | Tools & Services Used                              |
|-----------------|----------------------------------------------------|
| Presentation    | React Native, Expo, Safe Area Context, Ionicons    |
| Logic (App Tier)| React Hooks, State Management, Badge Logic         |
| Data Tier       | Supabase (Auth, DB, Storage), AsyncStorage, JSON   |

### Third-party Services
- [📚 Open Trivia DB](https://opentdb.com/) – Source of quiz questions  
- [🪄 Vercel](https://vercel.com/) – Hosted Supabase password reset page  
- [📲 Expo](https://expo.dev/) – App development, push notifications  

---

## 🚀 Run Locally

## 🚀 Run Locally

> **⚠️ SDK Version Notice:**  
> This project was built and tested using **Expo SDK 52**.  
> For best compatibility, please run the app using the Expo Go client for SDK 52:  
> [https://expo.dev/go?sdkVersion=52&platform=android&device=true](https://expo.dev/go?sdkVersion=52&platform=android&device=true)

To run **Quizzy** on your local machine using VS Code or any terminal:

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Start the Development Server
```bash
npm start
```
This will launch the Expo Developer Tools in your browser.  
From here, you can run the app on:
- Android Emulator  
- iOS Simulator (macOS only)  
- Physical device via Expo Go app  

### 3️⃣ Run Tests
```bash
npm test
```

---

## 🧪 Testing Notes
- Uses **Jest** for unit and integration tests  
- Run `npm test` to execute all test suites  

---

## 👥 Demo Accounts for Testing

### Gmail (For Testing Supabase Password Reset)
- **Email:** quizzyfinal@gmail.com  
- **Password:** password000.

### App Login
- **Username:** Quizzy  
- **Password:** test123

---

## 📚 Credits / Acknowledgments
- **Open Trivia DB** – For quiz content  
- **Supabase** – For backend services (auth, storage, DB)  
- **Vercel** – For hosting the password reset flow  
- **Expo** – For push notification support and mobile development tools  
