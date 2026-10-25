import React from 'react';
import { BoardTile, ColorGroup, PropertyOwnership, PlayerState } from '../shared/types.ts';
import { COLOR_GROUP_DEFINITIONS } from '../shared/boardData.ts';
import { X, Home, Building2, ShieldAlert, DollarSign, Hammer } from 'lucide-react';

interface PropertyModalProps {
  tile: BoardTile | null;
  ownership: PropertyOwnership | null;
  owner: PlayerState | null;
  viewerPlayer: PlayerState | null;
  onClose: () => void;
  onBuildHouse: (tileId: number) => void;
  onSellHouse: (tileId: number) => void;
  onMortgage: (tileId: number) => void;
  onUnmortgage: (tileId: number) => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  tile,
  ownership,
  owner,
  viewerPlayer,
  onClose,
  onBuildHouse,
  onSellHouse,
  onMortgage,
  onUnmortgage,
}) => {
  if (!tile) return null;

  const isOwner = viewerPlayer && owner && viewerPlayer.id === owner.id;
  const colorDef = tile.colorGroup ? COLOR_GROUP_DEFINITIONS[tile.colorGroup] : null;
  const isMortgaged = ownership?.isMortgaged || false;
  const houses = ownership?.houses || 0;
  const mortgageValue = tile.mortgageValue || Math.floor((tile.price || 0) / 2);
  const unmortgageCost = Math.floor(mortgageValue * 1.1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/80 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Card Header */}
        <div
          className="p-4 text-center text-white relative shadow-inner"
          style={{ backgroundColor: colorDef?.hex || '#334155' }}
        >
          <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">
            SERTIFIKAT HAK MILIK
          </div>
          <h3 className="text-xl font-black tracking-tight">{tile.name}</h3>
          {tile.subName && <div className="text-xs opacity-90">{tile.subName}</div>}
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3 text-stone-800 text-sm">
          {/* Owner status */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <span className="text-xs font-semibold text-stone-500">Status Kepemilikan:</span>
            {owner ? (
              <span className="flex items-center gap-1.5 font-bold text-xs px-2.5 py-1 rounded-full bg-stone-100 border border-stone-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: owner.color }} />
                {owner.name} {isOwner && '(Anda)'}
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Tersedia (${tile.price})
              </span>
            )}
          </div>

          {/* Mortgaged Warning */}
          {isMortgaged && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold">
              <ShieldAlert size={16} /> Sedang Digadaikan (Tidak Menghasilkan Sewa)
            </div>
          )}

          {/* Rents Breakdown */}
          {tile.rent && tile.type === 'property' && (
            <div className="space-y-1.5 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div className="flex justify-between font-medium">
                <span>Sewa Dasar:</span>
                <span className="font-bold text-stone-900">${tile.rent[0]}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Dengan 1 Rumah:</span>
                <span className="font-semibold text-stone-900">${tile.rent[1]}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Dengan 2 Rumah:</span>
                <span className="font-semibold text-stone-900">${tile.rent[2]}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Dengan 3 Rumah:</span>
                <span className="font-semibold text-stone-900">${tile.rent[3]}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Dengan 4 Rumah:</span>
                <span className="font-semibold text-stone-900">${tile.rent[4]}</span>
              </div>
              <div className="flex justify-between font-bold text-red-700 pt-1 border-t border-stone-200">
                <span>Dengan HOTEL:</span>
                <span>${tile.rent[5]}</span>
              </div>
            </div>
          )}

          {/* Railroad rents */}
          {tile.type === 'railroad' && (
            <div className="space-y-1 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div className="text-[11px] font-bold text-stone-600 mb-1">Tarif Sewa Stasiun:</div>
              <div className="flex justify-between"><span>Punya 1 Stasiun:</span><span className="font-bold">$25</span></div>
              <div className="flex justify-between"><span>Punya 2 Stasiun:</span><span className="font-bold">$50</span></div>
              <div className="flex justify-between"><span>Punya 3 Stasiun:</span><span className="font-bold">$100</span></div>
              <div className="flex justify-between"><span>Punya 4 Stasiun:</span><span className="font-bold text-indigo-700">$200</span></div>
            </div>
          )}

          {/* Utility rents */}
          {tile.type === 'utility' && (
            <div className="space-y-1 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div className="text-[11px] font-bold text-stone-600 mb-1">Tarif Fasilitas Umum:</div>
              <div className="flex justify-between"><span>Punya 1 Utilitas:</span><span className="font-bold">4x Jumlah Dadu</span></div>
              <div className="flex justify-between"><span>Punya 2 Utilitas:</span><span className="font-bold text-emerald-700">10x Jumlah Dadu</span></div>
            </div>
          )}

          {/* Costs footer */}
          <div className="pt-2 border-t border-stone-200 text-xs text-stone-600 flex justify-between">
            {tile.houseCost && (
              <div>
                Biaya Rumah: <span className="font-bold text-stone-900">${tile.houseCost}</span>
              </div>
            )}
            <div>
              Nilai Gadai: <span className="font-bold text-stone-900">${mortgageValue}</span>
            </div>
          </div>

          {/* Owner interactive action controls */}
          {isOwner && (
            <div className="pt-3 border-t border-stone-200 space-y-2">
              <div className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <Hammer size={14} /> Kelola Aset Anda
              </div>

              {/* Build / Sell Houses */}
              {tile.type === 'property' && tile.houseCost && !isMortgaged && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onBuildHouse(tile.id)}
                    disabled={houses >= 5 || (viewerPlayer.cash < tile.houseCost)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow cursor-pointer"
                  >
                    <Home size={14} />
                    {houses >= 4 ? 'Bangun Hotel' : 'Beli Rumah'} (${tile.houseCost})
                  </button>

                  <button
                    onClick={() => onSellHouse(tile.id)}
                    disabled={houses <= 0}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 disabled:pointer-events-none rounded-xl border border-amber-300 shadow cursor-pointer"
                  >
                    <Building2 size={14} />
                    Jual Rumah (+${Math.floor(tile.houseCost / 2)})
                  </button>
                </div>
              )}

              {/* Mortgage / Unmortgage */}
              <div className="w-full">
                {!isMortgaged ? (
                  <button
                    onClick={() => onMortgage(tile.id)}
                    disabled={houses > 0}
                    className="w-full py-2 px-3 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:pointer-events-none rounded-xl border border-stone-300 shadow-sm cursor-pointer"
                  >
                    Gadaikan ke Bank (+${mortgageValue})
                  </button>
                ) : (
                  <button
                    onClick={() => onUnmortgage(tile.id)}
                    disabled={viewerPlayer.cash < unmortgageCost}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow cursor-pointer"
                  >
                    Tebus Gadai (-${unmortgageCost})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
