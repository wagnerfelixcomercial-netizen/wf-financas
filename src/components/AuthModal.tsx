import { useState } from 'react';
import { Wallet, Eye, EyeOff, Lock, X, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  open: boolean;
  mode: 'login' | 'signup';
  onClose: () => void;
  onSwitch: (mode: 'login' | 'signup') => void;
}

export function AuthModal({ open, mode, onClose, onSwitch }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(
          error.includes('Invalid login')
            ? 'E-mail ou senha incorretos. Tente novamente.'
            : error
        );
        setLoading(false);
      } else {
        onClose();
      }
    } else {
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName || 'Usuário');
      if (error) {
        setError(
          error.includes('already')
            ? 'Este e-mail já está cadastrado. Tente fazer login.'
            : error
        );
        setLoading(false);
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md animate-slide-up rounded-2xl border border-slate-800 bg-[#121824] p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 transition hover:text-slate-300"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE]">
            <Wallet className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {mode === 'login' ? 'Acessar Meu Painel' : 'Criar Minha Conta'}
            </h2>
            <p className="text-sm text-slate-400">WF Finanças</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Nome completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-lg border border-slate-700 bg-[#0B0E14] px-4 py-3 text-white placeholder-slate-600 outline-none transition focus:border-[#6C5CE7]"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-slate-700 bg-[#0B0E14] px-4 py-3 text-white placeholder-slate-600 outline-none transition focus:border-[#6C5CE7]"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-[#0B0E14] px-4 py-3 pr-12 text-white placeholder-slate-600 outline-none transition focus:border-[#6C5CE7]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#5A4BD1] py-3 font-semibold text-white transition hover:from-[#7C6DF7] hover:to-[#6C5BE7] disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-400">
          {mode === 'login' ? (
            <>
              Não tem conta?{' '}
              <button
                onClick={() => {
                  setError(null);
                  onSwitch('signup');
                }}
                className="font-semibold text-[#A29BFE] hover:underline"
              >
                Criar agora
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button
                onClick={() => {
                  setError(null);
                  onSwitch('login');
                }}
                className="font-semibold text-[#A29BFE] hover:underline"
              >
                Fazer login
              </button>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-[#0B0E14] px-4 py-3 text-xs text-slate-500">
          <Lock size={14} className="text-green-400" />
          Dados Criptografados e 100% Privados
        </div>
      </div>
    </div>
  );
}
