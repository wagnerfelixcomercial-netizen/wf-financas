import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Mic, Camera, Trash2, Bot, Sparkles } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface AIChatWidgetProps {
  transactions: Transaction[];
  selectedMonth: string;
  onCreateTransaction: (tx: {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    account: string;
    transaction_date: string;
    frequency: 'single' | 'recurring' | 'installment';
    installment_number: number | null;
    installment_total: number | null;
  }) => Promise<any>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatWidget({ transactions, selectedMonth, onCreateTransaction }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou sua Gerente IA de Finanças. Estou aqui para analisar seus dados, registrar transações por voz ou texto e oferecer orientações estratégicas. Como posso te ajudar hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const lower = userMsg.toLowerCase();
      
      // 1. Consulta de Despesas
      if (lower.includes('gasto') || lower.includes('despesa') || lower.includes('quanto') || lower.includes('resumo')) {
        const total = transactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => acc + Number(t.amount), 0);
        
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `No mês selecionado (${selectedMonth}), o seu total de despesas é de ${formatCurrency(total)}.` }
        ]);
      } 
      // 2. Consulta de Receitas
      else if (lower.includes('receita') || lower.includes('ganho') || lower.includes('entrada')) {
        const total = transactions
          .filter(t => t.type === 'income')
          .reduce((acc, t) => acc + Number(t.amount), 0);
        
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `No mês selecionado (${selectedMonth}), o seu total de receitas é de ${formatCurrency(total)}.` }
        ]);
      } 
      // 3. Registo Automático por Texto (ex: "gastei 100 com mercado" ou "garagem carro 100")
      else {
        const numberRegex = /(\d+[\d,.]*)/;
        const match = userMsg.match(numberRegex);

        if (match) {
          const rawAmount = match[0].replace('.', '').replace(',', '.');
          const amount = parseFloat(rawAmount);

          if (!isNaN(amount) && amount > 0) {
            const description = userMsg.replace(match[0], '').replace(/(gastei|despesa|receita|com|no|na)/gi, '').trim() || 'Lançamento via IA';
            const type = lower.includes('receita') || lower.includes('ganho') ? 'income' : 'expense';

            await onCreateTransaction({
              description: description.charAt(0).toUpperCase() + description.slice(1),
              amount: amount,
              type: type,
              category: 'Geral',
              account: 'Conta principal',
              transaction_date: new Date().toISOString().split('T')[0],
              frequency: 'single',
              installment_number: null,
              installment_total: null,
            });

            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: `Perfeito! Registrei "${description}" no valor de ${formatCurrency(amount)} com sucesso.` }
            ]);
            setLoading(false);
            return;
          }
        }

        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Entendi sua solicitação! Para registrar transações rapidamente, digite por exemplo: "gastei 100 no mercado" ou consulte seus totais digitando "quanto gastei".' }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, ocorreu um erro ao salvar o lançamento via IA. Tente novamente.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] text-white shadow-lg transition hover:scale-105"
          title="Abrir Gerente IA"
        >
          <Sparkles size={26} />
        </button>
      ) : (
        <div className="flex flex-col h-[500px] w-[92vw] sm:w-[380px] rounded-2xl border border-slate-800 bg-[#121824] shadow-2xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#0B0E14] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5CE7]/20 text-[#A29BFE]">
                <Bot size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Gerente IA</h4>
                <span className="text-[10px] text-green-400">Online</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([{ role: 'assistant', content: 'Histórico limpo. Como posso ajudar?' }])}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Limpar Conversa"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#6C5CE7] text-white rounded-br-none'
                      : 'bg-[#1e293b] text-slate-200 rounded-bl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-none bg-[#1e293b] px-4 py-2 text-xs text-slate-400">
                  Pensando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} className="border-t border-slate-800 bg-[#0B0E14] p-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => alert('Gravação de voz ativada. Fale sua transação.')}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0"
                title="Falar por voz"
              >
                <Mic size={18} />
              </button>
              <button
                type="button"
                onClick={() => alert('Envio de cupom/foto ativado.')}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0"
                title="Enviar foto"
              >
                <Camera size={18} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite ou fale..."
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#121824] px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-[#6C5CE7] focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6C5CE7] text-white transition hover:bg-[#5A4BD1] shrink-0"
                title="Enviar"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AIChatWidget;