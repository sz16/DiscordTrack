# Overview

This is a Discord server activity monitoring and member engagement management system. The application tracks Discord member activity (messages and voice interactions), identifies inactive users, and sends automated reminder messages to encourage re-engagement. It features a modern React dashboard for monitoring member statistics, viewing recent activity, and managing bot settings with the ability to manually send reminders to specific members.

**Status**: Fully operational Discord bot with multi-page dashboard. Always-on monitoring with User Activity, Activity Logs, and Reminders pages.
**Last Updated**: August 10, 2025

## Recent Changes
- ✓ Removed monitoring toggle - system now monitors continuously
- ✓ Added User Activity page with member search and filtering
- ✓ Added Activity Logs page with real-time activity feed  
- ✓ Added Reminders page with manual and bulk reminder management
- ✓ Created token management file (tokens.txt) for easier access
- ✓ Updated navigation with proper routing and active states
- ✓ Enhanced multi-server separation architecture

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses **React 18** with **TypeScript** in a single-page application architecture. The frontend leverages **Vite** as the build tool and development server, with **Wouter** for lightweight client-side routing. The UI is built with **shadcn/ui components** on top of **Radix UI primitives** and styled with **TailwindCSS**. State management is handled through **TanStack Query (React Query)** for server state management and caching, eliminating the need for additional global state management solutions.

**Component Structure**: The application follows a component-based architecture with reusable UI components located in `/client/src/components/ui/` and feature-specific components in `/client/src/components/`. The main dashboard aggregates multiple components including activity tables, statistics cards, recent activity feeds, and settings modals.

## Backend Architecture
The server uses **Express.js** with **TypeScript** in an ESM (ES Modules) configuration. The application follows a service-oriented architecture with clear separation of concerns:

- **Storage Layer**: Implements an interface-based storage pattern (`IStorage`) with an in-memory implementation (`MemStorage`) for development, designed to be easily replaceable with a database implementation
- **Service Layer**: Contains business logic services including `DiscordBot`, `ActivityTracker`, and `ReminderService`
- **API Layer**: RESTful endpoints organized in `/server/routes.ts` handling bot management, member data, and reminder operations

**Discord Integration**: The bot uses **Discord.js v14** with Gateway intents for guilds, members, messages, and voice states. It tracks real-time user activity and manages automated reminder scheduling.

## Data Storage Solutions
The application uses **Drizzle ORM** configured for **PostgreSQL** with schema definitions in `/shared/schema.ts`. The database schema includes tables for users, Discord members, activities, reminders, and bot settings. The current implementation includes a memory-based storage adapter for development, with the production setup designed to use **Neon Database** (PostgreSQL-compatible serverless database) as indicated by the `@neondatabase/serverless` dependency.

**Schema Design**: The database models user activity tracking with timestamped events, member status management, and configurable reminder settings with cooldown periods to prevent spam.

## Authentication and Authorization
The current implementation does not include authentication mechanisms, suggesting this is designed for internal/private use or as a foundation for adding authentication later. The bot uses Discord token-based authentication for API access.

## External Dependencies

**Database**: Neon Database (PostgreSQL-compatible serverless database)
**Discord API**: Discord.js for bot functionality and real-time event handling
**UI Framework**: Radix UI primitives with shadcn/ui component system
**Styling**: TailwindCSS with CSS custom properties for theming
**Development Tools**: Vite for frontend tooling, ESBuild for backend compilation
**Type Safety**: Full TypeScript implementation across frontend, backend, and shared schemas
**State Management**: TanStack Query for server state and API caching
**Form Handling**: React Hook Form with Zod validation through Drizzle-Zod integration