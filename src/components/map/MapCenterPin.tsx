import React from "react";
import { MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MapCenterPinProps {
  isVisible: boolean;
  address?: string;
  isMoving?: boolean;
}

export const MapCenterPin: React.FC<MapCenterPinProps> = ({
  isVisible,
  address,
  isMoving = false
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20">
          {/* Address Tooltip */}
          {address && !isMoving && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-4 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-white/20 flex items-center gap-2 max-w-[280px]"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-slate-800 truncate">
                {address}
              </span>
            </motion.div>
          )}

          {/* Center Pin */}
          <motion.div
            animate={{
              y: isMoving ? -15 : 0,
              scale: isMoving ? 1.1 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative flex flex-col items-center"
          >
            <div className="relative">
              <MapPin className="w-10 h-10 text-primary fill-primary/20 drop-shadow-2xl" />
              {/* Pulse effect when moving/stopped */}
              {!isMoving && (
                <div className="absolute inset-0 scale-150 animate-ping opacity-20">
                   <MapPin className="w-10 h-10 text-primary" />
                </div>
              )}
            </div>
            
            {/* Shadow */}
            <motion.div
              animate={{
                scale: isMoving ? 0.5 : 1,
                opacity: isMoving ? 0.2 : 0.4,
              }}
              className="w-4 h-1.5 bg-black/40 rounded-full mt-[-2px] blur-sm"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
