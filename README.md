# 🏌️ Digital Heroes — Golf Performance, Charity & Monthly Draw Platform

<p align="center">
  <strong>A full-stack subscription platform combining golf performance tracking, charitable giving, and a monthly prize draw.</strong>
</p>

<p align="center">
  <a href="https://digital-heroes-sigma-lemon.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel" alt="Live Demo"/>
  </a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS"/>
</p>

<p align="center">
  <a href="https://digital-heroes-sigma-lemon.vercel.app">🌐 Live Application</a>
  •
  <a href="#-architecture">Architecture</a>
  •
  <a href="#-core-business-logic">Business Logic</a>
  •
  <a href="#-testing">Testing</a>
</p>

---

## 📌 Project Overview

**Digital Heroes** is a full-stack web application designed around a subscription-driven golf community.

The platform combines three core experiences:

- ⛳ **Golf performance tracking**
- ❤️ **Charitable contribution management**
- 🎟️ **Monthly prize draw participation**

Subscribers can maintain their latest Stableford scores, select a charity and contribution percentage, participate in monthly draws, and track potential winnings.

Administrators have a dedicated operational dashboard for managing users, subscriptions, monthly draws, charities, winner verification, payouts, and platform analytics.

The application was designed with a strong focus on **business-rule accuracy, secure data access, responsive UX, and scalable application architecture**.

---

## 🚀 Live Demo

### Production

**https://digital-heroes-sigma-lemon.vercel.app**

The application is deployed on **Vercel** with **Supabase PostgreSQL/Auth/Storage** as the backend infrastructure.

> **Note:** Subscription payments currently use a clearly labelled demo/test subscription adapter rather than live Stripe billing. This allows the complete subscription lifecycle and access-control logic to be demonstrated without processing real payments.

---

# ✨ Key Features

## 👤 Subscriber Experience

### Authentication

- User signup and login
- Supabase Authentication
- Protected subscriber routes
- Authentication-aware dashboard
- Subscription-based access control

### Subscription Management

Supports:

- Monthly subscription
- Yearly subscription
- Subscription status tracking
- Subscription period tracking
- Cancellation flow
- Lapsed subscription detection
- Real-time effective subscription checks

### Golf Score Management

Subscribers can:

- Add Stableford scores
- Edit scores
- Maintain a rolling history
- View their latest scores
- Participate in monthly draws using their latest available scores

Business rules include:

- Stableford score range: **1–45**
- One score per date
- Maximum of **5 retained scores**
- New scores replace the oldest retained score
- Scores are displayed newest first

### Charity Contributions

Subscribers can:

- Select their preferred charity
- Configure contribution percentage
- Choose a contribution between **10% and 100%**
- View their selected charity
- Review charity impact information

### Monthly Draw

Subscribers can view:

- Upcoming draws
- Published draw numbers
- Match results
- Prize information
- Winner/payment status

### Winner Verification

Potential winners can upload supporting evidence such as a screenshot of their golf platform score.

The system supports:

- Secure file upload
- File type validation
- File size validation
- User-specific storage paths
- Winner evidence submission
- Admin verification
- Approval/rejection workflow
- Payment status tracking

---

# 🛠️ Admin Platform

The application includes a dedicated administrator experience.

## User Management

Administrators can view:

- Total users
- Active subscribers
- Monthly subscribers
- Yearly subscribers
- Subscription status
- Subscription plan
- Contribution percentage
- Subscription period
- Provider information

Users can also be searched from the admin interface.

---

## 🎲 Draw Management

Administrators can:

- Generate monthly draw simulations
- Select draw mode
- Generate random draw numbers
- Use score-frequency weighted generation
- Review simulation results
- Review eligible subscribers
- Review prize pool calculations
- Publish a monthly draw
- Prevent duplicate monthly publication

The system validates:

- Exactly 5 draw numbers
- Number range of 1–45
- Unique draw numbers
- Current draw month
- Duplicate published draws

---

## 🏆 Winner Management

Administrators can:

- View potential winners
- Review match counts
- View uploaded evidence
- Approve winner verification
- Reject verification
- Process payout status
- Track pending vs paid winners

Winner evidence is served using **short-lived signed URLs** rather than exposing private storage files publicly.

---

# 🧠 Core Business Logic

One of the main engineering challenges in this project was translating the product requirements into deterministic and testable business rules.

## Stableford Score Rules

Each subscriber maintains up to five recent scores.

```text
User Scores

Latest
  ↓
45
38
42
35
40
  ↓
Maximum retained scores = 5