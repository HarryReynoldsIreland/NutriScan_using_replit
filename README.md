# NutriScan - Ingredient Research Platform

A mobile-first Progressive Web App that allows users to scan product barcodes to reveal detailed ingredient information with mandatory three-tab analysis (Research, News, Discussion) and robust community moderation.

## Features

### Core Functionality
- **Barcode Scanner**: Mobile-optimized camera-based scanning for iOS and Android
- **Product Analysis**: Comprehensive ingredient breakdown with risk assessment
- **Three-Tab Structure**: Mandatory Research, News, and Discussion tabs for every ingredient
- **Community Features**: User discussions, voting system, and comment threads
- **Mobile PWA**: Works on both Apple and Android devices

### Technical Stack
- **Frontend**: React 18 + TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server for live updates
- **Authentication**: Firebase Auth with anonymous sign-in
- **Build Tool**: Vite for development and production builds

### Database Schema
- Users with reputation system
- Products with barcode indexing
- Ingredients with detailed analysis
- Discussion threads with voting
- Research studies and news articles
- Moderation and activity tracking

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Firebase project (for authentication)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see below)
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

### Environment Variables
```
DATABASE_URL=your_postgresql_connection_string
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

## Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── pages/          # App pages/routes
│   ├── lib/            # Utilities and services
│   └── hooks/          # Custom React hooks
├── server/             # Express backend
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Database operations
│   └── db.ts           # Database connection
├── shared/             # Shared types and schemas
│   └── schema.ts       # Database schema definitions
└── package.json        # Dependencies and scripts
```

## Key Features Implementation

### Mobile Barcode Scanner
- Camera permission handling for iOS/Android
- Real-time barcode detection
- Error handling and fallback states
- Sample barcode generation for testing

### Three-Tab Ingredient Analysis
- **Research Tab**: Academic studies and scientific papers
- **News Tab**: Current articles and industry news  
- **Discussion Tab**: Community conversations and expert opinions

### Community Moderation
- User reputation system
- Content voting (upvote/downvote)
- Moderation flags and reporting
- Anti-troll measures

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

### Mobile Testing
The app is optimized for mobile browsers and works on:
- iOS Safari
- Android Chrome
- Progressive Web App installation

## Production Deployment

The app is production-ready with:
- Optimized Vite build
- PostgreSQL database integration
- Mobile-responsive design
- Real-time WebSocket features
- Secure authentication flow

## License

MIT License - see LICENSE file for details.