'use client';

import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import * as motion from 'motion/react-client';
import { ReactNode } from 'react';

const EmptyList = ({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta: {
    icon?: ReactNode;
    label: string;
    onClick: () => void;
  };
}) => {
  return (
    <motion.div
      className="flex w-full flex-col items-center justify-center rounded-md border border-dashed px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <p className="text-center text-lg font-semibold text-balance">{title}</p>
      <p className="dark:text-muted-foreground mt-2 mb-5 text-center text-sm text-balance">
        {description}
      </p>
      <Button onClick={cta.onClick} size="sm">
        {cta.icon ? cta.icon : <Plus />}
        {cta.label}
      </Button>
    </motion.div>
  );
};

export default EmptyList;
