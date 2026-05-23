import { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

interface ScreenLoginProps {
  onPasswordSubmit: (password: string, chairNumber?: number) => void;
  isLoading?: boolean;
  error?: string;
}

// Password configuration
const PASSWORD_CONFIG = {
  admin: 'admin123', // Admin/Proprietario password
  chair1: 'pass1',   // Postazione 1
  chair2: 'pass2',   // Postazione 2
  chair3: 'pass3',   // Postazione 3
  chair4: 'pass4',   // Postazione 4
};

export default function ScreenLogin({ onPasswordSubmit, isLoading, error }: ScreenLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPasswordSubmit(password);
    setPassword('');
  };

  return (
    <div className="w-full flex flex-col justify-center items-center gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-gold-primary/20 p-4 rounded-2xl">
            <Lock className="w-8 h-8 text-gold-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold font-serif text-gold-primary mb-2">
          Accesso Protetto
        </h2>
        <p className="text-[13px] text-[#8E8E93]">
          Inserisci la password per accedere alla postazione
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Password Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {/* Password Input */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-gold-primary/50 focus:ring-1 focus:ring-gold-primary/30 transition-all"
            autoFocus
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white transition-colors"
            disabled={isLoading}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || password.length === 0}
          className="w-full bg-gold-primary hover:bg-gold-primary/90 disabled:bg-gold-primary/50 text-black font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              Autenticazione...
            </>
          ) : (
            'Accedi'
          )}
        </button>
      </form>

      {/* Info Footer */}
      <div className="text-center mt-6 pt-6 border-t border-white/5 w-full">
        <p className="text-[11px] text-[#8E8E93] tracking-wide uppercase">
          Sistema di Sicurezza Attivo
        </p>
      </div>
    </div>
  );
}

export { PASSWORD_CONFIG };
