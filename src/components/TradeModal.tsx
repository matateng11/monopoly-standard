import React, { useState } from 'react';
import { TradeOffer, PlayerState, PropertyOwnership } from '../shared/types.ts';
import { getTile, COLOR_GROUP_DEFINITIONS } from '../shared/boardData.ts';
import { ArrowLeftRight, Check, X, Ban, DollarSign, KeyRound } from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  activeTrade: TradeOffer | null;
  myPlayer: PlayerState;
  players: PlayerState[];
  properties: Record<number, PropertyOwnership>;
  onClose: () => void;
  onProposeTrade: (offer: Omit<TradeOffer, 'id' | 'status' | 'senderId'>) => void;
  onAcceptTrade: () => void;
  onDeclineTrade: () => void;
  onCancelTrade: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  activeTrade,
  myPlayer,
  players,
  properties,
  onClose,
  onProposeTrade,
  onAcceptTrade,
  onDeclineTrade,
  onCancelTrade,
}) => {
  const otherPlayers = players.filter((p) => p.id !== myPlayer.id && !p.isBankrupt);

  const [selectedTargetId, setSelectedTargetId] = useState<string>(otherPlayers[0]?.id || '');
  const [offeredCash, setOfferedCash] = useState<number>(0);
  const [offeredProperties, setOfferedProperties] = useState<number[]>([]);
  const [offeredJailCards, setOfferedJailCards] = useState<number>(0);

  const [requestedCash, setRequestedCash] = useState<number>(0);
  const [requestedProperties, setRequestedProperties] = useState<number[]>([]);
  const [requestedJailCards, setRequestedJailCards] = useState<number>(0);

  if (!isOpen && !activeTrade) return null;

  // If there's an active trade involving this player:
  const isSender = activeTrade?.senderId === myPlayer.id;
  const isReceiver = activeTrade?.receiverId === myPlayer.id;

  const targetPlayer = players.find((p) => p.id === (activeTrade ? activeTrade.receiverId : selectedTargetId));
  const senderPlayer = players.find((p) => p.id === activeTrade?.senderId);

  // My owned properties (that don't have houses)
  const myOwnedProps = Object.entries(properties)
    .filter(([idStr, prop]) => {
      const tile = getTile(parseInt(idStr, 10));
      return prop.ownerId === myPlayer.id && (prop.houses || 0) === 0;
    })
    .map(([idStr]) => getTile(parseInt(idStr, 10)));

  // Target player owned properties (that don't have houses)
  const targetOwnedProps = targetPlayer
    ? Object.entries(properties)
        .filter(([idStr, prop]) => {
          return prop.ownerId === targetPlayer.id && (prop.houses || 0) === 0;
        })
        .map(([idStr]) => getTile(parseInt(idStr, 10)))
    : [];

  const handleToggleOfferProp = (id: number) => {
    setOfferedProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleToggleRequestProp = (id: number) => {
    setRequestedProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSendProposal = () => {
    if (!selectedTargetId) return;
    onProposeTrade({
      receiverId: selectedTargetId,
      offeredCash,
      offeredProperties,
      offeredJailCards,
      requestedCash,
      requestedProperties,
      requestedJailCards,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-indigo-600 p-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
            <ArrowLeftRight size={18} /> Barter & Negosiasi Properti
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ACTIVE TRADE RESPONSE VIEW (if receiver or sender) */}
        {activeTrade ? (
          <div className="p-5 space-y-5 overflow-y-auto">
            <div className="text-center">
              <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                {isReceiver ? 'Tawaran Barter Masuk!' : 'Menunggu Konfirmasi Lawan...'}
              </span>
              <p className="text-sm font-semibold text-stone-700 mt-2">
                Dari <span className="font-bold">{senderPlayer?.name}</span> kepada{' '}
                <span className="font-bold">{targetPlayer?.name}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* You Get */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs font-bold text-emerald-800 uppercase mb-2">
                  {isReceiver ? 'Yang Anda Terima:' : `Diberikan ke ${targetPlayer?.name}:`}
                </div>
                <div className="space-y-1.5 text-xs text-stone-800">
                  <div className="font-semibold flex items-center gap-1">
                    <DollarSign size={14} className="text-emerald-600" />
                    Uang Tunai: ${activeTrade.offeredCash}
                  </div>
                  {activeTrade.offeredJailCards > 0 && (
                    <div className="font-semibold flex items-center gap-1">
                      <KeyRound size={14} className="text-emerald-600" />
                      Kartu Bebas Penjara: {activeTrade.offeredJailCards}
                    </div>
                  )}
                  <div className="font-semibold pt-1">Sertifikat Properti:</div>
                  {activeTrade.offeredProperties.length === 0 ? (
                    <span className="italic text-stone-500">Tidak ada properti</span>
                  ) : (
                    activeTrade.offeredProperties.map((id) => {
                      const t = getTile(id);
                      const c = t.colorGroup ? COLOR_GROUP_DEFINITIONS[t.colorGroup] : null;
                      return (
                        <div key={id} className="flex items-center gap-2 p-1 bg-white rounded border border-stone-200">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c?.hex || '#999' }} />
                          <span className="font-bold">{t.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* You Give */}
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
                <div className="text-xs font-bold text-rose-800 uppercase mb-2">
                  {isReceiver ? 'Yang Diminta Dari Anda:' : `Diminta dari ${targetPlayer?.name}:`}
                </div>
                <div className="space-y-1.5 text-xs text-stone-800">
                  <div className="font-semibold flex items-center gap-1">
                    <DollarSign size={14} className="text-rose-600" />
                    Uang Tunai: ${activeTrade.requestedCash}
                  </div>
                  {activeTrade.requestedJailCards > 0 && (
                    <div className="font-semibold flex items-center gap-1">
                      <KeyRound size={14} className="text-rose-600" />
                      Kartu Bebas Penjara: {activeTrade.requestedJailCards}
                    </div>
                  )}
                  <div className="font-semibold pt-1">Sertifikat Properti:</div>
                  {activeTrade.requestedProperties.length === 0 ? (
                    <span className="italic text-stone-500">Tidak ada properti</span>
                  ) : (
                    activeTrade.requestedProperties.map((id) => {
                      const t = getTile(id);
                      const c = t.colorGroup ? COLOR_GROUP_DEFINITIONS[t.colorGroup] : null;
                      return (
                        <div key={id} className="flex items-center gap-2 p-1 bg-white rounded border border-stone-200">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c?.hex || '#999' }} />
                          <span className="font-bold">{t.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {isReceiver && (
                <>
                  <button
                    onClick={onAcceptTrade}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={16} /> Setujui Barter
                  </button>
                  <button
                    onClick={onDeclineTrade}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Ban size={16} /> Tolak Tawaran
                  </button>
                </>
              )}
              {isSender && (
                <button
                  onClick={onCancelTrade}
                  className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X size={16} /> Batalkan Tawaran Barter
                </button>
              )}
            </div>
          </div>
        ) : (
          /* PROPOSE NEW TRADE VIEW */
          <div className="p-4 space-y-4 overflow-y-auto">
            {/* Target Player Picker */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-stone-600">Ajak Barter Dengan:</label>
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {otherPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.cash})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Column: What You Offer */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="text-xs font-bold text-indigo-900 uppercase">Tawaran Anda</div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-600">Uang Tunai:</span>
                    <span className="font-bold text-indigo-600">${offeredCash}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={myPlayer.cash}
                    step={10}
                    value={offeredCash}
                    onChange={(e) => setOfferedCash(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>

                {myPlayer.getOutOfJailCards > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600">Kartu Bebas Penjara:</span>
                    <select
                      value={offeredJailCards}
                      onChange={(e) => setOfferedJailCards(parseInt(e.target.value, 10))}
                      className="px-2 py-1 text-xs border rounded"
                    >
                      {Array.from({ length: myPlayer.getOutOfJailCards + 1 }).map((_, i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="text-xs font-semibold text-stone-600 mb-1.5">Pilih Sertifikat Anda:</div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {myOwnedProps.length === 0 ? (
                      <span className="text-xs italic text-stone-400">Belum ada properti tanpa bangunan</span>
                    ) : (
                      myOwnedProps.map((t) => {
                        const c = t.colorGroup ? COLOR_GROUP_DEFINITIONS[t.colorGroup] : null;
                        const isChecked = offeredProperties.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer ${
                              isChecked ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-stone-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleOfferProp(t.id)}
                              className="rounded text-indigo-600"
                            />
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c?.hex || '#999' }} />
                            <span className="font-semibold">{t.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: What You Request */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="text-xs font-bold text-indigo-900 uppercase">
                  Permintaan Dari {targetPlayer?.name || 'Lawan'}
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-600">Uang Tunai:</span>
                    <span className="font-bold text-emerald-600">${requestedCash}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={targetPlayer ? targetPlayer.cash : 500}
                    step={10}
                    value={requestedCash}
                    onChange={(e) => setRequestedCash(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>

                {targetPlayer && targetPlayer.getOutOfJailCards > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600">Kartu Bebas Penjara:</span>
                    <select
                      value={requestedJailCards}
                      onChange={(e) => setRequestedJailCards(parseInt(e.target.value, 10))}
                      className="px-2 py-1 text-xs border rounded"
                    >
                      {Array.from({ length: targetPlayer.getOutOfJailCards + 1 }).map((_, i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="text-xs font-semibold text-stone-600 mb-1.5">Pilih Sertifikat Miliknya:</div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {targetOwnedProps.length === 0 ? (
                      <span className="text-xs italic text-stone-400">Pemain ini tidak memiliki properti tanpa bangunan</span>
                    ) : (
                      targetOwnedProps.map((t) => {
                        const c = t.colorGroup ? COLOR_GROUP_DEFINITIONS[t.colorGroup] : null;
                        const isChecked = requestedProperties.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer ${
                              isChecked ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-stone-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleRequestProp(t.id)}
                              className="rounded text-emerald-600"
                            />
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c?.hex || '#999' }} />
                            <span className="font-semibold">{t.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Propose Button */}
            <div className="pt-2">
              <button
                onClick={handleSendProposal}
                disabled={!selectedTargetId}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <ArrowLeftRight size={16} /> Ajukan Tawaran Barter Sekarang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
