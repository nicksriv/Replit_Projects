# Overview

This is a comprehensive online learning platform built as a full-stack web application. The platform enables instructors to create and manage courses, track revenue and payouts, manage learners, assess skills, run marketing campaigns, and analyze performance through detailed reports. The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and Drizzle ORM for database operations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **Form Handling**: React Hook Form with Zod validation for robust form management
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful APIs with comprehensive CRUD operations
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Logging**: Custom request/response logging for API monitoring

## Database Layer
- **Database**: PostgreSQL for reliable relational data storage
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema updates
- **Connection**: Neon serverless PostgreSQL for cloud hosting
- **Session Storage**: connect-pg-simple for PostgreSQL-backed session management

## Core Data Models
The platform manages several interconnected entities:
- **Users**: Students, instructors, and administrators with role-based access
- **Courses**: Content management with pricing, categorization, and publishing status
- **Enrollments**: Student-course relationships with progress tracking
- **Revenue/Payouts**: Financial tracking and instructor compensation
- **Skills Assessment**: Competency tracking and progress evaluation
- **Marketing**: Campaign management, promotional codes, and analytics
- **Support**: Help documentation, FAQs, and ticket management
- **Settings**: User preferences, notifications, and privacy controls

## Component Architecture
- **UI Components**: Reusable shadcn/ui components with consistent theming
- **Page Components**: Feature-specific pages with dedicated responsibilities
- **Section Components**: Modular dashboard sections for maintainable code
- **Form Components**: Validated forms with error handling and submission states

## Development Workflow
- **Hot Reload**: Vite development server with instant updates
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Path Aliases**: Organized imports with @ aliases for clean code structure
- **Error Boundaries**: Runtime error handling with user-friendly displays

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Platform**: Development and deployment environment with integrated tooling

## Frontend Libraries
- **React Ecosystem**: React 18, React DOM, React Hook Form for UI framework
- **Routing & State**: Wouter for routing, TanStack Query for server state
- **UI Framework**: Radix UI primitives with shadcn/ui component system
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **Charts**: Recharts for data visualization and analytics
- **Date Handling**: date-fns for date manipulation and formatting
- **Utilities**: clsx and class-variance-authority for conditional styling

## Backend Dependencies
- **Web Framework**: Express.js with middleware for routing and request handling
- **Database**: Drizzle ORM with PostgreSQL driver for type-safe data access
- **Validation**: Zod for runtime type checking and data validation
- **Session Management**: express-session with PostgreSQL store
- **Development**: tsx for TypeScript execution, esbuild for production builds

## Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Code Quality**: TypeScript compiler with strict mode enabled
- **Error Handling**: Replit-specific error overlay for development debugging
- **Asset Management**: Vite asset handling with alias resolution