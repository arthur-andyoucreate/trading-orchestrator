/**
 * Progress Component - Trading Orchestrator Design System
 * For portfolio heat, confidence levels, risk gauges
 */

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressVariants = cva(
  'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
  {
    variants: {
      variant: {
        default: 'bg-neutral-200',
        success: 'bg-green-100',
        warning: 'bg-amber-100', 
        danger: 'bg-red-100',
        info: 'bg-blue-100',
        
        // Trading specific
        heat: 'bg-neutral-200', // Portfolio heat meter
        confidence: 'bg-blue-100', // Signal confidence
        risk: 'bg-red-100', // Risk level
        performance: 'bg-green-100', // Performance meter
      },
      size: {
        sm: 'h-2',
        default: 'h-4',
        lg: 'h-6',
        xl: 'h-8',
      },
      animated: {
        true: 'transition-all duration-500 ease-in-out',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animated: true,
    },
  }
);

const progressFillVariants = cva(
  'h-full w-full flex-1 transition-all duration-500 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-amber-500',
        danger: 'bg-red-500',
        info: 'bg-blue-500',
        heat: 'bg-gradient-to-r from-green-500 via-amber-500 to-red-500',
        confidence: 'bg-gradient-to-r from-red-300 via-amber-400 to-green-500',
        risk: 'bg-gradient-to-r from-green-500 via-amber-500 to-red-600',
        performance: 'bg-gradient-to-r from-red-400 via-neutral-400 to-green-500',
      },
      glow: {
        true: 'shadow-lg',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      glow: false,
    },
  }
);

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  showValue?: boolean;
  showPercentage?: boolean;
  label?: string;
  glow?: boolean;
  formatValue?: (value: number, max: number) => string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value = 0, 
  max = 100,
  variant,
  size,
  animated,
  showValue,
  showPercentage,
  label,
  glow,
  formatValue,
  ...props 
}, ref) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  // Auto-select fill variant based on progress variant or value
  const getFillVariant = () => {
    if (variant === 'heat' || variant === 'confidence' || variant === 'risk' || variant === 'performance') {
      return variant;
    }
    
    // Auto color based on percentage
    if (percentage >= 80) return 'danger';
    if (percentage >= 60) return 'warning';
    if (percentage >= 40) return 'info';
    return 'success';
  };

  const displayValue = formatValue ? formatValue(value, max) : value;

  return (
    <div className="w-full space-y-2">
      {(label || showValue || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-neutral-700">{label}</span>}
          {(showValue || showPercentage) && (
            <span className="text-neutral-500">
              {showValue && displayValue}
              {showValue && showPercentage && ' '}
              {showPercentage && `(${percentage.toFixed(1)}%)`}
            </span>
          )}
        </div>
      )}
      
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressVariants({ variant, size, animated }), className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            progressFillVariants({ variant: getFillVariant(), glow }),
            glow && {
              'shadow-green-500/50': percentage <= 40,
              'shadow-blue-500/50': percentage > 40 && percentage < 60,
              'shadow-amber-500/50': percentage >= 60 && percentage < 80,
              'shadow-red-500/50': percentage >= 80,
            }
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
});

Progress.displayName = ProgressPrimitive.Root.displayName;

// Trading specific progress components

export const HeatMeter = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  Omit<ProgressProps, 'variant'>
>(({ label = 'Portfolio Heat', showPercentage = true, glow = true, ...props }, ref) => (
  <Progress
    ref={ref}
    variant="heat"
    label={label}
    showPercentage={showPercentage}
    glow={glow}
    {...props}
  />
));

export const ConfidenceMeter = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  Omit<ProgressProps, 'variant'>
>(({ label = 'Signal Confidence', showPercentage = true, ...props }, ref) => (
  <Progress
    ref={ref}
    variant="confidence"
    label={label}
    showPercentage={showPercentage}
    {...props}
  />
));

export const RiskGauge = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  Omit<ProgressProps, 'variant'>
>(({ label = 'Risk Level', showPercentage = true, glow = true, ...props }, ref) => (
  <Progress
    ref={ref}
    variant="risk"
    label={label}
    showPercentage={showPercentage}
    glow={glow}
    {...props}
  />
));

export const PerformanceMeter = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  Omit<ProgressProps, 'variant', 'formatValue'>
>(({ label = 'Performance', showValue = true, max = 200, value = 100, ...props }, ref) => (
  <Progress
    ref={ref}
    variant="performance"
    label={label}
    showValue={showValue}
    max={max}
    value={value}
    formatValue={(val, maxVal) => {
      const percentage = ((val - maxVal/2) / (maxVal/2)) * 100;
      return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
    }}
    {...props}
  />
));

HeatMeter.displayName = 'HeatMeter';
ConfidenceMeter.displayName = 'ConfidenceMeter';
RiskGauge.displayName = 'RiskGauge';
PerformanceMeter.displayName = 'PerformanceMeter';

export { Progress };