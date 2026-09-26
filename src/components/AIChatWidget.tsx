import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { toISODate } from '@/lib/format';

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
  }) => Promise<boolean>;
  onReload: () => void; // <--- Adicionado para atualizar a tela
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatWidget({ transactions, selectedMonth, onCreateTransaction, onReload }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou sua assistente financeira. Pode digitar comandos como: "Gastei 15 no uber no Nu credito" ou perguntar quanto gastou.',
    },
  ]);
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
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const lower = userMsg.toLowerCase();
      const numberMatch = userMsg.match(/(\d+[\.,]?\d*)/);
      
      if (
        lower.includes('gastei') ||
        lower.includes('lançar') ||
        lower.includes('comprei') ||
        lower.includes('paguei') ||
        (numberMatch && (lower.includes('nu') || lower.includes('credito') || lower.includes('cartão') || lower.includes('conta') || lower.includes('itau') || lower.includes('caixa') || lower.includes('bradesco')))
      ) {
        if (!numberMatch) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Não consegui identificar o valor. Tente ex: "Gastei 15 no uber no Nu credito".' },
          ]);
          setLoading(false);
          return;
        }

        const rawAmount = numberMatch[0].replace(',', '.');
        const amount = parseFloat(rawAmount);

        let account = 'Conta principal';
        if (lower.includes('nu') || lower.includes('nubank')) {
          account = 'Nu credito';
        } else if (lower.includes('itau') || lower.includes('itaú')) {
          account = 'Itaú';
        } else if (lower.includes('caixa')) {
          account = 'Caixa';
        } else if (lower.includes('bradesco')) {
          account = 'Bradesco';
        } else if (lower.includes('cartao') || lower.includes('cartão')) {
          account = 'Nu credito';
        }

        let description = userMsg
          .replace(/gastei|lançar|comprei|paguei|reais|R\$|\$|no|na|com/gi, '')
          .replace(numberMatch[0], '')
          .replace(/nu|nubank|credito|crédito|cartao|cartão|itau|itaú|caixa|bradesco/gi, '')
          .trim();

        if (!description || description.length < 2) {
          description = 'Despesa via IA';
        } else {
          description = description.charAt(0).toUpperCase() + description.slice(1);
        }

        const todayStr = toISODate(new Date());

        const success = await onCreateTransaction({
          description,
          amount,
          type: 'expense',
          category: 'Outros',
          account,
          transaction_date: todayStr,
          frequency: 'single',
          installment_number: null,
          installment_total: null,
        });

        if (success) {
          onReload(); // Atualiza os dados do dashboard imediatamente
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `✅ Lançamento efetuado com sucesso!\n• Descrição: ${description}\n• Valor: R$ ${amount.toFixed(2)}\n• Conta/Cartão: ${account}`,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: '❌ Ocorreu um erro ao salvar o lançamento no banco de dados.' },
          ]);
        }
      } else if (lower.includes('gastei') || lower.includes('total') || lower.includes('resumo') || lower.includes('quanto')) {
        const totalExpense = transactions
          .filter((t) => t.type === 'expense')
          .reduce((acc, t) => acc + Number(t.amount), 0);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `📊 No mês selecionado (${selectedMonth}), o seu total de despesas registadas é de R$ ${totalExpense.toFixed(2)}.`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Não entendi totalmente. Tente algo como: "Gastei 15 no uber no Nu credito".',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Ocorreu um erro ao processar o seu pedido.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] text-white shadow-lg transition hover:scale-105 hover:shadow-purple-500/25"
        >
          <Sparkles size={24} />
        </button>
      ) : (
        <div className="flex h-[500px] w-96 flex-col rounded-2xl border border-slate-800 bg-[#121824] shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5CE7]/20 text-[#A29BFE]">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Assistente IA</h3>
                <p className="text-[10px] text-slate-400">Online para gerir finanças</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6C5CE7]/20 text-[#A29BFE]">
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    m.role === 'user' ? 'bg-[#6C5CE7] text-white' : 'bg-[#0B0E14] text-slate-200 border border-slate-800'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-200">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center text-xs text-slate-400">
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#6C5CE7]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#6C5CE7] [animation-delay:0.2s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#6C5CE7] [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-800 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Gastei 15 no uber no Nu credito"
              className="flex-1 rounded-lg border border-slate-700 bg-[#0B0E14] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#6C5CE7] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6C5CE7] text-white transition hover:scale-105 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}