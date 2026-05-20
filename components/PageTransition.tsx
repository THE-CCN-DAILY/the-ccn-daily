import React from 'react';
import { motion } from 'motion/react';

const PageTransition: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
