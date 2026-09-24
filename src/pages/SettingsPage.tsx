import { useState } from 'react';
import { User, Sliders, Tag, Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Category } from '@/lib/types';

interface SettingsPageProps {
  categories: Category[];
  onReload: () => void;
}

export function SettingsPage({ categories, onReload }: SettingsPageProps) {
  const { user, profile, signOut } = useAuth();
  const [tab, setTab] = useState<'profile' | 'preferences' | 'categories'>('profile');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6C5CE7');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', user.id);
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !user) return;
    await supabase.from('categories').insert({ name: newCatName.trim(), color: newCatColor });
    setNewCatName('');
    setNewCatColor('#6C5CE7');
    onReload();
  };

  const removeCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    onReload();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Configurações</h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        <TabButton active={tab === 'profile'} onClick={() => setTab('profile')} icon={<User size={16} />} label="Perfil" />
        <TabButton active={tab === 'preferences'} onClick={() => setTab('preferences')} icon={<Sliders size={16} />} label="Preferências" />
        <TabButton active={tab === 'categories'} onClick={() => setTab('categories')} icon={<Tag size={16} />} label="Categorias" />
      </div>

      {tab === 'profile' && (
        <div className="max-w-lg space-y-4 rounded-2xl border border-slate-800 bg-[#121824] p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Nome completo</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">E-mail</label>
            <input value={user?.email || ''} disabled className="input-field opacity-50" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Status da conta</label>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              profile?.approval_status === 'approved' ? 'bg-green-500/15 text-green-400' :
              profile?.approval_status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' :
              'bg-red-500/15 text-red-400'
            }`}>
              {profile?.approval_status === 'approved' ? 'Aprovada' :
               profile?.approval_status === 'pending' ? 'Aguardando aprovação' : 'Rejeitada'}
            </div>
          </div>
          {savedMsg && <p className="text-sm text-green-400">Perfil salvo com sucesso!</p>}
          <div className="flex gap-3">
            <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#5A4BD1] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={signOut} className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-red-500/50 hover:text-red-400">
              Sair da conta
            </button>
          </div>
        </div>
      )}

      {tab === 'preferences' && (
        <div className="max-w-lg space-y-4 rounded-2xl border border-slate-800 bg-[#121824] p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Tema</label>
            <div className="rounded-lg border border-slate-700 bg-[#0B0E14] px-4 py-3 text-sm text-slate-400">
              Dark Mode Fintech (padrão)
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Moeda</label>
            <div className="rounded-lg border border-slate-700 bg-[#0B0E14] px-4 py-3 text-sm text-slate-400">
              Real Brasileiro (R$)
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Idioma</label>
            <div className="rounded-lg border border-slate-700 bg-[#0B0E14] px-4 py-3 text-sm text-slate-400">
              Português (Brasil)
            </div>
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="max-w-lg space-y-4 rounded-2xl border border-slate-800 bg-[#121824] p-6">
          <h3 className="font-semibold text-white">Categorias Personalizadas</h3>
          <form onSubmit={addCategory} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Nome</label>
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Ex: Pet, Academia..." className="input-field" />
            </div>
            <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="h-10 w-12 rounded border border-slate-700 bg-transparent" />
            <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-[#6C5CE7] px-4 py-2.5 text-sm font-semibold text-white">
              <Plus size={16} />
              Adicionar
            </button>
          </form>
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma categoria personalizada ainda.</p>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-[#0B0E14] px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded" style={{ background: c.color }} />
                    <span className="text-sm text-white">{c.name}</span>
                  </div>
                  <button onClick={() => removeCategory(c.id)} className="text-slate-400 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
        active ? 'border-[#6C5CE7] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
