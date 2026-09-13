import React, { useState, useEffect } from 'react';

interface AIAssistantWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  isOpen,
  onToggle,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello Arjun! I'm your ScholarCore AI Assistant. How can I help you with your academics, fees, or timetable today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialPrompt) {
      handleSend(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [isOpen, initialPrompt]);

  const suggestions = [
    'Check my attendance shortfall',
    'Summarize latest exam notice',
    'How can I apply for a fee installment?',
    'Has anyone posted a lost calculator in CS block?',
  ];

  const handleSend = async (textToSend?: string) => {
    const promptText = textToSend || input;
    if (!promptText.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await response.json();
      const botReply = data.reply || 'Sorry, I could not retrieve information at this time.';

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'There was a connection error contacting the ScholarCore Assistant.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded Chat Dialog */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 h-[460px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#171f33] text-white p-3.5 px-4 flex items-center justify-between border-b border-[#464554]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">ScholarCore AI Assistant</h3>
                <p className="text-[11px] text-indigo-200 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Gemini Powered • Active
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs whitespace-pre-line text-[13.5px] ${
                    msg.sender === 'user'
                      ? 'bg-[#6366F1] text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 px-1 mt-1 font-mono">{msg.time}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs p-2 bg-white rounded-xl border border-slate-200 w-max">
                <span className="material-symbols-outlined text-indigo-600 animate-spin text-sm">
                  sync
                </span>
                ScholarCore AI is thinking...
              </div>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="p-2 bg-slate-100 border-t border-slate-200 flex overflow-x-auto gap-1.5 no-scrollbar">
            {suggestions.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="shrink-0 text-xs text-slate-700 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 px-2.5 py-1 rounded-full transition-colors whitespace-nowrap"
              >
                "{prompt}"
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about grades, fees, lost items..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#6366F1] focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white disabled:opacity-50 flex items-center justify-center shrink-0 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={onToggle}
        className="w-14 h-14 bg-[#6366F1] rounded-full flex items-center justify-center text-white shadow-xl shadow-[#6366F1]/30 hover:bg-[#4F46E5] transition-all hover:scale-105 active:scale-95 relative"
        title="ScholarCore AI Assistant"
      >
        <span className="material-symbols-outlined text-[28px]">smart_toy</span>
        <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-white" />
      </button>
    </div>
  );
};
