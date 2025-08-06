// Magic UI Components - AVIBAQ Enhanced Edition
// Centralized exports for all Magic UI components

// Core Layout Components
export { default as EnhancedDashboardLayout } from './enhanced-dashboard-layout';
export { default as EnhancedSidebar } from './enhanced-sidebar';

// Navigation Components
export { default as AnimatedBreadcrumbs } from './animated-breadcrumbs';

// Card Components
export { default as EnhancedKpiCard } from './enhanced-kpi-card';
export { MagicCard } from './magic-card';
export { BentoGrid, BentoGridItem } from './bento-grid';

// Animation Components
export { default as NumberTicker } from './number-ticker';
export { AnimatedBeam } from './animated-beam';
export { default as AnimatedCircularProgress } from './animated-circular-progress';

// Chart Components
export { default as AnimatedChart } from './animated-chart';

// Loading Components
export { default as LoadingSkeleton } from './loading-skeleton';

// Transition Components
export {
  PageTransition,
  ModalTransition,
  SlideTransition,
  FadeTransition,
  StaggerContainer,
  StaggerItem,
  ScaleTransition
} from './smooth-transitions';

// Design System
export { designTokens, getColor, getShadow, getSpacing, componentThemes } from '../../lib/design-tokens';

// Type definitions
export interface MagicUIProps {
  className?: string;
  children?: React.ReactNode;
}

export interface AnimationProps extends MagicUIProps {
  delay?: number;
  duration?: number;
  ease?: string;
}