# ⛳ Golf Charity Subscription Platform

> **Play golf. Win prizes. Support charities. Change lives.**

A subscription-driven web application combining **golf performance tracking**, **charity fundraising**, and a **monthly draw-based reward engine** — designed to feel emotionally engaging and modern, deliberately avoiding the aesthetics of a traditional golf website.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)

- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [Feature Deep-Dive](#feature-deep-dive)
- [Draw & Prize Logic](#draw--prize-logic)
- [Charity System](#charity-system)
- [Admin Panel](#admin-panel)
- [Deployment](#deployment)
- [Testing Checklist](#testing-checklist)
- [Known Edge Cases](#known-edge-cases)

---

## Overview

This platform allows golfers to subscribe (monthly or yearly), enter their Stableford golf scores, participate in monthly prize draws, and contribute a portion of their subscription to a charity of their choice.


---

## Live Demo

| Role | URL | Credentials |
|------|-----|-------------|
| Admin | `/auth` | `admin@golfcharity.com` / `password123` |
| User | `/auth` | Sign up via `/signup` | mahi@gmail.com |password:123456789

> **Note:** The live URL will be provided after deployment to Vercel.

---

## Features

### For Subscribers
- Secure sign-up and email-verified login
- Monthly and yearly subscription plans 
- Rolling 5-score Stableford entry system (most recent always shown first)
- Participation in monthly prize draws (3, 4, and 5-number match tiers)
- Charity selection and configurable contribution percentage
- Full winnings dashboard with payment status tracking
- Winner verification flow with score screenshot upload

### For Administrators
- Full user management (view, edit profile, change roles, manage subscriptions)
- Draw configuration: random lottery or algorithm-weighted draw logic
- Draw simulation mode before official publishing
- Jackpot rollover management if no 5-match winner
- Charity directory management (add, edit, delete, feature charities)
- Event management for charity golf days and upcoming events
- Winners panel: review verification submissions, approve/reject, mark as paid
- Analytics: total users, prize pool totals, charity contribution summaries, draw stats

### For Public Visitors
- Browse the charity directory with search and category filters
- View charity profiles, descriptions, images, and upcoming events
- Understand draw mechanics and subscription plans before signing up

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Auth & Database | Supabase (PostgreSQL + Auth) |

| State Management | React Context API |
| Notifications | react-hot-toast |
| Deployment | Vercel |

---


---

## Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- A Supabase account (create a **new project** — do not reuse personal projects)
- A Vercel account (create a **new account** for deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/Rohith-Das/golf-charity-app.git
cd golf-charity-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root (see [Environment Variables](#environment-variables) below).

### 4. Set Up the Supabase Database

Run the SQL schema in your Supabase project's SQL Editor (see [Database Schema](golf-charity-platform)).

### 5. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

Create a `.env.local` file with the following:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

> **Important:** Never commit `.env.local` to version control. Add it to `.gitignore`.

For Vercel deployment, add these same variables under **Project Settings → Environment Variables**.

---

## Database Schema

The following tables are required in Supabase:

### `profiles`
Extends Supabase `auth.users`. Created automatically via a trigger on signup.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | References `auth.users.id` |
| `email` | text | User email |
| `full_name` | text | Display name |
| `role` | text | `user` or `admin` |
| `subscription_status` | text | `active`, `inactive`, `cancelled`, `trial` |
| `subscription_plan` | text | `monthly`, `yearly`, or `none` |
| `subscription_ends_at` | timestamptz | End of current billing period |
| `charity_id` | uuid | Selected charity (FK → charities) |
| `charity_contribution_pct` | integer | Default 10, max 100 |
| `total_winnings` | numeric | Cumulative prize earnings |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `golf_scores`
Stores up to 5 rolling scores per user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → profiles |
| `score` | integer | Stableford score (1–45) |
| `score_date` | date | Date the round was played |
| `created_at` | timestamptz | |

### `subscriptions`
Tracks Stripe subscription state per user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `user_id` | uuid | FK → profiles |
| `plan` | text | `monthly` or `yearly` |
| `status` | text | `active`, `cancelled`, etc. |
| `current_period_end` | timestamptz | |
| `cancel_at_period_end` | boolean | |

### `charities`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `name` | text | |
| `description` | text | |
| `short_description` | text | |
| `category` | text | e.g. `cancer`, `veterans`, `children` |
| `logo_url` | text | |
| `banner_url` | text | |
| `is_active` | boolean | |
| `is_featured` | boolean | Appears in Spotlight section |
| `supporters_count` | integer | |
| `total_raised` | numeric | |
| `sort_order` | integer | Display ordering |

### `charity_events`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `charity_id` | uuid | FK → charities |
| `title` | text | |
| `event_date` | date | |
| `location` | text | |
| `status` | text | `upcoming`, `past` |

### `draws`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `draw_date` | date | |
| `draw_numbers` | integer[] | 5 drawn numbers |
| `logic_type` | text | `random` or `algorithmic` |
| `status` | text | `simulated`, `published` |
| `jackpot_amount` | numeric | Rolled over if no 5-match |
| `prize_pool_total` | numeric | |

### `draw_winners`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `draw_id` | uuid | FK → draws |
| `user_id` | uuid | FK → profiles |
| `match_type` | text | `3_match`, `4_match`, `5_match` |
| `prize_amount` | numeric | |
| `verification_status` | text | `pending`, `approved`, `rejected` |
| `proof_url` | text | Screenshot upload |
| `payment_status` | text | `pending`, `paid` |

---

## User Roles

### Public Visitor
Can browse the charity directory, read about draw mechanics, and initiate signup.

### Registered Subscriber
- Enter and manage their 5 rolling golf scores
- View upcoming draws and their participation status
- Select and update charity + contribution percentage
- View winnings history and submit verification proof

### Administrator
- Full user management including role and subscription overrides
- Configure, simulate, and publish monthly draws
- Manage the full charity directory and events
- Review winner submissions and mark payouts as complete
- Access analytics and reports

---

## Feature Deep-Dive

### Authentication Flow

Authentication is managed through Supabase Auth with JWT sessions. On login, `AuthContext` fetches the user's profile from the `profiles` table (including their role). The `isAdmin` flag drives all role-gated UI and routing:

```js
// Redirect after login based on role
navigate(isAdmin ? '/admin' : '/dashboard', { replace: true })
```

Email confirmation is required on signup. A 500ms deferred `fetchProfile` call after login ensures the profile is loaded before navigation.

### Score Management (Rolling 5-Score Window)

Users enter scores in Stableford format (range: 1–45), each with a date. The system enforces a maximum of 5 stored scores per user. When a 6th score is added, the oldest is automatically deleted. Scores are always displayed in reverse chronological order (most recent first).

This rolling window is enforced at the database level via a trigger or at the application layer in `ScoreManager.jsx`.

### Subscription Guard

The `<SubscriptionGuard>` component wraps any feature that requires an active subscription (score entry, draw panel, winnings overview). Users with `subscription_status !== 'active'` are shown a prompt to subscribe rather than the feature content.

---

## Draw & Prize Logic

### Draw Types

| Match | Pool Share | Jackpot Rollover? |
|-------|------------|-------------------|
| 5-Number Match | 40% | Yes — rolls to next month if unclaimed |
| 4-Number Match | 35% | No |
| 3-Number Match | 25% | No |

### Draw Logic Options

- **Random** — Standard lottery-style draw; 5 numbers generated randomly
- **Algorithmic** — Weighted by frequency of user scores (most or least frequent scores are more likely to be drawn)

### Operational Flow

1. Admin configures draw logic and optionally runs a **simulation** (pre-analysis mode; results not published)
2. Admin reviews simulation output
3. Admin publishes the official draw result
4. System identifies winners by comparing each subscriber's 5 scores to the 5 drawn numbers
5. If multiple users win the same tier, the prize is **split equally**
6. If no 5-match winner exists, the 40% jackpot **rolls over** to the next month's pool

---

## Charity System

### Contribution Model

- Users select a charity at signup (can be updated via profile)
- Minimum charity contribution: **10%** of subscription fee
- Users may voluntarily increase their contribution percentage
- One-off independent donations are also supported (not tied to draws)

### Charity Directory

- Searchable and filterable by category (Cancer, Veterans, Children, Environment, Mental Health, Disability, Sports, Other)
- Individual charity profiles with description, logo, banner, supporter count, and total raised
- Featured/Spotlight section on the homepage for highlighted charities
- Upcoming charity golf events displayed in a calendar-style feed

---

## Admin Panel

The admin dashboard is tab-based with five sections:

| Tab | Description |
|-----|-------------|
| **Users** | View all users (non-admin), search by name/email, edit name/role/plan/status inline |
| **Draw Management** | Configure draw logic, run simulations, publish results, view jackpot status |
| **Score Manager** | View and edit golf scores for any user |
| **Charities** | Add, edit, delete charities; manage images, categories, and featured status |
| **Winners** | Review verification submissions (approve/reject), mark payouts as complete |

Stats cards at the top of the admin panel display: total users, admin count, active subscribers, and estimated monthly revenue.

---

## Deployment

### Deploying to Vercel

1. Push the repository to GitHub
2. Log in to a **new Vercel account** (do not use an existing personal account)
3. Import the GitHub repository
4. Add all environment variables under **Settings → Environment Variables**
5. Deploy — Vercel will auto-detect Vite and apply the correct build settings

**Build settings (auto-detected by Vercel):**
```
Build Command:  npm run build
Output Dir:     dist
Install Command: npm install
```

### Supabase Configuration

1. Create a **new Supabase project** (do not reuse existing projects)
2. Run the full schema SQL in the SQL Editor
3. Enable **Email Auth** under Authentication → Providers
4. Configure **Row Level Security (RLS)** policies for all tables
5. Set the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel environment variables

---

## Testing Checklist

- [ ] User signup with email verification
- [ ] User login and role-based redirect (user → `/dashboard`, admin → `/admin`)
- [ ] Subscription flow — monthly plan
- [ ] Subscription flow — yearly plan (discounted rate)
- [ ] Score entry — 5-score rolling window (confirm oldest is removed on 6th entry)
- [ ] Score edit and delete
- [ ] Draw simulation — both random and algorithmic logic
- [ ] Draw publish — results visible to users
- [ ] Jackpot rollover when no 5-match winner
- [ ] Charity selection at signup and via profile
- [ ] Charity contribution percentage update
- [ ] Winner verification — screenshot upload, admin approval/rejection
- [ ] Admin payout marking (Pending → Paid)
- [ ] User dashboard — all modules display correctly
- [ ] Admin panel — all tabs functional
- [ ] Subscription guard — unsubscribed users see upgrade prompt
- [ ] Charity directory — search, filter, featured section, events
- [ ] Responsive design — mobile and desktop
- [ ] Error handling — invalid scores, expired subscriptions, failed payments

---

## Known Edge Cases

| Scenario | Handling |
|----------|----------|
| No 5-match winner in a draw | 40% jackpot rolls over and accumulates for next month |
| Multiple winners in same tier | Prize amount divided equally among all winners |
| User cancels subscription mid-month | Access retained until `subscription_ends_at`; then gated by `SubscriptionGuard` |
| Score entered outside valid range (1–45) | Client-side and server-side validation rejects the entry |
| User has fewer than 5 scores at draw time | Only entered into tiers where their score count allows a match |
| Admin edits a user's subscription status manually | Profile `subscription_status` field updated directly; Stripe webhook not affected |

---

## Architecture Notes

- **Mobile-first** — All components designed with responsive Tailwind breakpoints
- **Multi-country ready** — No hard-coded currency or locale assumptions beyond the UI layer
- **Extensible draw engine** — Logic type is a configurable field; new algorithms can be added without schema changes
- **Campaign module hook** — Admin panel tab structure is easily extended for future campaign management
- **Mobile app ready** — Business logic is isolated from UI components; React Native adaptation is straightforward

---

## Credits

Produced as a sample assignment for the **Digital Heroes** trainee selection process.

**Document Reference:** PRD — Golf Charity Subscription Platform · Version 1.0 · March 2026

---

*For questions about this assignment, contact Digital Heroes at [digitalheroes.co.in](https://digitalheroes.co.in)*