import * as React from 'react';
import { HTMLMotionProps } from 'motion/react';
import * as motion from 'motion/react-client';
import { cn } from '../lib/utils';

const Table = React.forwardRef<HTMLTableElement, HTMLMotionProps<'table'>>(
  ({ className, ...props }, ref) => (
    <motion.div layout className="relative w-full overflow-auto">
      <motion.table
        layout
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </motion.div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  HTMLMotionProps<'thead'>
>(({ className, ...props }, ref) => (
  <motion.thead
    layout
    ref={ref}
    className={cn('[&_tr]:border-b', className)}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  HTMLMotionProps<'tbody'>
>(({ className, ...props }, ref) => (
  <motion.tbody
    layout
    ref={ref}
    className={cn('[&_tr:last-of-type]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, HTMLMotionProps<'tr'>>(
  ({ className, ...props }, ref) => (
    <motion.tr
      layout
      ref={ref}
      className={cn(
        'data-[state=selected]:bg-muted border-b transition-colors',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, HTMLMotionProps<'th'>>(
  ({ className, ...props }, ref) => (
    <motion.th
      layout="preserve-aspect"
      ref={ref}
      className={cn(
        'text-muted-foreground h-12 px-6 text-left align-middle text-xs font-normal tracking-wider uppercase [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, HTMLMotionProps<'td'>>(
  ({ className, ...props }, ref) => (
    <motion.td
      layout="preserve-aspect"
      ref={ref}
      className={cn(
        'p-2 px-6 align-middle [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('text-muted-foreground mt-4 text-sm', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
