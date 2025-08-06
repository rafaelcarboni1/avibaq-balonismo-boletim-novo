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
- **Push Notifications**: Web Push API with VAPID for real-time notifications
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
- `push_subscriptions` - Web push notification subscriptions
- `push_notifications` - Notification history and tracking
- `dados_offline` - Offline synchronization queue (offline-first architecture)
- `vinculos_agencia_piloto` - Agency-pilot relationships management
- `voos_anexos` - Flight attachments (photos, track logs, documents)
- `voos_baloes` - Flight-balloon associations (many-to-many)
- `user_permissions` - Granular user-specific permissions
- `permission_audit_log` - Permission changes audit trail

### Page Structure
```
/pages/
├── index.tsx                 # Public landing page
├── admin/                    # Administrative interface
│   ├── dashboard.tsx         # Advanced dashboard with KPIs
│   ├── boletins/             # Bulletin management
│   ├── associados.tsx        # Member management
│   └── push-center.tsx       # Push notification management
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

### Flight Operations (Complete Module - 91% Implemented)
- **Flight Planning**: Multi-balloon flight planning with comprehensive tracking
- **Safety Checklists**: Three-block checklist system (AVIBAQ-specific safety items)
  - Block 1: Pre-flight equipment and weather verification
  - Block 2: In-flight operations and monitoring
  - Block 3: Post-flight shutdown and documentation
- **Flight Management**: Complete workflow from planning through documentation
- **Agency-Pilot Relations**: Fleet management and pilot assignment system
- **Balloon Equipment**: Full balloon registry with ownership tracking
- **Offline Operations**: PWA functionality for field operations without internet
- **File Attachments**: Photo/video uploads with RLS security policies

### Push Notifications System
- **Web Push API**: VAPID-based real-time notifications
- **Admin Interface**: Push notification center for administrators (`pages/admin/push-center.tsx`)
- **User Management**: Subscription handling and user preferences
- **Notification Types**: Bulletin alerts, flight reminders, system updates
- **Analytics**: Click tracking and engagement metrics

### Magic UI Implementation
The system includes custom animated components in `src/components/magicui/`:
- Enhanced sidebars with smooth animations
- Animated KPI cards with number tickers
- Bento grid layouts for modern dashboards
- Advanced charts with smooth transitions
- Loading skeletons for better UX
- Complete design system with performance optimizations

## Development Patterns

### Authentication & Security
- **Hybrid Authentication**: Supabase Auth + custom users table for role management
- **Granular Permissions**: User-specific permissions beyond role-based access
- **Row Level Security**: Complex RLS policies with helper functions
- **Authentication Flow**: Email-based user linking with fallback mechanisms
- **Security Features**: File upload validation, LGPD compliance, audit logging
- **Custom Hooks**: `useUser` for authentication state, `usePermissions` for access control

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
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
NEXT_PUBLIC_PWA_ENABLED=true
```

## Progressive Web App Features

The system includes advanced PWA capabilities:
- **Service Worker**: `public/sw.js` for offline functionality and caching
- **Offline Sync**: Complete data synchronization via `dados_offline` table
- **Background Sync**: Automatic data sync when connection returns
- **File Handlers**: Support for image/PDF/GPX files
- **Share Targets**: Receive shared content from other apps
- **Protocol Handlers**: Custom `web+avibaq` protocol support
- **Push Messaging**: Real-time notifications even when app is closed
- **Field Operations**: Mobile-optimized for balloon operations without internet

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

### Push Notification Development
- Generate VAPID keys: `web-push generate-vapid-keys`
- Test notifications via admin interface
- Subscription management in `push_subscriptions` table
- Analytics tracking via `push_notification_clicks`

### Flight Module Development
- Complete 3-block checklist system implementation
- Agency-pilot relationship management
- Offline sync for field operations
- File upload with RLS security policies

### Database Security and Debugging

**⚠️ CRITICAL SECURITY ALERT:**
- Tables `voos` and `permissoes` have RLS DISABLED
- Anyone with anonymous API key can perform CRUD operations
- Enable RLS immediately: `ALTER TABLE voos ENABLE ROW LEVEL SECURITY;`

**Debug Commands:**
```sql
-- Check user permissions
SELECT * FROM get_user_combined_permissions('user-uuid');

-- Debug pilot access to flight
SELECT debug_pilot_access('pilot-uuid', 'flight-uuid');

-- View synchronization problems
SELECT * FROM vw_problemas_sincronizacao;

-- Process offline sync queue
SELECT processar_fila_sincronizacao();

-- Check flight checklist progress
SELECT * FROM vw_checklist_progresso WHERE voo_id = 'flight-uuid';
```

## Important Files

- `src/hooks/useUser.ts` - Main authentication hook
- `src/hooks/useOfflineSync.ts` - PWA offline synchronization
- `src/integrations/supabase/` - Database integration
- `src/components/magicui/` - Enhanced UI components
- `src/components/PushNotificationManager.tsx` - PWA notifications
- `pages/admin/push-center.tsx` - Push notification management
- `public/sw.js` - Service worker for PWA functionality
- `supabase/migrations/` - Database schema changes
- `pages/api/push/` - Push notification API endpoints
- `pages/api/voos/` - Flight management API endpoints
- `docs/` - Comprehensive documentation and troubleshooting guides
- `docs/SUPABASE_DATABASE_ARCHITECTURE.md` - **Complete database documentation**
- `docs/supabase_schema/` - Raw Supabase dashboard exports and schema

## Security Considerations

**⚠️ CRITICAL VULNERABILITIES (ACTION REQUIRED):**
- Tables `voos` and `permissoes` have RLS DISABLED - immediate security risk
- Anyone with anonymous API key can perform unrestricted CRUD operations
- Must enable RLS and create appropriate policies immediately

**Security Features Implemented:**
- Hybrid authentication system (Supabase Auth + custom users table)
- Granular permission system with role-based and user-specific permissions
- Row Level Security (RLS) policies on most sensitive tables
- File upload validation for type and size
- LGPD compliance implemented for data protection
- Comprehensive audit logging in `logs_atividade` and `permission_audit_log`
- Push notification security with VAPID keys
- Offline data encryption and secure synchronization

## Development Rules and Guidelines

**IMPORTANT**: Always follow the guidelines in `docs/regras-gerais.md`:
- Use "Vibe Coding" approach - collaborative dialogue before coding
- Apply contextual intelligence - break rules when justified
- Prioritize user value over code perfection
- Document exceptions clearly with justification
- Use incremental development (MVP first, iterate based on feedback)
- Apply security-first principles and LGPD compliance
- Follow established patterns and conventions in the codebase

**Debugging Protocol**: When entering debug mode:
- Form 2-7 hypotheses proportional to problem complexity  
- Use parallel investigation when possible
- Add temporary console logs with `[DEBUG]` prefix
- Document root cause and solution
- Clean up debug logs after resolution

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
   - Follow the collaborative "Vibe Coding" approach from regras-gerais.md

## Documentation Maintenance

**⚠️ CRITICAL:** This documentation must be kept up-to-date as the project evolves.

**When to Update CLAUDE.md:**
- Database schema changes (new tables, columns, relationships)
- New API endpoints or significant functionality
- Security policy changes or RLS updates
- New environment variables or configuration
- Major architectural changes

**How to Update:**
1. Update `docs/SUPABASE_DATABASE_ARCHITECTURE.md` first for database changes
2. Sync changes to CLAUDE.md sections
3. Test that all commands and examples still work
4. Update "Last Updated" timestamp in documentation

**Key Files to Monitor:**
- Supabase migrations in `supabase/migrations/`
- Environment variables in `.env` files
- API changes in `pages/api/`
- New hooks, components, or utilities

**Documentation Review Schedule:**
- After each major feature implementation
- Before production deployments
- Monthly review of accuracy and completeness