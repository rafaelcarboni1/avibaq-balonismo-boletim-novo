// Design tokens harmonizados com a identidade AVIBAQ
export const designTokens = {
  colors: {
    // Cores primárias AVIBAQ
    primary: {
      50: '#f0f4ff',
      100: '#e0e7ff',
      500: '#0A1128', // Primary AVIBAQ
      600: '#142043', // Primary2 AVIBAQ
      900: '#0f172a',
    },
    
    // Cores de bandeira meteorológica
    bandeira: {
      verde: {
        50: '#f0fdf4',
        100: '#dcfce7',
        500: '#3AA655', // Accent AVIBAQ
        600: '#16a34a',
        700: '#15803d',
      },
      amarela: {
        50: '#fefce8',
        100: '#fef3c7',
        500: '#FFCC00', // Warning AVIBAQ
        600: '#eab308',
        700: '#ca8a04',
      },
      vermelha: {
        50: '#fef2f2',
        100: '#fee2e2',
        500: '#D00000', // Danger AVIBAQ
        600: '#dc2626',
        700: '#b91c1c',
      },
    },
    
    // Cores neutras suaves
    neutral: {
      50: '#F5F7FA', // bgSoft AVIBAQ
      100: '#f8fafc',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Cores funcionais
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    }
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #0A1128 0%, #142043 100%)',
    success: 'linear-gradient(135deg, #3AA655 0%, #16a34a 100%)',
    warning: 'linear-gradient(135deg, #FFCC00 0%, #eab308 100%)',
    danger: 'linear-gradient(135deg, #D00000 0%, #dc2626 100%)',
    soft: 'linear-gradient(135deg, #F5F7FA 0%, #ffffff 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    glow: {
      primary: '0 0 20px rgba(10, 17, 40, 0.3)',
      success: '0 0 20px rgba(58, 166, 85, 0.3)',
      warning: '0 0 20px rgba(255, 204, 0, 0.3)',
      danger: '0 0 20px rgba(208, 0, 0, 0.3)',
    }
  },
  
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
  },
  
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  },
  
  animation: {
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.5s',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }
  }
};

// Utility functions for using design tokens
export const getColor = (path: string) => {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || path;
};

export const getShadow = (type: keyof typeof designTokens.shadows) => {
  return designTokens.shadows[type];
};

export const getSpacing = (size: keyof typeof designTokens.spacing) => {
  return designTokens.spacing[size];
};

// Theme configuration for components
export const componentThemes = {
  card: {
    background: 'rgba(255, 255, 255, 0.9)',
    border: designTokens.colors.neutral[200],
    shadow: designTokens.shadows.md,
    radius: designTokens.borderRadius.xl,
  },
  
  button: {
    primary: {
      background: designTokens.gradients.primary,
      text: '#ffffff',
      shadow: designTokens.shadows.glow.primary,
    },
    success: {
      background: designTokens.gradients.success,
      text: '#ffffff',
      shadow: designTokens.shadows.glow.success,
    },
  },
  
  input: {
    background: 'rgba(255, 255, 255, 0.8)',
    border: designTokens.colors.neutral[300],
    focus: designTokens.colors.primary[500],
    radius: designTokens.borderRadius.lg,
  }
};