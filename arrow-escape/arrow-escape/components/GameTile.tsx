import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Arrow } from '../types';
import { COLORS } from '../constants';

interface Props {
    arrow: Arrow;
    cellSize: number;
    onClick: (id: string) => void;
}

export const GameTile: React.FC<Props> = ({ arrow, cellSize, onClick }) => {
    // Convert segments to SVG path data
    // We need to draw a line through all segments

    const getPathData = () => {
        if (arrow.segments.length === 0) return '';

        // Map grid coordinates to pixel coordinates
        // Center of cell is (c + 0.5) * cellSize, (r + 0.5) * cellSize
        const points = arrow.segments.map(p => ({
            x: (p.c + 0.5) * cellSize,
            y: (p.r + 0.5) * cellSize
        }));

        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x} ${points[i].y}`;
        }
        return d;
    };

    const pathData = getPathData();
    const color = arrow.color || COLORS[0];

    // Animation variants
    const variants = {
        idle: { scale: 1, opacity: 1 },
        moving: {
            scale: 1,
            opacity: 0.8,
            // We handle position updates via state for now, 
            // but could use layoutId for smooth transitions if we were re-ordering
        },
        stuck: {
            x: [0, -5, 5, -5, 5, 0],
            transition: { duration: 0.4 }
        }
    };

    return (
        <motion.g
            initial="idle"
            animate={arrow.state}
            variants={variants}
            onClick={(e) => { e.stopPropagation(); onClick(arrow.id); }}
            className="cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Shadow/Outline for better visibility */}
            <motion.path
                d={pathData}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth={cellSize * 0.8}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                    pathLength: { duration: 0.5, ease: "easeInOut" },
                    d: { duration: 0 }
                }}
                style={{ transform: 'translate(2px, 2px)' }}
            />

            {/* Main Body */}
            <motion.path
                d={pathData}
                stroke={color}
                strokeWidth={cellSize * 0.6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                    pathLength: { duration: 0.5, ease: "easeInOut" },
                    d: { duration: 0 }
                }}
            />

            {/* Arrow Head (Simple Circle or Triangle at the start) */}
            {/* Since segments[0] is the head */}
            {/* Arrow Head - Directional Indicator */}
            <motion.path
                d={`M 0 ${-cellSize * 0.25} L ${cellSize * 0.2} ${cellSize * 0.25} L ${-cellSize * 0.2} ${cellSize * 0.25} Z`}
                fill="white"
                opacity={0.9}
                initial={{ rotate: 0, scale: 0 }}
                animate={{
                    rotate: getRotation(arrow.direction),
                    scale: 1
                }}
                style={{
                    x: (arrow.segments[0].c + 0.5) * cellSize,
                    y: (arrow.segments[0].r + 0.5) * cellSize,
                }}
            />
        </motion.g>
    );
};

// Helper for rotation
const getRotation = (dir: string): number => {
    switch (dir) {
        case 'UP': return 0;
        case 'RIGHT': return 90;
        case 'DOWN': return 180;
        case 'LEFT': return 270;
        default: return 0;
    }
};

