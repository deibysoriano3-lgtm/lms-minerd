import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const animations = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

export default function AnimatedPage({ children, className = "" }: { children: ReactNode, className?: string }) {
    return (
        <motion.div
            variants={animations}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full ${className}`}
        >
            {children}
        </motion.div>
    );
}
