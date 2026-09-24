import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Mic, Camera, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Transaction } from '@/lib/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
    frequency: 'single' | 'recurring' | 'monthly' | 'installment';
    installment_number: number | null;
    installment_total: number | null;
  }) => Promise<boolean>;
}

export function AIChatWidget({ transactions, selectedMonth, onCreateTransaction }: AIChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou sua Gerente IA de Finanças. Estou aqui para analisar seus dados, registrar transações por voz ou foto de cupom fiscal e oferecer orientações estratégicas para o seu patrimônio. Como posso te ajudar hoje?',
    },
  ]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Função robusta de parsing de transações
  const parseTransactionDetails = (text: string, currentMonthKey: string) => {
    let cleanText = text;
    const [currentYear, currentMonthNum] = currentMonthKey.split('-');
    let transactionDate = `${currentYear}-${currentMonthNum}-01`;

    // 1. Extrair data (DD/MM/AAAA ou DD/MM)
    const dateMatch = cleanText.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3] ? (dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]) : currentYear;
      transactionDate = `${year}-${month}-${day}`;
      cleanText = cleanText.replace(dateMatch[0], ' ');
    } else {
      const monthNames: Record<string, string> = {
        'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03', 'abril': '04',
        'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08', 'setembro': '09',
        'outubro': '10', 'novembro': '11', 'dezembro': '12'
      };
      for (const [name, num] of Object.entries(monthNames)) {
        if (cleanText.toLowerCase().includes(name)) {
          transactionDate = `${currentYear}-${num}-01`;
          cleanText = cleanText.replace(new RegExp(name, 'gi'), ' ');
          break;
        }
      }
    }

    // 2. Extrair valor monetário
    const amountMatch = cleanText.match(/(?:r\$?\s*)?(\d+[.,]?\d*)/i);
    if (!amountMatch) return null;

    const amountStr = amountMatch[1].replace(',', '.');
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return null;

    cleanText = cleanText.replace(amountMatch[0], ' ');
    cleanText = cleanText.replace(/r\$/gi, ' ');

    // 3. Extrair conta explícita (pix, itau, cartao) - Evitando capturar "dia" como conta
    let account = 'Conta principal';
    if (/pix/i.test(cleanText)) {
      account = 'Pix';
      cleanText = cleanText.replace(/\bpix\b/gi, ' ');
    } else {
      const accountMatch = cleanText.match(/(?:no|na|em|pelo)\s+([a-zA-ZÀ-ÿ]+)/i);
      if (accountMatch && accountMatch[1].toLowerCase() !== 'dia') {
        account = accountMatch[1].trim();
        cleanText = cleanText.replace(accountMatch[0], ' ');
      }
    }

    // 4. Remover palavras de preenchimento soltas (incluindo "dia") por limites de palavra (\b)
    const fillerWords = ['no', 'na', 'em', 'de', 'do', 'da', 'dia', 'pago', 'gastei', 'comprei', 'lançar', 'lancamento'];
    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleanText = cleanText.replace(regex, ' ');
    });

    const description = cleanText
      .replace(/[^\w\sÀ-ÿ]/gi, ' ')
      .trim()
      .replace(/\s+/g, ' ');

    if (!description) return null;

    return {
      description: description.charAt(0).toUpperCase() + description.slice(1),
      amount,
      account: account.charAt(0).toUpperCase() + account.slice(1),
      transaction_date: transactionDate,
    };
  };

  const generateResponse = async (userText: string): Promise<string> => {
    const lower = userText.toLowerCase();

    const isExpense = /^(gastei|paguei|comprei|gasto|despesa|almo[oç]o|jantar|mercado|gasolina|aluguel|conta|taxi|uber|caf[eé]|lan[çc]ar|garagem|\d+)/i.test(userText);
    const isIncome = /^(recebi|ganhei|sal[aá]rio|rendimento|fatur)/i.test(userText);

    if (isExpense || isIncome || /\d+/.test(userText)) {
      const txDetails = parseTransactionDetails(userText, selectedMonth);
      if (!txDetails) {
        return 'Não consegui entender os detalhes. Tente algo como: "100,00 garagem dia 15/10/2026 pix".';
      }

      const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';
      const category = guessCategory(txDetails.description);

      const isRecurring = /recorrente|fixa|fixo|mensal|todo m[eê]s/i.test(userText);
      const frequency = isRecurring ? 'recurring' : 'single';

      const ok = await onCreateTransaction({
        description: txDetails.description,
        amount: txDetails.amount,
        type,
        category,
        account: txDetails.account,
        transaction_date: txDetails.transaction_date,
        frequency: frequency as any,
        installment_number: null,
        installment_total: null,
      });

      if (ok) {
        return `Pronto! Registrei uma despesa de ${formatCurrency(txDetails.amount)} para "${txDetails.description}" na categoria "${category}" (${txDetails.account}) para o dia ${formatDate(txDetails.transaction_date)}. Seu painel já foi atualizado!`;
      } else {
        return 'Tentei registrar, mas houve um erro no banco de dados. Pode repetir?';
      }
    }

    if (lower.includes('como') && (lower.includes('usar') || lower.includes('funciona') || lower.includes('lanc') || lower.includes('cartao') || lower.includes('cofrin'))) {
      if (lower.includes('cartao')) {
        return 'Para cadastrar um cartão: vá em "Meus Cartões" na barra lateral, clique em "Novo Cartão" e preencha nome, banco, limite, valor usado e dia de vencimento.';
      }
      if (lower.includes('cofrin')) {
        return 'Cofrinhos são suas metas de poupança! Vá em "Cofrinhos", crie uma meta com nome e valor final.';
      }
      return 'Para lançar uma transação: clique em "+ Novo Lançamento" no topo, ou peça diretamente aqui no chat (ex: "100,00 garagem dia 15/10/2026").';
    }

    if (lower.includes('quanto') || lower.includes('gastei') || lower.includes('recebi') || lower.includes('saldo') || lower.includes('total')) {
      const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const balance = income - expense;
      return `Neste mês: você recebeu ${formatCurrency(income)} e gastou ${formatCurrency(expense)}. Seu saldo é ${formatCurrency(balance)}.`;
    }

    return `Posso te ajudar com:\n• Registrar gastos (ex: "100,00 garagem dia 15/10/2026")\n• Analisar seus ganhos e gastos do mês\n\nO que você gostaria de saber?`;
  };

  const guessCategory = (desc: string): string => {
    const d = desc.toLowerCase();
    if (/aluguel|condom|financ|garagem/i.test(d)) return 'Moradia';
    if (/mercado|supermerc|aliment|almo|jantar|restaur/i.test(d)) return 'Alimentação';
    if (/uber|taxi|gasolina|combust|estacion/i.test(d)) return 'Transporte';
    if (/farmacia|medic|consult|dentist|saude/i.test(d)) return 'Saúde';
    if (/cinema|streaming|jogo|lazer|viagem/i.test(d)) return 'Lazer';
    if (/curso|livro|escola|faculd/i.test(d)) return 'Educação';
    if (/salario|rendimento|fatur/i.test(d)) return 'Salário';
    return 'Outros';
  };

  const handleSend = async () => {
    if (!input.trim() || processing) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setProcessing(true);

    const response = await generateResponse(userText);
    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setProcessing(false);
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Seu navegador não suporta reconhecimento de voz.' }]);
      return;
    }

    const recognition = new (SpeechRecognition as { new (): { lang: string; interimResults: boolean; onresult: (e: { results: { 0: { transcript: string } }[] } ) => void; onend: () => void; start: () => void; stop: () => void } })();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    setListening(true);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const handlePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setMessages((prev) => [...prev, { role: 'user', content: `[Foto de cupom fiscal enviada: ${file.name}]` }]);
        setProcessing(true);
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: 'Recebi a foto do seu cupom fiscal!',
          }]);
          setProcessing(false);
        }, 1500);
      }
    };
    input.click();
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#5A4BD1] text-white shadow-lg shadow-[#6C5CE7]/30 transition hover:scale-110 animate-pulse-glow"
          aria-label="Abrir chat com a Gerente IA"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[85vh] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#121824] shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#0B0E14] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE]">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Gerente IA</p>
                <p className="text-xs text-green-400">Online</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setMessages([messages[0]])} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200" title="Limpar conversa">
                <Trash2 size={16} />
              </button>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#6C5CE7] to-[#5A4BD1] text-white'
                      : 'bg-[#1e2a3a] text-slate-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {processing && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-[#1e2a3a] px-4 py-3 text-sm text-slate-400">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#A29BFE]" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#A29BFE]" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#A29BFE]" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleVoice}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                  listening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-[#0B0E14] text-slate-400 hover:text-[#A29BFE]'
                }`}
                title="Falar"
              >
                <Mic size={18} />
              </button>
              <button
                onClick={handlePhoto}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0B0E14] text-slate-400 transition hover:text-[#A29BFE]"
                title="Foto de cupom fiscal"
              >
                <Camera size={18} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ex: '100,00 garagem dia 15/10/2026'..."
                className="flex-1 rounded-lg border border-slate-700 bg-[#0B0E14] px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-[#6C5CE7]"
              />
              <button
                onClick={handleSend}
                disabled={processing || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C5CE7] to-[#5A4BD1] text-white transition hover:scale-105 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}