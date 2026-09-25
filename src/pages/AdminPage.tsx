import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, CheckCircle, XCircle, Ban, Trash2, Search } from 'lucide-react';
import type { Profile } from '@/lib/types';

export function AdminPage() {
  const { refreshProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles((data as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    await supabase.from('profiles').update({ approval_status: status, updated_at: new Date().toISOString() }).eq('id', id);
    load();
    refreshProfile();
  };

  const toggleBlock = async (p: Profile) => {
    await supabase.from('profiles').update({ is_blocked: !p.is_blocked, updated_at: new Date().toISOString() }).eq('id', p.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Tem certeza? Esta ação removerá o perfil (o usuário perderá acesso).')) return;
    await supabase.from('profiles').delete().eq('id', id);
    load();
  };

  const filtered = profiles.filter((p) => p.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck size={24} className="text-[#A29BFE]" />
        <div>
          <h2 className="text-xl font-bold text-white">Gerenciamento de Usuários</h2>
          <p className="text-sm text-slate-400">Aprove cadastros, bloqueie ou remova contas</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por e-mail..."
          className="w-full rounded-lg border border-slate-700 bg-[#0B0E14] py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-[#6C5CE7]"
        />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#121824] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
              <th className="px-4 py-3 text-center font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Nenhum usuário encontrado.</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/50 hover:bg-[#0B0E14]/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{p.full_name || 'Sem nome'}</p>
                    <p className="text-xs text-slate-500">{p.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.approval_status === 'approved' ? 'bg-green-500/15 text-green-400' :
                      p.approval_status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-red-500/15 text-red-400'
                    }`}>
                      {p.approval_status === 'approved' ? 'Aprovado' : p.approval_status === 'pending' ? 'Pendente' : 'Rejeitado'}
                    </span>
                    {p.is_blocked && <span className="ml-1 inline-block rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400">Bloqueado</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{p.is_admin ? 'Admin' : 'Usuário'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {p.approval_status !== 'approved' && (
                        <button onClick={() => updateStatus(p.id, 'approved')} className="rounded-lg p-1.5 text-green-400 hover:bg-green-500/20" title="Aprovar">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {p.approval_status !== 'rejected' && (
                        <button onClick={() => updateStatus(p.id, 'rejected')} className="rounded-lg p-1.5 text-yellow-400 hover:bg-yellow-500/20" title="Rejeitar">
                          <XCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => toggleBlock(p)} className="rounded-lg p-1.5 text-orange-400 hover:bg-orange-500/20" title="Bloquear/Desbloquear">
                        <Ban size={16} />
                      </button>
                      <button onClick={() => remove(p.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/20" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}