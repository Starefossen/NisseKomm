'use client';

import { useState } from 'react';

interface PasswordPromptProps {
  onSuccess: () => void;
  expectedPassword: string;
}

const errorMessages = [
  'FEIL PASSORD',
  'TILGANG NEKTET - PRØV IGJEN',
  'ADVARSEL: SIKKERHETSBRUDD REGISTRERT',
];

export function PasswordPrompt({ onSuccess, expectedPassword }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password.toUpperCase() === expectedPassword.toUpperCase()) {
      // Success!
      onSuccess();
    } else {
      // Failed attempt
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);

      const errorIndex = Math.min(newAttemptCount - 1, errorMessages.length - 1);
      setError(errorMessages[errorIndex]);

      // Trigger shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);

      // Clear password
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--crt-bg)] flex items-center justify-center z-50">
      <div
        className={`w-[600px] max-w-[90%] space-y-6 ${isShaking ? 'animate-[crt-shake_0.3s_ease-in-out]' : ''}`}
      >
        {/* Header */}
        <div className="text-[var(--neon-green)] text-2xl tracking-wider font-mono text-center mb-8">
          <div>TILGANGSKONTROLL</div>
          <div className="text-sm mt-2 opacity-70">SKRIV INN PASSORD</div>
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black border-4 border-[var(--neon-green)] text-[var(--neon-green)] text-xl tracking-widest font-mono focus:outline-none focus:shadow-[0_0_20px_rgba(0,255,0,0.5)] uppercase"
              placeholder="_ _ _ _ _ _ _ _"
              autoFocus
              style={{ caretColor: 'var(--neon-green)' }}
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-[var(--neon-green)] text-black text-xl tracking-wider font-bold border-4 border-[var(--neon-green)] hover:bg-transparent hover:text-[var(--neon-green)] transition-colors"
          >
            LOGG INN
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div
            className="text-[var(--christmas-red)] text-center text-lg tracking-wider border-2 border-[var(--christmas-red)] py-3 px-4"
            style={{ animation: 'error-pulse 0.5s ease-in-out' }}
          >
            {error}
          </div>
        )}

        {/* Attempt counter */}
        {attemptCount > 0 && (
          <div className="text-[var(--gold)] text-center text-sm opacity-70">
            Forsøk: {attemptCount}
          </div>
        )}
      </div>
    </div>
  );
}
