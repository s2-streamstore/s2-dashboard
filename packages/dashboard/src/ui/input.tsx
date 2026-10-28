import * as React from 'react';
import * as motion from 'motion/react-client';

import { cn } from '../lib/utils';
import { HTMLMotionProps } from 'motion/react';
import { Search } from 'lucide-react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  HTMLMotionProps<'input'>;

const styles =
  'flex h-9 w-full border-input bg-transparent dark:bg-input/30 rounded-lg border transition-colors px-3 py-1 text-md file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    if (type === 'search') {
      return (
        <motion.div layout className="position relative">
          <motion.input
            layout
            type="search"
            className={cn(styles, className, 'pl-9')}
            ref={ref}
            {...props}
          />
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          />
        </motion.div>
      );
    }
    return (
      <input
        type={type}
        className={cn(styles, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
