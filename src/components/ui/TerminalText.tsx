'use client';

import { useState, useEffect } from 'react';

interface TerminalTextProps {
  text: string;
  speed?: number; // Characters per second
  className?: string;
}

export function TerminalText({ text, speed = 50, className = '' }: TerminalTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 1000 / speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <div className={`font-mono ${className}`}>
      {displayedText}
      {currentIndex < text.length && (
        <span
          className="inline-block w-2 h-4 ml-1 bg-[var(--neon-green)] align-middle"
          style={{ animation: 'blink-cursor 1s step-end infinite' }}
        />
      )}
    </div>
  );
}
