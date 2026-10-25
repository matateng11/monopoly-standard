import React, { useState } from 'react';
import { AuctionState, PlayerState } from '../shared/types.ts';
import { getTile, COLOR_GROUP_DEFINITIONS } from '../shared/boardData.ts';
import { Gavel, Clock, ArrowUpRight, Ban } from 'lucide-react';

interface AuctionModalProps {
  auction: AuctionState;
  players: PlayerState[];
  myPlayerId: string;
  onBid: (amount: number) => void;
  onPass: () => void;
}

export const AuctionModal: React.FC<AuctionModalProps> = ({
  auction,
  players,
  myPlayerId,
  onBid,
  onPass,
}) => {
  const tile = getTile(auction.tileId);
  const colorDef = tile.colorGroup ? COLOR_GROUP_DEFINITIONS[tile.colorGroup] : null;

  const highestBidder = players.find((p) => p.id === auction.highestBidderId);
  const myPlayer = players.find((p) => p.id === myPlayerId);
  const isParticipant = auction.participants.includes(myPlayerId);
  const [customBid, setCustomBid] = useState<string>('');

  const minNextBid = auction.currentBid + 10;
  const canAffordMin = myPlayer ? myPlayer.cash >= minNextBid : false;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customBid, 10);
    if (!isNaN(val) && val > auction.currentBid && myPlayer && myPlayer.cash >= val) {
      onBid(val);
      setCustomBid('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-amber-500">
        {/* Header */}
        <div className="bg-amber-500 p-3 text-stone-900 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
            <Gavel size={20} /> LELANG PROPERTI TERBUKA
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-600/30 rounded-full font-bold text-xs">
            <Clock size={14} className="animate-spin" /> {auction.timeRemaining}s
          </div>
        </div>

        {/* Property preview */}
        <div className="p-4 space-y-4">
          <div className="rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <div
              className="py-2.5 px-4 text-center text-white font-black text-base"
              style={{ backgroundColor: colorDef?.hex || '#334155' }}
            >
              {tile.name}
              {tile.subName && <div className="text-xs font-normal opacity-90">{tile.subName}</div>}
            </div>
            <div className="p-3 bg-stone-50 flex justify-around text-xs text-stone-600">
              <div>Harga Resmi: <span className="font-bold text-stone-900">${tile.price}</span></div>
              {tile.rent && <div>Sewa Awal: <span className="font-bold text-stone-900">${tile.rent[0]}</span></div>}
            </div>
          </div>

          {/* Current Bid Display */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <div className="text-xs uppercase font-bold text-amber-800">Tawaran Tertinggi Saat Ini</div>
            <div className="text-3xl font-black text-amber-900 my-1">${auction.currentBid}</div>
            <div className="text-xs text-stone-600 font-medium">
              Oleh:{' '}
              {highestBidder ? (
                <span className="font-bold text-stone-900" style={{ color: highestBidder.color }}>
                  {highestBidder.name} {highestBidder.id === myPlayerId && '(Anda)'}
                </span>
              ) : (
                <span className="italic">Belum ada penawar (Harga buka)</span>
              )}
            </div>
          </div>

          {/* User Bid Controls */}
          {isParticipant && myPlayer && !myPlayer.isBankrupt ? (
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-medium">Saldo Tunai Anda:</span>
                <span className="font-bold text-emerald-700">${myPlayer.cash}</span>
              </div>

              {/* Quick increment buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[10, 50, 100].map((inc) => {
                  const targetBid = auction.currentBid + inc;
                  const canAfford = myPlayer.cash >= targetBid;
                  return (
                    <button
                      key={inc}
                      onClick={() => onBid(targetBid)}
                      disabled={!canAfford}
                      className="py-2 px-2 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:pointer-events-none rounded-xl border border-stone-300 shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowUpRight size={14} className="text-amber-600" />
                      +${inc} (${targetBid})
                    </button>
                  );
                })}
              </div>

              {/* Custom Bid Input */}
              <form onSubmit={handleCustomSubmit} className="flex gap-2">
                <input
                  type="number"
                  min={minNextBid}
                  max={myPlayer.cash}
                  value={customBid}
                  onChange={(e) => setCustomBid(e.target.value)}
                  placeholder={`Min $${minNextBid}`}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!canAffordMin}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Tawar
                </button>
              </form>

              {/* Pass button */}
              <button
                onClick={onPass}
                className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Ban size={15} /> Mundur Dari Lelang Ini (Pas)
              </button>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-stone-500 font-medium bg-stone-100 rounded-xl">
              Anda tidak aktif dalam lelang ini atau sudah mengundurkan diri.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
