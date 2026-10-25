import React, { useState } from 'react';
import { sound } from '../utils/audio.ts';
import { Dices, KeyRound, DollarSign } from 'lucide-react';
import { PlayerState } from '../shared/types.ts';

interface DiceRollerProps {
  dice: [number, number];
  isCurrentTurn: boolean;
  hasRolled: boolean;
  canRoll: boolean;
  currentPlayer: PlayerState;
  onRoll: () => void;
  onPayFine: () => void;
  onUseCard: () => void;
}

// Dot positions on a standard 3x3 dice face
const DOT_PATTERNS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export const DiceRoller: React.FC<DiceRollerProps> = ({
  dice,
  isCurrentTurn,
  hasRolled,
  canRoll,
  currentPlayer,
  onRoll,
  onPayFine,
  onUseCard,
}) => {
  const [isRolling, setIsRolling] = useState(false);

  const handleRollClick = () => {
    if (!canRoll || isRolling) return;
    setIsRolling(true);
    sound.playDiceRoll();

    setTimeout(() => {
      onRoll();
      setIsRolling(false);
    }, 450);
  };

  const isDouble = dice[0] === dice[1] && hasRolled;

  const renderDie = (val: number, idx: number) => {
    const dots = DOT_PATTERNS[val] || [4];

    return (
      <div
        key={idx}
        className={`w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl shadow-lg border-2 border-stone-300 p-2.5 grid grid-cols-3 grid-rows-3 gap-1 relative transform transition-transform duration-300 ${
          isRolling ? 'rotate-12 scale-95 shadow-inner' : 'hover:scale-105'
        }`}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
          <div key={pos} className="flex items-center justify-center">
            {dots.includes(pos) && (
              <span className={`w-2.5 h-2.5 rounded-full ${isDouble ? 'bg-red-600 shadow-sm' : 'bg-stone-800'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200">
      {/* Dice Face Display */}
      <div className="flex items-center gap-4">
        {renderDie(dice[0], 0)}
        {renderDie(dice[1], 1)}
      </div>

      {/* Double Badge */}
      {isDouble && (
        <span className="px-3 py-0.5 text-xs font-black uppercase tracking-wider bg-red-100 text-red-700 rounded-full border border-red-300 animate-pulse">
          🎲 DOUBLE! DAPAT GILIRAN LAGI!
        </span>
      )}

      {/* Jail Options */}
      {isCurrentTurn && currentPlayer.inJail && !hasRolled && (
        <div className="flex flex-wrap gap-2 justify-center w-full mt-1">
          {currentPlayer.cash >= 50 && (
            <button
              onClick={onPayFine}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 transition-colors shadow-sm cursor-pointer"
            >
              <DollarSign size={14} /> Bayar Denda $50
            </button>
          )}
          {currentPlayer.getOutOfJailCards > 0 && (
            <button
              onClick={onUseCard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg border border-emerald-300 transition-colors shadow-sm cursor-pointer"
            >
              <KeyRound size={14} /> Pakai Kartu Bebas
            </button>
          )}
        </div>
      )}

      {/* Roll Action Button */}
      {isCurrentTurn && canRoll && (
        <button
          onClick={handleRollClick}
          disabled={isRolling}
          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Dices size={18} className={isRolling ? 'animate-spin' : ''} />
          {isRolling ? 'Mengocok...' : 'Lempar Dadu'}
        </button>
      )}

      {!isCurrentTurn && (
        <div className="text-xs text-stone-500 font-medium">
          Menunggu giliran <span className="font-bold text-stone-700">{currentPlayer.name}</span>...
        </div>
      )}
    </div>
  );
};
