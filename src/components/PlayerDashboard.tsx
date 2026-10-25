import React from 'react';
import { PlayerState, PropertyOwnership } from '../shared/types.ts';
import { TokenIcon } from './TokenIcon.tsx';
import { COLOR_GROUP_DEFINITIONS, getTile } from '../shared/boardData.ts';
import { DollarSign, ShieldAlert, Award, ArrowLeftRight, Skull } from 'lucide-react';

interface PlayerDashboardProps {
  players: PlayerState[];
  currentTurnIndex: number;
  myPlayerId: string;
  properties: Record<number, PropertyOwnership>;
  onOpenTrade: (targetPlayerId: string) => void;
  onSelectProperty: (tileId: number) => void;
  onDeclareBankruptcy: () => void;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  players,
  currentTurnIndex,
  myPlayerId,
  properties,
  onOpenTrade,
  onSelectProperty,
  onDeclareBankruptcy,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {players.map((p, idx) => {
        const isCurrentTurn = idx === currentTurnIndex;
        const isMe = p.id === myPlayerId;

        // Calculate player properties grouped by color
        const playerProps = Object.entries(properties)
          .filter(([, prop]) => prop.ownerId === p.id)
          .map(([idStr, prop]) => ({
            tile: getTile(parseInt(idStr, 10)),
            ownership: prop,
          }));

        // Calculate net worth
        let netWorth = p.cash;
        for (const item of playerProps) {
          netWorth += item.tile.price || 0;
          if (item.ownership.houses > 0 && item.tile.houseCost) {
            netWorth += item.ownership.houses * item.tile.houseCost;
          }
        }

        // Color monopolies count
        const colorGroups = ['brown', 'light_blue', 'pink', 'orange', 'red', 'yellow', 'green', 'dark_blue'] as const;
        const monopolies = colorGroups.filter((cg) => {
          const groupDef = COLOR_GROUP_DEFINITIONS[cg];
          return groupDef.tileIds.every((tId) => properties[tId]?.ownerId === p.id);
        });

        return (
          <div
            key={p.id}
            className={`relative rounded-2xl p-3.5 transition-all bg-white border-2 shadow-sm ${
              isCurrentTurn
                ? 'border-red-500 shadow-md ring-2 ring-red-400/30'
                : 'border-stone-200'
            } ${p.isBankrupt ? 'opacity-50 grayscale' : ''}`}
          >
            {/* Turn Marker Header */}
            {isCurrentTurn && (
              <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-red-600 text-white font-black text-[10px] uppercase rounded-full shadow tracking-wider animate-pulse">
                Giliran Aktif
              </span>
            )}

            {/* Player Info Row */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  <TokenIcon token={p.token} size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-stone-900 truncate flex items-center gap-1">
                    {p.name}
                    {isMe && <span className="text-[10px] text-blue-600 font-bold">(Anda)</span>}
                    {p.isBot && <span className="text-[10px] bg-stone-200 text-stone-700 px-1 py-0.2 rounded font-mono">BOT</span>}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium">
                    Kekayaan: <span className="font-bold text-stone-700">${netWorth}</span>
                  </div>
                </div>
              </div>

              {/* Cash Balance */}
              <div className={`text-right shrink-0 ${p.cash < 0 ? 'text-red-600 animate-bounce' : 'text-emerald-700'}`}>
                <div className="text-xs text-stone-500 font-semibold flex items-center justify-end">
                  <DollarSign size={12} /> Saldo
                </div>
                <div className="text-base font-black tracking-tight">${p.cash}</div>
              </div>
            </div>

            {/* Badges row: In jail, monopolies */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {p.inJail && (
                <span className="px-2 py-0.5 bg-stone-800 text-amber-400 font-bold text-[10px] rounded-md flex items-center gap-1">
                  <ShieldAlert size={12} /> Di Penjara ({p.jailTurns}/3)
                </span>
              )}
              {p.getOutOfJailCards > 0 && (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">
                  🎟️ {p.getOutOfJailCards} Bebas Penjara
                </span>
              )}
              {monopolies.length > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-black text-[10px] rounded-md flex items-center gap-1">
                  <Award size={12} /> {monopolies.length} Monopoli!
                </span>
              )}
            </div>

            {/* Property mini chips */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-stone-500 uppercase">
                Aset Properti ({playerProps.length}):
              </div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                {playerProps.length === 0 ? (
                  <span className="text-[11px] italic text-stone-400">Belum ada aset</span>
                ) : (
                  playerProps.map(({ tile, ownership }) => {
                    const cDef = tile.colorGroup ? COLOR_GROUP_DEFINITIONS[tile.colorGroup] : null;
                    return (
                      <button
                        key={tile.id}
                        onClick={() => onSelectProperty(tile.id)}
                        title={`${tile.name} - ${ownership.houses === 5 ? 'Hotel' : `${ownership.houses} Rumah`}`}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer shadow-2xs"
                        style={{
                          backgroundColor: cDef ? `${cDef.hex}15` : '#f1f5f9',
                          borderColor: cDef?.hex || '#cbd5e1',
                          color: cDef?.hex || '#334155',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cDef?.hex || '#64748b' }} />
                        <span className="truncate max-w-[70px]">{tile.name}</span>
                        {ownership.houses > 0 && (
                          <span className="text-[9px] bg-emerald-700 text-white px-1 rounded-full">
                            {ownership.houses === 5 ? 'H' : ownership.houses}
                          </span>
                        )}
                        {ownership.isMortgaged && <span className="text-[9px] text-red-600 font-black">G</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer buttons: Trade & Bankruptcy */}
            <div className="mt-2.5 pt-2 border-t border-stone-200 flex items-center justify-between gap-1">
              {!isMe && !p.isBankrupt && (
                <button
                  onClick={() => onOpenTrade(p.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                >
                  <ArrowLeftRight size={12} /> Ajak Barter
                </button>
              )}

              {isMe && p.cash < 0 && !p.isBankrupt && (
                <button
                  onClick={onDeclareBankruptcy}
                  className="w-full flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-black text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow transition-colors cursor-pointer"
                >
                  <Skull size={12} /> Nyatakan Bangkrut
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
