# University Training & Placement Management System

## Overview

This is a full-stack web application designed for university Training & Placement (T&P) cells to manage campus recruitment drives. The system serves two primary user roles: T&P Coordinators (administrators) and Students. It facilitates the entire placement lifecycle from drive creation to student applications, featuring AI-powered resume analysis using Google Gemini 1.5 Flash API.

The application provides coordinators with tools to manage placement drives, track student registrations, and monitor placement statistics, while students can browse opportunities, manage multiple resumes, apply to drives, and receive AI-powered resume optimization suggestions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing

**UI Component Strategy**
- shadcn/ui component library built on Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design system
- Custom design tokens defined in CSS variables for theming (light/dark mode support)
- Design system follows a "Modern Productivity Hybrid" approach inspired by Linear, Notion, and Material Design

**State Management**
- TanStack Query (React Query) for server state management, caching, and data fetching
- Local component state with React hooks for UI state
- Custom query client configuration with specific refetch and stale-time policies

**Styling Architecture**
- Design guidelines specify consistent spacing (2, 4, 6, 8, 12, 16 Tailwind units)
- Typography using Inter font family with specific text scales
- Responsive grid layouts with mobile-first approach
- Custom CSS utilities for hover/active states and elevation effects

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for RESTful API endpoints
- HTTP server created with Node.js `http` module for potential WebSocket support
- Modular route registration pattern (currently scaffolded in `server/routes.ts`)

**Database Layer**
- PostgreSQL as the primary database
- Drizzle ORM for type-safe database queries and schema management
- Database schema defined in `shared/schema.ts` for code sharing between client/server
- Drizzle Kit for schema migrations (output to `/migrations` directory)

**Data Access Pattern**
- Storage interface abstraction (`IStorage`) for CRUD operations
- Initial implementation uses in-memory storage (`MemStorage`) for development
- Production implementation would swap to PostgreSQL-backed storage without changing interface

**Authentication & Security**
- JWT-based authentication planned with httpOnly cookies
- Role-based access control for 'coordinator' and 'student' roles
- Session management with planned support for express-session

**File Handling**
- Multer middleware for PDF resume uploads
- File storage strategy not yet implemented (would store files on disk or cloud storage)

### Build & Deployment

**Build Process**
- Custom build script (`script/build.ts`) using esbuild for server bundling
- Vite build for client-side static assets
- Server dependencies bundled for faster cold starts (allowlist approach)
- Output: `dist/index.cjs` for server, `dist/public/` for client assets

**Development vs Production**
- Development: Vite dev server with HMR, middleware mode integration with Express
- Production: Pre-built static assets served by Express with fallback to index.html
- Environment-based configuration (NODE_ENV detection)

### Code Organization

**Monorepo Structure**
- `/client` - Frontend React application
- `/server` - Backend Express application  
- `/shared` - Shared TypeScript types and schemas (Drizzle schemas, Zod validators)
- `/attached_assets` - Project documentation and build specifications

**Path Aliases**
- `@/*` maps to `client/src/*` for frontend imports
- `@shared/*` maps to `shared/*` for schema imports
- `@assets/*` maps to `attached_assets/*` for static files

## External Dependencies

### AI & Machine Learning
- **Google Gemini API** (@google/genai) - AI-powered resume analysis and optimization suggestions
- Purpose: Analyze student resumes against job descriptions, provide match scores, identify missing keywords, and generate improvement suggestions

### UI Component Libraries
- **Radix UI** - Comprehensive suite of unstyled, accessible React components
  - Dialog, Dropdown, Select, Toast, Tabs, and 20+ other primitives
  - Ensures WCAG compliance and keyboard navigation
- **shadcn/ui** - Pre-styled Radix components with Tailwind CSS
- **Lucide React** - Icon library for consistent iconography

### Utilities & Validation
- **Zod** - Schema validation for API requests and form data
- **drizzle-zod** - Automatic Zod schema generation from Drizzle schemas
- **React Hook Form** - Form state management with @hookform/resolvers for Zod integration
- **date-fns** - Date formatting and manipulation

### Backend Services
- **PostgreSQL** (pg driver) - Primary database via DATABASE_URL environment variable
- **bcrypt** - Password hashing for secure credential storage
- **jsonwebtoken** - JWT token generation and verification (planned)
- **Multer** - Multipart/form-data file upload handling for PDF resumes
- **Express Session** - Session management with connect-pg-simple for PostgreSQL session store

### Development Tools
- **Replit Plugins** - Development experience enhancements
  - vite-plugin-runtime-error-modal for error overlay
  - vite-plugin-cartographer for code navigation
  - vite-plugin-dev-banner for development indicators

### Styling & CSS
- **Tailwind CSS** - Utility-first CSS framework
- **class-variance-authority** - CVA for component variant management
- **tailwind-merge** & **clsx** - Conditional className utilities

### Type Safety
- TypeScript across entire codebase with strict mode enabled
- Shared types between client/server in `/shared` directory
- Drizzle ORM provides compile-time type safety for database operations