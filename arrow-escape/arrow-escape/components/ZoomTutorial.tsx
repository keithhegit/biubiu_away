import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ZoomTutorial: React.FC = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if tutorial has been shown before
        const hasSeenTutorial = localStorage.getItem('zoomTutorialSeen');

        if (!hasSeenTutorial) {
            setShow(true);
            localStorage.setItem('zoomTutorialSeen', 'true');

            // Auto-dismiss after 5 seconds
            const timer = setTimeout(() => setShow(false), 5000);
            return () => clearTimeout(timer);
            import React, { useEffect, useState } from 'react';
            import { motion, AnimatePresence } from 'framer-motion';
            import { X } from 'lucide-react';

            export const ZoomTutorial: React.FC = () => {
                const [show, setShow] = useState(false);

                useEffect(() => {
                    // Check if tutorial has been shown before
                    const hasSeenTutorial = localStorage.getItem('zoomTutorialSeen');

                    if (!hasSeenTutorial) {
                        setShow(true);
                        localStorage.setItem('zoomTutorialSeen', 'true');

                        // Auto-dismiss after 5 seconds
                        const timer = setTimeout(() => setShow(false), 5000);
                        return () => clearTimeout(timer);
                    }
                }, []);

                const handleDismiss = () => setShow(false);

                return (
                    <AnimatePresence>
                        {show && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
                            >
                                <motion.div
                                    className="relative w-32 h-32 bg-white/90 backdrop-blur-sm rounded-full shadow-2xl border-4 border-blue-500 flex items-center justify-center"
                                    onClick={handleDismiss}
                                >
                                    {/* Animated pinch gesture - two hands */}
                                    <svg viewBox="0 0 100 100" className="w-24 h-24">
                                        {/* Left hand */}
                                        <motion.g
                                            animate={{
                                                x: [0, 15, 0],
                                                rotate: [0, -15, 0]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <circle cx="25" cy="50" r="12" fill="#3b82f6" opacity="0.9" />
                                            <path d="M 25 38 L 25 28 L 20 22" stroke="#3b82f6" strokeWidth="4" fill="none" strokeLinecap="round" />
                                            <path d="M 25 38 L 22 30" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                                            <path d="M 25 38 L 28 30" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                                        </motion.g>

                                        {/* Right hand */}
                                        <motion.g
                                            animate={{
                                                x: [0, -15, 0],
                                                rotate: [0, 15, 0]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <circle cx="75" cy="50" r="12" fill="#3b82f6" opacity="0.9" />
                                            <path d="M 75 38 L 75 28 L 80 22" stroke="#3b82f6" strokeWidth="4" fill="none" strokeLinecap="round" />
                                            <path d="M 75 38 L 72 30" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                                            <path d="M 75 38 L 78 30" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                                        </motion.g>

                                        {/* Expand/contract arrows */}
                                        <motion.g
                                            animate={{
                                                opacity: [0.3, 1, 0.3]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <path d="M 45 50 L 35 50 L 38 47 M 35 50 L 38 53" stroke="#60a5fa" strokeWidth="2" fill="none" strokeLinecap="round" />
                                            <path d="M 55 50 L 65 50 L 62 47 M 65 50 L 62 53" stroke="#60a5fa" strokeWidth="2" fill="none" strokeLinecap="round" />
                                        </motion.g>
                                    </svg>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                );
            };
