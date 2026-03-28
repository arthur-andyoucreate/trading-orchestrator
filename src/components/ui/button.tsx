/**
 * Button Component - Trading Orchestrator Design System
 * Built with shadcn/ui and design tokens
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-blue-500 text-white hover:bg-blue-600 focus-visible:ring-blue-500',
        destructive: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
        success: 'bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500',
        warning: 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500',
        outline: 'border border-neutral-200 bg-transparent hover:bg-neutral-100 focus-visible:ring-neutral-500',
        secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus-visible:ring-neutral-500',
        ghost: 'hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-500',
        link: 'text-blue-500 underline-offset-4 hover:underline focus-visible:ring-blue-500',
        
        // Trading specific variants
        long: 'bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]',
        short: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
        neutral: 'bg-slate-500 text-white hover:bg-slate-600 focus-visible:ring-slate-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8',
        xl: 'h-14 rounded-md px-10 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      loading: {
        true: 'cursor-not-allowed',
        false: '',
      },
      glow: {
        true: 'relative before:absolute before:inset-0 before:rounded-md before:p-[1px] before:bg-gradient-to-r before:from-blue-500 before:to-purple-500 before:opacity-75',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      loading: false,
      glow: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false, 
    leftIcon,
    rightIcon,
    loadingText,
    children,
    disabled,
    glow,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, glow, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {glow && (
          <span className="absolute inset-[1px] rounded-md bg-gradient-to-r from-background to-background" />
        )}
        <span className="relative flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingText || children}
            </>
          ) : (
            <>
              {leftIcon}
              {children}
              {rightIcon}
            </>
          )}
        </span>
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };

// Trading specific button components
export const LongButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="long" {...props} />
);

export const ShortButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="short" {...props} />
);

export const NeutralButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="neutral" {...props} />
);

LongButton.displayName = 'LongButton';
ShortButton.displayName = 'ShortButton';
NeutralButton.displayName = 'NeutralButton';