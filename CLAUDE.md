# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pocket Closet** is a full-stack web application for managing personal wardrobes with AI-powered image analysis. It enables users to catalog clothing, create outfit combinations, and receive style recommendations using Google Gemini AI.

**Architecture**: Monorepo with separate backend (Express.js), frontend (React + Vite), and shared packages.

## Common Development Commands

### Backend Commands
```bash
cd backend

# Development (with auto-reload via nodemon)
npm run dev

# Production build
npm run build

# Run production build
npm start

# Database management
npm run prisma:generate   # Regenerate Prisma Client after schema changes
npm run prisma:migrate    # Run pending database migrations
npm run prisma:studio     # Open Prisma Studio UI for visual database browsing
npm run prisma:reset      # Reset database to clean state (dev only)
```

### Frontend Commands
```bash
cd frontend

# Development (Vite dev server with HMR on http://localhost:5173)
npm run dev

# Production build (TypeScript check + Vite bundling)
npm run build

# Preview production build locally
npm run preview

# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Running Locally
1. Start backend: `cd backend && npm run dev` (runs on http://localhost:3001)
2. Start frontend: `cd frontend && npm run dev` (runs on http://localhost:5173)
3. Backend makes database requests to PostgreSQL (configured via DATABASE_URL in .env)
4. Frontend makes API calls to `http://localhost:3001/api/*`

## High-Level Architecture

### Backend Structure (`backend/src/`)
The backend follows MVC/layered architecture with these key directories:
- **`server.ts`**: Express app entry point, middleware setup, route registration
- **`config/`**: Database and Prisma configuration
- **`routes/`**: Route definitions (maps URLs to controllers)
- **`controllers/`**: Request handlers (receive HTTP requests, delegate to services)
- **`services/`**: Business logic layer (handles core functionality like clothing analysis, recommendations)
- **`middleware/`**: Express middleware (authentication, error handling, validation)
- **`utils/`**: Helper functions and utilities
- **`types/`**: TypeScript type definitions

**Key API Routes** (MVP Phase):
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/clothing/upload` - Upload image + Gemini analysis
- `/api/clothing` - List user's clothing
- `/api/clothing/:id` - Get specific item
- `/api/clothing/:id` - Delete clothing item
- `/api/recommendations/style` - Get style recommendations

**File Upload Handling**:
- Multer middleware handles file uploads
- Sharp processes images (resizing, format conversion)
- Supabase Storage stores processed images (1GB free tier)
- Google Generative AI analyzes clothing images to extract metadata

**Database**: PostgreSQL accessed via Prisma ORM. Schema defined in `backend/prisma/schema.prisma` with 11 models:
- User, UserPreferences (user data and style preferences)
- Clothing, ClothingImage, ClothingMetadata (clothing items with AI analysis results)
- Combination, CombinationItem (outfit groupings)
- MatchingRule (clothing compatibility)
- UsageStatistic (wear tracking)
- CacheEntry (optional caching layer)

### Frontend Structure (`frontend/src/`)
- **`main.tsx`**: Vite entry point
- **`App.tsx`**: Root React component (likely contains router setup)
- **`components/`**: Reusable React components
- **`pages/`**: Page-level components (routed views)
- **`services/`**: API client services (Axios-based calls to backend)
- **`stores/`**: Zustand global state stores (authentication, user data, etc.)
- **`hooks/`**: Custom React hooks (reusable component logic)
- **`types/`**: TypeScript type definitions
- **`utils/`**: Utility functions
- **`assets/`**: Images, icons, and static files

**Styling**: Tailwind CSS (configured in `frontend/tailwind.config.js`) with PostCSS processing

**HTTP Client**: Axios for API calls, should be configured with base URL `http://localhost:3001/api` in development

### Technology Stack Summary (MVP Optimized)
- **Backend**: Express.js, TypeScript, Prisma ORM, PostgreSQL
- **Frontend**: React 19, TypeScript, Vite, Zustand, Tailwind CSS
- **Authentication**: JWT + Bcrypt
- **AI Integration**: Google Generative AI (Gemini 2.5 Flash)
- **File Handling**: Multer, Sharp, Supabase Storage
- **Database**: Supabase (PostgreSQL + File Storage)
- **Removed for MVP**: Redis (caching - Phase 2), Zod (validation), Helmet (security)

## Database Schema Quick Reference

Key models and relationships:
- **User** → UserPreferences (1:1)
- **User** → Clothing (1:N) - user owns clothing items
- **User** → Combination (1:N) - user creates outfit combinations
- **Clothing** → ClothingImage (1:N) - multiple images per item
- **Clothing** → ClothingMetadata (1:1) - AI-extracted attributes (color, material, pattern, etc.)
- **Combination** → CombinationItem (1:N) - items in outfit
- **Clothing** → MatchingRule (1:N) - compatibility rules with other items

**Important Fields**:
- Clothing has `aiAttributes` (JSON) for AI-extracted data, `measurements` (JSON) for sizing
- UserPreferences stores `stylePreferences` (JSON) and `bodyMeasurements` (JSON)
- CombinationItem has `rating` for user feedback on outfit combinations

Run `npm run prisma:studio` in backend to visually inspect the database.

## Key Implementation Details to Know

### Authentication Flow
- JWT tokens for stateless authentication
- Passwords hashed with Bcrypt
- Likely need middleware to verify tokens on protected routes

### Image Processing Pipeline
- Users upload clothing images via Multer
- Sharp processes images (resize, format conversion)
- Google Generative AI analyzes image to extract: color, pattern, material, style, occasion metadata
- Store both original and processed images in ClothingImage model
- Extracted metadata stored in ClothingMetadata or aiAttributes JSON field

### AI-Powered Recommendations
- Google Generative AI analyzes user's clothing collection
- Considers user's stylePreferences and bodyMeasurements from UserPreferences
- Generates outfit combinations stored in Combination model
- Tracks wear frequency and user ratings for preference learning

### Error Handling
- Centralized error middleware in Express (`backend/src/middleware/error.middleware.ts`)
- Basic input validation in request handlers
- Handle file upload errors (size limits, invalid formats)
- Handle AI API errors gracefully

### CORS and Development
- CORS enabled to allow frontend (http://localhost:5173) to call backend (http://localhost:3001)
- Configured in backend/src/server.ts

## Frontend-Backend Communication

**Base URL Pattern**:
- Frontend should configure Axios with base URL: `http://localhost:3001/api`
- Example API calls:
  - POST `/api/auth/login` - User login
  - POST `/api/auth/register` - User registration
  - POST `/api/clothing` - Create clothing item (with file upload)
  - GET `/api/clothing` - List user's clothing
  - GET `/api/clothing/:id` - Get specific clothing item
  - POST `/api/combinations` - Generate outfit recommendation
  - GET `/api/combinations` - List user's combinations

**File Uploads**:
- Use multipart/form-data for requests with file uploads
- Frontend can use react-dropzone for drag-and-drop uploads
- Backend receives file via Multer middleware

## Environment Variables

**Backend** (in `backend/.env`):
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_BUCKET_NAME` - Supabase storage bucket (e.g., "clothing-images")
- `JWT_SECRET` - Secret key for JWT signing
- `GOOGLE_AI_API_KEY` - Google Generative AI (Gemini) API key
- `NODE_ENV` - development/production
- `PORT` - Server port (default 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default http://localhost:5173)

**Frontend** (in `frontend/.env.local`):
- `VITE_API_URL` - Backend API base URL (default http://localhost:3001/api)

## Project Status

**MVP Phase - Technology Stack Optimized** ✅

### Completed:
- Core infrastructure simplified and optimized
- Database schema designed (Prisma + Supabase)
- TypeScript configured
- Backend middleware created (auth, error handling)
- Gemini AI service integrated
- Frontend state management (Zustand stores)
- API client setup (Axios with auto token injection)
- Development documentation (README_MVP.md, SUPABASE_SETUP.md, MVP_CHECKLIST.md)

### Removed (for MVP focus):
- Redis (phase 2+)
- Zod validation (basic error handling only)
- Helmet security middleware (Supabase provides security)
- React Query (Zustand sufficient)

### Next Implementation Steps (7-10 days to MVP):
1. Authentication endpoints (register, login)
2. Clothing upload + Gemini AI analysis
3. Clothing CRUD endpoints
4. Style recommendation endpoint (text filtering)
5. Frontend pages (login, upload, wardrobe, recommendations)
6. Basic integration testing

**See README_MVP.md for detailed implementation checklist**

한국인을 고려하고 한국어로 답변이나 등록을 해야함

공부할수있게 이건 왜 사용하고 어떻게 동작하는지 직접해볼수있있게 지도 해줘