import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';
import { HTMLMotionProps } from 'motion/react';
import * as motion from 'motion/react-client';

/*
 * Matches the landing design's button (`(marketing)/(components)/ui/button.tsx`): a pill with a
 * semibold label. That one is built on Base UI; this one stays on Radix `Slot` so the dashboard's
 * `asChild` call sites keep working.
 *
 * `border` in the base is width only and each variant sets its color, so a caller's border color
 * is not outranked by a `border-transparent` in the base. `outline` is unfilled: the surface
 * behind it is the fill, so it reads the same on the page, the sidebar or a card.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border text-sm font-semibold transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border-border bg-transparent hover:bg-muted hover:text-foreground dark:border-input dark:hover:bg-input/50',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'border-transparent hover:bg-muted hover:text-foreground dark:hover:bg-muted/50',
        link: 'border-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 gap-1.5 px-3.5 text-[0.8rem]',
        lg: 'h-10 px-5',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends HTMLMotionProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...(props as React.ComponentPropsWithoutRef<'button'>)}
        />
      );
    }
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
