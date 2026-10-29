import * as motion from 'motion/react-client';

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen flex-1 items-center justify-center"
    >
      <div className="border-foreground h-10 w-10 animate-spin rounded-full border-t-2 border-b-2"></div>
    </motion.div>
  );
}
