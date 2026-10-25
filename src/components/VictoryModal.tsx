import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerState } from '../shared/types.ts';
import { TokenIcon } from './TokenIcon.tsx';
import { Trophy, RotateCcw, Award } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface VictoryModalProps {
  winnerId: string | null;
  players: PlayerState[];
  onPlayAgain: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ winnerId, players, onPlayAgain }) => {
  const winner = players.find((p) => p.id === winnerId);

  useEffect(() => {
    sound.playVictory();

    // Confetti cannon
    const end = Date.now() + 3 * 1000;
    const interval: NodeJS.Timeout = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-amber-400 text-center p-6 space-y-5 animate-in zoom-in-95">
        <div className="w-16 h-16 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-md">
          <Trophy size={36} />
        </div>

        <div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-widest rounded-full">
            PERMAINAN SELESAI
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            KONGKORAT MONOPOLI!
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Semua pemain lain telah dinyatakan bangkrut.
          </p>
        </div>

        {winner && (
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-2">
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: winner.color }}
            >
              <TokenIcon token={winner.token} size={28} />
            </div>
            <div className="font-black text-lg text-stone-900">{winner.name}</div>
            <div className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
              <Award size={15} /> Sisa Uang Kas: ${winner.cash}
            </div>
          </div>
        )}

        <button
          onClick={onPlayAgain}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <RotateCcw size={16} /> Main Lagi (Ke Lobi)
        </button>
      </div>
    </div>
  );
};
