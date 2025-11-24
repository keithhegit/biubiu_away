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
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm mx-4"
                >
                    <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-blue-500">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-4">
                            {/* Pinch Gesture Icon */}
                            <div className="relative w-20 h-20 flex-shrink-0">
                                <motion.div
                                    animate={{
                                        scale: [1, 0.7, 1],
                                        rotate: [0, -10, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute inset-0"
                                >
                                    <svg viewBox="0 0 100 100" className="w-full h-full">
                                        {/* Left hand */}
                                        <circle cx="30" cy="50" r="15" fill="#3b82f6" opacity="0.8" />
                                        <path d="M 30 35 L 30 25 L 25 20" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />

                                        {/* Right hand */}
                                        <circle cx="70" cy="50" r="15" fill="#3b82f6" opacity="0.8" />
                                        <path d="M 70 35 L 70 25 L 75 20" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                                    </svg>
                                </motion.div>
                            </div>

                            {/* Text */}
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    提示：双指缩放
                                </h3>
                                <p className="text-sm text-slate-600">
                                    在地图上使用双指捏合手势可以缩放视图
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
