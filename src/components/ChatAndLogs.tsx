import React, { useState, useRef, useEffect } from 'react';
import { GameLogEntry, PlayerState } from '../shared/types.ts';
import { MessageSquare, ScrollText, Send, Smile } from 'lucide-react';

interface ChatAndLogsProps {
  logs: GameLogEntry[];
  players: PlayerState[];
  onSendMessage: (message: string) => void;
}

export const ChatAndLogs: React.FC<ChatAndLogsProps> = ({ logs, players, onSendMessage }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'chat'>('all');
  const [inputMessage, setInputMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage);
    setInputMessage('');
  };

  const quickMessages = [
    'Halo semua! 👋',
    'Ada yang mau barter properti?',
    'Aduh sial kena denda! 😭',
    'Semoga beruntung! 🎲',
    'GG Semuanya! 🏆',
  ];

  const filteredLogs = activeTab === 'chat' ? logs.filter((l) => l.type === 'chat') : logs;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-stone-200 bg-stone-50 p-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <ScrollText size={14} /> Aktivitas ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <MessageSquare size={14} /> Obrolan ({logs.filter((l) => l.type === 'chat').length})
        </button>
      </div>

      {/* Log Feed */}
      <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-stone-400 italic py-8">Belum ada aktivitas.</div>
        ) : (
          filteredLogs.map((log) => {
            const player = log.playerId ? players.find((p) => p.id === log.playerId) : null;

            return (
              <div
                key={log.id}
                className={`p-2 rounded-xl transition-all leading-snug ${
                  log.type === 'chat'
                    ? 'bg-indigo-50/70 border border-indigo-100 text-stone-900'
                    : log.type === 'buy'
                    ? 'bg-emerald-50/80 border border-emerald-100 text-emerald-950'
                    : log.type === 'rent'
                    ? 'bg-amber-50/80 border border-amber-100 text-amber-950'
                    : log.type === 'jail' || log.type === 'bankruptcy'
                    ? 'bg-red-50/80 border border-red-100 text-red-950'
                    : 'bg-stone-50 border border-stone-100 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[10px] text-stone-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {player && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name}
                    </span>
                  )}
                </div>
                <div className="font-medium break-words">{log.text}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick message bubbles */}
      <div className="px-2 py-1.5 bg-stone-50 border-t border-stone-200 flex gap-1 overflow-x-auto whitespace-nowrap">
        {quickMessages.map((msg, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(msg)}
            className="text-[10px] font-semibold text-stone-600 bg-white hover:bg-stone-100 border border-stone-300 rounded-full px-2 py-0.5 shrink-0 cursor-pointer shadow-2xs"
          >
            {msg}
          </button>
        ))}
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="p-2 bg-white border-t border-stone-200 flex items-center gap-1.5">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Tulis pesan obrolan..."
          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50"
        />
        <button
          type="submit"
          className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow cursor-pointer transition-colors"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
