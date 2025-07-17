# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AVIBAQ (Associação de Pilotos e Empresas de Balonismo) is a Next.js 14 application for managing meteorological bulletins and flight operations for the balloon association in Praia Grande/SC. The system serves pilots, agencies, and administrators with different interfaces and capabilities.

## Development Commands

```bash
# Development server
npm run dev

# Production build and start
npm run build
npm run start

# Code linting
npm run lint

# Database migrations (Supabase)
npx supabase migration new <name>
npx supabase db push

# Generate TypeScript types from database
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, Radix UI, shadcn/ui
- **State Management**: React Query (TanStack Query) for server state
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Hybrid system (Supabase Auth + custom users table)
- **Email**: Resend for automated bulletin distribution
- **Animations**: Framer Motion with custom Magic UI components

### Core User Types and Flows
- **Public Users**: View bulletins, register as members
- **Pilots**: Manage balloons, flight planning, safety checklists, post-flight reporting
- **Agencies**: Fleet management, pilot relationships, flight planning
- **Administrators**: Full system access, bulletin creation, member management

### Database Schema
Key tables include:
- `membros` - Members with status tracking and document uploads
- `users` - Authentication and role management (admin, meteo, tesouraria, pilot, agency)
- `boletins` - Meteorological bulletins with media attachments
- `voos` - Flight records with comprehensive tracking
- `baloes` - Balloon registry with ownership
- `vinculos_agencia_piloto` - Agency-pilot relationships
- `checklist_itens` - Pre-flight safety checklists

### Page Structure
```
/pages/
├── index.tsx                 # Public landing page
├── admin/                    # Administrative interface
│   ├── dashboard.tsx         # Advanced dashboard with KPIs
│   ├── boletins/             # Bulletin management
│   └── associados.tsx        # Member management
├── piloto/                   # Pilot interface
│   ├── dashboard.tsx         # Pilot dashboard
│   ├── meus-baloes.tsx       # Balloon management
│   ├── planejamento.tsx      # Flight planning
│   ├── checklist/[id].tsx    # Safety checklists
│   └── pos-voo/[id].tsx      # Post-flight reporting
├── agencia/                  # Agency interface
│   ├── dashboard.tsx         # Agency dashboard
│   ├── frota.tsx             # Fleet management
│   └── pilotos.tsx           # Pilot relationships
└── api/                      # API endpoints
```

## Key Features

### Meteorological Bulletin System
- Daily weather bulletins with color-coded flags (green, yellow, red)
- Audio recordings and photo attachments support
- Automated email distribution at 22:00 (Brasília time)
- Public display with historical archives

### Flight Operations
- Multi-balloon flight planning and tracking
- Three-phase safety checklists (pre-flight, in-flight, post-flight)
- Post-flight reporting with photo/video attachments
- Agency-pilot relationship management

### Magic UI Implementation
The system includes custom animated components in `src/components/magicui/`:
- Enhanced sidebars with smooth animations
- Animated KPI cards with number tickers
- Bento grid layouts for modern dashboards
- Advanced charts with smooth transitions
- Loading skeletons for better UX

## Development Patterns

### Authentication & Security
- Uses hybrid authentication (Supabase Auth + custom users table)
- Row Level Security (RLS) policies enforce data isolation
- Role-based access control throughout the application
- Custom hook `useUser` for authentication state management

### Data Management
- React Query for server state management
- Supabase client in `src/integrations/supabase/`
- Type-safe database operations with generated TypeScript types
- Optimistic updates for better UX

### Component Architecture
- Base UI components in `src/components/ui/` (shadcn/ui)
- Business logic components in `src/components/`
- Custom hooks in `src/hooks/`
- Utility functions in `src/helpers/`

## Environment Variables

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
```

## Progressive Web App Features

The system includes PWA capabilities:
- Service worker for offline functionality
- Offline data synchronization via `dados_offline` table
- Local storage for critical data
- Mobile-responsive design optimized for field use

## Common Development Tasks

### Adding New Database Tables
1. Create migration: `npx supabase migration new add_table_name`
2. Write SQL in the migration file
3. Apply migration: `npx supabase db push`
4. Regenerate types: `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`

### Working with Authentication
- Use `useUser` hook for authentication state
- Check user roles with `user.role` (admin, meteo, tesouraria, pilot, agency)
- Implement role-based access control in components
- RLS policies handle database-level security

### Email System
- Automated bulletin distribution uses Resend API
- Email templates in `src/helpers/email/`
- Scheduled emails via cron job or manual triggers

## Important Files

- `src/hooks/useUser.ts` - Main authentication hook
- `src/integrations/supabase/` - Database integration
- `src/components/magicui/` - Enhanced UI components
- `supabase/migrations/` - Database schema changes
- `pages/api/` - API endpoints for external integrations

## Security Considerations

- All user data is protected by Row Level Security policies
- File uploads are validated for type and size
- LGPD compliance implemented for data protection
- Audit logging in `logs_atividade` table for critical operations

## AI Collaboration

When encountering complex problems or debugging issues:

1. **Use Gemini CLI MCP** for collaborative problem-solving:
   - `mcp__gemini-cli__ask-gemini` for analysis and debate
   - Include relevant files with @file syntax for context
   - Engage in back-and-forth discussion to reach optimal solutions
   - This approach conserves Claude Code tokens while leveraging multiple AI perspectives

2. **Best practices for AI collaboration**:
   - Start with Gemini for initial analysis of complex issues
   - Use changeMode for structured code suggestions
   - Test solutions in sandbox mode when appropriate
   - Document findings for future reference