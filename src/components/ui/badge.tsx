/**
 * Badge Component - Trading Orchestrator Design System
 * Status indicators, labels, and trading direction badges
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'border-transparent bg-neutral-200 text-neutral-900 hover:bg-neutral-300',
        destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
        success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
        warning: 'border-transparent bg-amber-500 text-white hover:bg-amber-600',
        outline: 'border-neutral-200 text-foreground hover:bg-neutral-100',
        
        // Trading specific variants
        long: 'border-transparent bg-green-500 text-white hover:bg-green-600 shadow-sm shadow-green-500/25',
        short: 'border-transparent bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/25',
        neutral: 'border-transparent bg-slate-500 text-white hover:bg-slate-600',
        
        // Signal strength variants
        strong: 'border-transparent bg-purple-500 text-white hover:bg-purple-600 shadow-sm shadow-purple-500/25',
        moderate: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',
        weak: 'border-transparent bg-gray-500 text-white hover:bg-gray-600',
        
        // Status variants
        active: 'border-transparent bg-green-100 text-green-800 border-green-200',
        inactive: 'border-transparent bg-gray-100 text-gray-800 border-gray-200',
        pending: 'border-transparent bg-yellow-100 text-yellow-800 border-yellow-200',
        error: 'border-transparent bg-red-100 text-red-800 border-red-200',
        
        // Performance variants  
        profit: 'border-transparent bg-green-100 text-green-900 border-green-300',
        loss: 'border-transparent bg-red-100 text-red-900 border-red-300',
        breakeven: 'border-transparent bg-gray-100 text-gray-900 border-gray-300',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
        xl: 'px-4 py-1.5 text-base',
      },
      animated: {
        true: 'animate-pulse',
        false: '',
      },
      withIcon: {
        true: 'gap-1',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animated: false,
      withIcon: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  pulse?: boolean;
}

function Badge({
  className,
  variant,
  size,
  animated,
  withIcon,
  icon,
  pulse,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ 
          variant, 
          size, 
          animated: animated || pulse, 
          withIcon: withIcon || !!icon 
        }),
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </div>
  );
}

// Trading direction badges with icons
export const LongBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant' | 'icon'>>(
  ({ children = 'LONG', ...props }, ref) => (
    <Badge 
      ref={ref} 
      variant="long" 
      icon={<TrendingUp className="h-3 w-3" />} 
      withIcon 
      {...props}
    >
      {children}
    </Badge>
  )
);

export const ShortBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant' | 'icon'>>(
  ({ children = 'SHORT', ...props }, ref) => (
    <Badge 
      ref={ref} 
      variant="short" 
      icon={<TrendingDown className="h-3 w-3" />} 
      withIcon 
      {...props}
    >
      {children}
    </Badge>
  )
);

export const NeutralBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant' | 'icon'>>(
  ({ children = 'NEUTRAL', ...props }, ref) => (
    <Badge 
      ref={ref} 
      variant="neutral" 
      icon={<Minus className="h-3 w-3" />} 
      withIcon 
      {...props}
    >
      {children}
    </Badge>
  )
);

// Signal strength badges
export const StrongBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant'>>(
  ({ children = 'STRONG', ...props }, ref) => (
    <Badge ref={ref} variant="strong" {...props}>
      {children}
    </Badge>
  )
);

export const ModerateBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant'>>(
  ({ children = 'MODERATE', ...props }, ref) => (
    <Badge ref={ref} variant="moderate" {...props}>
      {children}
    </Badge>
  )
);

export const WeakBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant'>>(
  ({ children = 'WEAK', ...props }, ref) => (
    <Badge ref={ref} variant="weak" {...props}>
      {children}
    </Badge>
  )
);

// Performance badges with colors
export const ProfitBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant'>>(
  (props, ref) => <Badge ref={ref} variant="profit" {...props} />
);

export const LossBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant'>>(
  (props, ref) => <Badge ref={ref} variant="loss" {...props} />
);

export const BreakevenBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant'>>(
  (props, ref) => <Badge ref={ref} variant="breakeven" {...props} />
);

// Status badges
export const ActiveBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant'>>(
  ({ children = 'Active', ...props }, ref) => (
    <Badge ref={ref} variant="active" {...props}>
      {children}
    </Badge>
  )
);

export const InactiveBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant'>>(
  ({ children = 'Inactive', ...props }, ref) => (
    <Badge ref={ref} variant="inactive" {...props}>
      {children}
    </Badge>
  )
);

export const PendingBadge = React.forwardRef<HTMLDivElement, Omit<BadgeProps, 'variant'>>(
  ({ children = 'Pending', ...props }, ref) => (
    <Badge ref={ref} variant="pending" pulse {...props}>
      {children}
    </Badge>
  )
);

LongBadge.displayName = 'LongBadge';
ShortBadge.displayName = 'ShortBadge';
NeutralBadge.displayName = 'NeutralBadge';
StrongBadge.displayName = 'StrongBadge';
ModerateBadge.displayName = 'ModerateBadge';
WeakBadge.displayName = 'WeakBadge';
ProfitBadge.displayName = 'ProfitBadge';
LossBadge.displayName = 'LossBadge';
BreakevenBadge.displayName = 'BreakevenBadge';
ActiveBadge.displayName = 'ActiveBadge';
InactiveBadge.displayName = 'InactiveBadge';
PendingBadge.displayName = 'PendingBadge';

export { Badge, badgeVariants };