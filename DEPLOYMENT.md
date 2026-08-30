# 🚀 NET-LAB Deployment Guide

This guide explains how to deploy NET-LAB to production.

---

## 1. Environment Variables Configuration

Create your production `.env` or set the following variables in your hosting provider:

```env
# Application Host URL
APP_URL="https://your-domain.com"
PORT=3000
NODE_ENV="production"

# Supabase Integration (Optional - Works Offline/Local without credentials)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-secret-service-role-key"

# Creator Configuration
VITE_CREATOR_NAME="Sandesh Bajgai"
VITE_CREATOR_GITHUB="https://github.com/sandeshbajgai"
```

---

## 2. Supabase Database Setup

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New Query**.
3. Copy and run `/supabase/migrations/001_initial_schema.sql`.
4. Copy and run `/supabase/seed/seed_data.sql` to populate initial labs and quiz items.
5. In **Project Settings** -> **API**, copy your `URL` and `anon key` to your `.env`.

---

## 3. Production Build & Start

Build the client assets and compile the Express server bundle:

```bash
npm run build
npm start
```

The application will listen on port `3000` with pre-compiled single-bundle server execution.

---

## 4. Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```
