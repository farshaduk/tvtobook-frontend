'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function Spinner({ size = 'md', className, text, showText = true }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Animated Spinner */}
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className={cn(
            'border-4 border-primary/20 border-t-primary rounded-full',
            sizeClasses[size],
            className
          )}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Inner pulsing dot */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Loading Text */}
      {showText && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.p
            className="text-sm font-medium text-muted-foreground"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {text || 'Loading...'}
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}

// Brand-specific spinner for TvtoBook
export function TvtoBookSpinner({ size = 'lg', className }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      {/* Main Logo Animation */}
      <div className="relative">
        {/* Outer rotating rings */}
        <motion.div
          className={cn(
            'absolute border-2 border-primary/30 rounded-full',
            sizeClasses[size]
          )}
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        <motion.div
          className={cn(
            'absolute border-2 border-primary/20 rounded-full',
            size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : size === 'lg' ? 'w-14 h-14' : 'w-18 h-18'
          )}
          animate={{ rotate: -360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Center Book Icon */}
        <motion.div
          className={cn(
            'flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 rounded-full text-white font-bold',
            size === 'sm' ? 'w-6 h-6 text-xs' : 
            size === 'md' ? 'w-8 h-8 text-sm' : 
            size === 'lg' ? 'w-12 h-12 text-lg' : 
            'w-16 h-16 text-xl'
          )}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          📚
        </motion.div>
      </div>

      {/* Animated Brand Text */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <motion.h1
          className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '200% 200%',
          }}
        >
          TvtoBook
        </motion.h1>
        
        <motion.p
          className="text-sm text-muted-foreground font-medium"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          Your Digital Library Awaits
        </motion.p>
      </motion.div>

      {/* Loading Dots */}
      <motion.div
        className="flex space-x-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// Full-screen overlay loader component
export function GlobalLoader({ 
  isLoading, 
  text = "Loading TvtoBook...",
  showBrand = true,
  overlayIntensity = 'high'
}: { 
  isLoading: boolean; 
  text?: string; 
  showBrand?: boolean;
  overlayIntensity?: 'low' | 'medium' | 'high' | 'maximum';
}) {
  if (!isLoading) return null;

  // Define overlay styles based on intensity
  const overlayStyles = {
    low: 'bg-black/30 backdrop-blur-sm',
    medium: 'bg-black/50 backdrop-blur-md',
    high: 'bg-black/60 backdrop-blur-lg',
    maximum: 'bg-black/80 backdrop-blur-xl'
  };

  const backgroundStyles = {
    low: 'from-slate-900/40 via-gray-800/30 to-slate-900/40',
    medium: 'from-slate-900/60 via-gray-800/50 to-slate-900/60',
    high: 'from-slate-900/80 via-gray-800/70 to-slate-900/80',
    maximum: 'from-slate-900/90 via-gray-800/85 to-slate-900/90'
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Loading content with white background */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center space-y-8 bg-white rounded-2xl shadow-2xl p-12 mx-4"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {showBrand ? (
          <div className="flex flex-col items-center space-y-6">
            {/* Elegant Book Animation */}
            <div className="relative">
              {/* Subtle rotating rings */}
              <motion.div
                className="absolute -inset-6 border rounded-full"
                style={{ borderColor: '#aa0001' }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              
              <motion.div
                className="absolute -inset-3 border rounded-full"
                style={{ borderColor: '#aa0001' }}
                animate={{ rotate: -360 }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              {/* Book Stack Animation */}
              <div className="relative w-16 h-20 flex items-center justify-center">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    style={{
                      zIndex: 3 - index,
                      backgroundColor: '#aa0001',
                      color: 'white',
                    }}
                    animate={{
                      x: index * 1,
                      y: index * 0.5,
                    }}
                  />
                ))}
              </div>

              {/* Subtle glow effect */}
              <motion.div
                className="absolute inset-0 bg-slate-500/10 rounded-full blur-lg"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>

            {/* Elegant Brand Text */}
            <motion.div
              className="text-center space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <motion.h1
                className="text-4xl font-bold"
                style={{ color: '#aa0001' }}
                animate={{
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                TvtoBook
              </motion.h1>
              
              <motion.p
                className="text-lg font-medium"
                style={{ color: '#aa0001' }}
                animate={{
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {text}
              </motion.p>
            </motion.div>

            {/* Subtle Loading Dots */}
            <motion.div
              className="flex space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#aa0001' }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 0.8, 0.4],
                    y: [0, -2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.3,
                  }}
                />
              ))}
            </motion.div>

            {/* Subtle Progress Bar */}
            <motion.div
              className="w-48 h-0.5 bg-gray-200 rounded-full overflow-hidden"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#aa0001' }}
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Spinner size="xl" />
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <p className="text-gray-600 text-lg">{text}</p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
