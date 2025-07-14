# NutriScan - Ingredient Research Platform

## Overview

NutriScan is a mobile-first web application that allows users to scan product barcodes, research ingredients, and engage in community discussions about food ingredients. The application features a modern stack with React frontend, Express backend, PostgreSQL database, and real-time communication via WebSockets.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 14, 2025)

✓ Complete PostgreSQL migration with working authentication system
✓ Fixed mobile camera permission issues for barcode scanner functionality  
✓ Enhanced mobile browser compatibility with proper permission prompts and error handling
✓ Implemented all core features: three-tab structure, community discussions, voting systems
✓ App is now production-ready and fully functional on mobile devices
✓ Added comprehensive README.md for GitHub repository
✓ Ready for GitHub integration and deployment

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Tailwind CSS with shadcn/ui components for consistent design
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First**: Responsive design optimized for mobile devices

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server for live updates
- **Authentication**: Firebase Auth with anonymous sign-in
- **Session Management**: Express sessions with PostgreSQL store

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL adapter
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Migrations**: Managed through Drizzle Kit
- **Schema Location**: Shared between client and server in `/shared/schema.ts`

## Key Components

### Core Entities
1. **Users**: Anonymous authentication with Firebase UID mapping
2. **Products**: Barcode-indexed product information with nutritional data
3. **Ingredients**: Detailed ingredient database with risk assessments
4. **Discussions**: Community-driven ingredient discussions
5. **Comments**: Threaded comment system with voting
6. **Bookmarks**: User-saved products and ingredients

### Frontend Components
- **Mobile Navigation**: Bottom tab navigation for mobile UX
- **Barcode Scanner**: Camera-based barcode scanning functionality
- **Product Details**: Comprehensive product information display
- **Ingredient Analysis**: Risk assessment and research display
- **Discussion Threads**: Real-time community discussions
- **User Profiles**: Anonymous user management

### Backend Services
- **Storage Layer**: Abstracted database operations interface
- **Real-time Updates**: WebSocket broadcasting for live features
- **API Routes**: RESTful endpoints for all data operations
- **Authentication**: Firebase integration with local user mapping

## Data Flow

### User Authentication
1. Anonymous Firebase authentication on first visit
2. Local user creation with generated username
3. Session management with PostgreSQL store
4. Real-time user identification via WebSocket

### Product Scanning
1. Camera-based barcode scanning
2. Product lookup by barcode
3. Ingredient extraction and analysis
4. Risk assessment display
5. Community discussion integration

### Community Features
1. Discussion creation and management
2. Real-time comment threading
3. Voting system for content quality
4. Moderation and flagging system
5. User reputation tracking

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations
- **Connection Pooling**: Built-in with Neon serverless

### Authentication
- **Firebase Auth**: Anonymous user authentication
- **Session Storage**: PostgreSQL-backed session management

### Frontend Libraries
- **React Query**: Server state management and caching
- **Tailwind CSS**: Utility-first styling framework
- **shadcn/ui**: Pre-built component library
- **Wouter**: Lightweight routing solution

### Real-time Communication
- **WebSocket**: Native WebSocket implementation
- **Broadcasting**: Server-side message broadcasting to connected clients

## Deployment Strategy

### Development
- **Local Development**: Node.js with TypeScript compilation
- **Hot Reload**: Vite HMR for frontend, tsx for backend
- **Database**: Neon development database instance

### Production Build
- **Frontend**: Vite build to static assets
- **Backend**: ESBuild bundling for Node.js deployment
- **Database**: Drizzle migrations for schema updates
- **Environment**: Production Neon database instance

### Architecture Benefits
1. **Type Safety**: Full TypeScript coverage across frontend and backend
2. **Real-time Features**: WebSocket integration for live updates
3. **Mobile Optimization**: PWA-ready with mobile-first design
4. **Scalable Database**: Serverless PostgreSQL with connection pooling
5. **Modern Stack**: Latest React patterns with server state management

The application is structured as a monorepo with clear separation between client, server, and shared code, enabling efficient development and deployment while maintaining type safety throughout the stack.