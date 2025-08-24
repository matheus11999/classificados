# Overview

This is a comprehensive Progressive Web App (PWA) for regional classifieds, similar to Craigslist or Facebook Marketplace. The application allows users to post, browse, and interact with classified advertisements in their local region. Built with a modern tech stack, it features a React frontend with a Node.js/Express backend, utilizing PostgreSQL for data persistence and implementing PWA capabilities for mobile-first experience.

The app focuses on connecting local buyers and sellers through WhatsApp integration, providing a seamless way to browse products and services while maintaining direct communication between users. It includes user authentication, ad management, favorites system, and a mobile-optimized interface with dark/light theme support.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **PWA Implementation**: Service worker and manifest.json for offline capabilities and app installation
- **Theme System**: Custom dark/light mode toggle with localStorage persistence and system preference detection

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration using OpenID Connect with passport.js
- **Session Management**: Express sessions with PostgreSQL store using connect-pg-simple
- **API Design**: RESTful API endpoints with proper error handling and validation using Zod schemas

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless connection
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Session Storage**: PostgreSQL table for session persistence
- **Core Entities**: Users, ads, categories, and favorites with proper foreign key relationships

## Authentication and Authorization
- **Provider**: Replit Auth (OpenID Connect) for seamless user onboarding
- **Session Strategy**: Server-side sessions with PostgreSQL persistence
- **Middleware**: Custom authentication middleware for protected routes
- **User Management**: Automatic user creation/updates on login with profile information sync

## Mobile-First Design
- **Responsive Layout**: Mobile-first approach with Tailwind CSS breakpoints
- **Bottom Navigation**: Fixed footer navigation mimicking native mobile apps
- **Touch Optimizations**: Large touch targets and smooth animations
- **PWA Features**: App manifest, service worker, and offline functionality

## Key Features Architecture
- **Ad Management**: CRUD operations for classified ads with image support and categorization
- **Search and Filtering**: Category-based filtering and location-based search capabilities
- **Favorites System**: User-specific favorite ads with toggle functionality
- **WhatsApp Integration**: Direct contact buttons linking to WhatsApp with pre-formatted messages
- **Real-time Updates**: Query invalidation and optimistic updates for responsive user experience

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection for scalable data storage
- **drizzle-orm**: Modern TypeScript ORM for type-safe database operations and schema management
- **@tanstack/react-query**: Server state management with caching, background updates, and optimistic updates

## UI and Component Libraries
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives for building the component system
- **tailwindcss**: Utility-first CSS framework for rapid UI development and responsive design
- **class-variance-authority**: Type-safe variant API for component styling
- **clsx & tailwind-merge**: Conditional class name utilities for dynamic styling

## Authentication and Session Management
- **openid-client**: OpenID Connect client for Replit Auth integration
- **passport**: Authentication middleware for Express.js
- **connect-pg-simple**: PostgreSQL session store for persistent user sessions
- **express-session**: Session middleware for user state management

## Form Handling and Validation
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for react-hook-form
- **zod**: TypeScript-first schema validation for runtime type checking
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation

## Development and Build Tools
- **vite**: Fast build tool and development server with hot module replacement
- **@vitejs/plugin-react**: React support for Vite with Fast Refresh
- **typescript**: Static type checking for enhanced developer experience
- **esbuild**: Fast JavaScript bundler for production builds

## Utility Libraries
- **date-fns**: Modern date utility library with locale support for timestamp formatting
- **nanoid**: URL-safe unique string ID generator for secure identifiers
- **memoizee**: Function memoization for performance optimization