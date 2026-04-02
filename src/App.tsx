import { useState, useRef, useEffect } from 'react';
import { Send, Utensils, RefreshCw, User, Bot } from 'lucide-react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMessage } from './lib/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const response = await sendMessage("START_SESSION: Greet me and ask for my meal details as per your instructions.");
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    };
    init();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl font-serif mr-2">
              <Utensils className="w-6 h-6" />
              <span>FlavourFinder</span>
            </div>
            <h2 className="font-semibold text-slate-800 border-l border-slate-200 pl-3 hidden sm:block">Meal Planning Session</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={resetSession}
              className="flex items-center gap-2 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Start Fresh
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              AI Active
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'user' ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-indigo-600"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "max-w-[85%] rounded-2xl p-4 shadow-sm",
                  msg.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                )}>
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    msg.role === 'user' ? "prose-invert" : "prose-slate"
                  )}>
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4 rounded-lg border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 bg-white">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
                        th: ({ children }) => <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{children}</th>,
                        td: ({ children }) => <td className="px-4 py-2 text-sm text-slate-700 border-t border-slate-100">{children}</td>,
                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-indigo-600 dark:text-indigo-400">{children}</strong>
                      }}
                    >
                      {msg.content}
                    </Markdown>
                  </div>
                  <div className={cn(
                    "text-[10px] mt-2 opacity-60",
                    msg.role === 'user' ? "text-right" : "text-left"
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask FlavourFinder for meal ideas..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-4 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-3">
              FlavourFinder can help with recipes, ingredients, and dietary needs.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
