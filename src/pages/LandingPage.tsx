import { useState } from 'react';
import { Wallet, Brain, CreditCard, ShieldCheck, ArrowRight, LogIn, Sparkles, TrendingUp, PiggyBank, BarChart3 } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';

export function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const { session } = useAuth();

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#6C5CE7]/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-[#6C5CE7]/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] shadow-lg shadow-[#6C5CE7]/20">
              <Wallet className="text-white" size={22} />
            </div>
            <span className="text-lg font-bold text-white">WF Finanças</span>
          </div>
          <button
            onClick={() => openAuth('login')}
            className="flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#6C5CE7] hover:bg-[#6C5CE7]/10"
          >
            <LogIn size={16} />
            Entrar
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 px-4 py-1.5 text-sm text-[#A29BFE]">
          <Sparkles size={14} />
          Inteligência financeira com IA
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
          Seu patrimônio, suas regras.{' '}
          <span className="gradient-text">A inteligência financeira que você merece</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Controle total das suas finanças com dashboard inteligente, cartões, cofrinhos,
          assinaturas e uma Gerente IA que registra seus gastos por texto, voz ou foto de cupom fiscal.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={() => openAuth('signup')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#5A4BD1] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#6C5CE7]/25 transition hover:scale-[1.02] hover:shadow-xl hover:shadow-[#6C5CE7]/30 sm:w-auto"
          >
            + Criar Minha Conta
          </button>
          <button
            onClick={() => openAuth('login')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#121824] px-8 py-4 text-base font-bold text-white transition hover:border-[#6C5CE7] sm:w-auto"
          >
            Acessar Meu Painel
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Feature cards */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Brain size={28} />}
            title="Gerente IA Executiva"
            description="Registra transações por texto, voz ou foto de cupom fiscal. Analisa seus dados e oferece estratégias personalizadas."
            gradient="from-[#6C5CE7] to-[#A29BFE]"
          />
          <FeatureCard
            icon={<CreditCard size={28} />}
            title="Cartões & Financiamentos"
            description="Controle multi-bancos com limites, vencimentos, parcelamentos e lançamentos automáticos nos meses futuros."
            gradient="from-[#00B894] to-[#00CEC9]"
          />
          <FeatureCard
            icon={<ShieldCheck size={28} />}
            title="Privacidade Absoluta"
            description="Cada usuário vê apenas seus próprios dados. RLS em todas as tabelas, criptografia e isolamento total de contas."
            gradient="from-[#E17055] to-[#FDCB6E]"
          />
        </div>
      </section>

      {/* Secondary features */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MiniFeature icon={<TrendingUp size={22} />} label="Fluxo de Caixa" />
          <MiniFeature icon={<PiggyBank size={22} />} label="Cofrinhos & Metas" />
          <MiniFeature icon={<BarChart3 size={22} />} label="Relatórios PDF/CSV" />
          <MiniFeature icon={<Brain size={22} />} label="Consultoria por IA" />
        </div>
      </section>

      {/* CTA footer */}
      <footer className="relative z-10 border-t border-slate-800/50">
        <div className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h3 className="text-2xl font-bold text-white">Pronto para assumir o controle?</h3>
          <p className="mt-2 text-slate-400">Crie sua conta gratuita e comece agora mesmo.</p>
          <button
            onClick={() => openAuth('signup')}
            className="mt-6 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#5A4BD1] px-8 py-3.5 font-bold text-white shadow-lg shadow-[#6C5CE7]/25 transition hover:scale-[1.02]"
          >
            Começar agora
          </button>
          <p className="mt-8 text-sm text-slate-600">
            WF Finanças — Seu patrimônio, suas regras.
          </p>
        </div>
      </footer>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSwitch={setAuthMode}
      />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-[#121824] p-7 transition hover:border-slate-700 hover:bg-[#161d2b]">
      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
        <span className="text-white">{icon}</span>
      </div>
      <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function MiniFeature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#121824]/60 px-5 py-4">
      <span className="text-[#A29BFE]">{icon}</span>
      <span className="text-sm font-medium text-slate-300">{label}</span>
    </div>
  );
}
