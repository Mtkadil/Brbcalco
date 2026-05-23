import { useState } from 'react';
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ScreenLoginProps {
  onPasswordSubmit: (password: string, chairNumber?: number) => void;
  isLoading?: boolean;
  error?: string;
}

// Password configuration
const PASSWORD_CONFIG = {
  admin: 'admin123',
  chair1: 'pass1',
  chair2: 'pass2',
  chair3: 'pass3',
  chair4: 'pass4',
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
      {/* Logo and Header */}
      <div className="text-center">
        <div className="mb-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-wider mb-2 font-serif">
            <span className="text-black dark:text-white">BLOCK</span>
            <br />
            <span className="text-red-600">BARBER</span>
          </h1>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-red-600/20 p-4 rounded-2xl">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold font-serif text-red-600 mb-2">
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
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/30 transition-all"
            autoFocus
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white transition-colors"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || password.length === 0}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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
        <p className="text-[10px] text-[#8E8E93] mt-2">
          Ideata e sviluppata da Adil Mtk
        </p>
      </div>
    </div>
  );
}

export { PASSWORD_CONFIG };
