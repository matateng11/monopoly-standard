import React from 'react';
import {
  BoardTile,
  GameState,
  PlayerState,
  PropertyOwnership,
} from '../shared/types.ts';
import { BOARD_TILES, COLOR_GROUP_DEFINITIONS, getTile } from '../shared/boardData.ts';
import { TokenIcon } from './TokenIcon.tsx';
import { DiceRoller } from './DiceRoller.tsx';
import {
  Train,
  Zap,
  Droplets,
  HelpCircle,
  PackageOpen,
  DollarSign,
  Lock,
  Compass,
  Building,
  CheckCircle2,
  XCircle,
  Home,
  Clock,
  Sparkles,
} from 'lucide-react';

interface GameBoardProps {
  gameState: GameState;
  myPlayerId: string;
  onTileClick: (tileId: number) => void;
  onRollDice: () => void;
  onBuyProperty: () => void;
  onDeclineProperty: () => void;
  onPayFine: () => void;
  onUseCard: () => void;
  onEndTurn: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  myPlayerId,
  onTileClick,
  onRollDice,
  onBuyProperty,
  onDeclineProperty,
  onPayFine,
  onUseCard,
  onEndTurn,
}) => {
  const {
    players,
    currentTurnIndex,
    dice,
    hasRolled,
    properties,
    pendingBuyTileId,
    drawnCard,
    turnTimer,
  } = gameState;

  const currentPlayer = players[currentTurnIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const canRoll = isMyTurn && !hasRolled && !pendingBuyTileId;

  // Map tile position to grid coordinates (11x11 grid)
  const getGridPosition = (id: number): { gridColumn: number; gridRow: number } => {
    // 0: Bottom Right
    if (id === 0) return { gridColumn: 11, gridRow: 11 };
    // 1 to 9: Bottom Row (Right to Left) -> col 10 down to 2, row 11
    if (id >= 1 && id <= 9) return { gridColumn: 11 - id, gridRow: 11 };
    // 10: Bottom Left Corner (Jail)
    if (id === 10) return { gridColumn: 1, gridRow: 11 };
    // 11 to 19: Left Column (Bottom to Top) -> col 1, row 10 down to 2
    if (id >= 11 && id <= 19) return { gridColumn: 1, gridRow: 11 - (id - 10) };
    // 20: Top Left Corner (Free Parking)
    if (id === 20) return { gridColumn: 1, gridRow: 1 };
    // 21 to 29: Top Row (Left to Right) -> col 2 up to 10, row 1
    if (id >= 21 && id <= 29) return { gridColumn: id - 19, gridRow: 1 };
    // 30: Top Right Corner (Go to Jail)
    if (id === 30) return { gridColumn: 11, gridRow: 1 };
    // 31 to 39: Right Column (Top to Bottom) -> col 11, row 2 up to 10
    return { gridColumn: 11, gridRow: id - 29 };
  };

  const getTileOrientation = (id: number): 'bottom' | 'left' | 'top' | 'right' | 'corner' => {
    if (id === 0 || id === 10 || id === 20 || id === 30) return 'corner';
    if (id >= 1 && id <= 9) return 'bottom';
    if (id >= 11 && id <= 19) return 'left';
    if (id >= 21 && id <= 29) return 'top';
    return 'right';
  };

  const renderTileContent = (tile: BoardTile) => {
    const ownership: PropertyOwnership | undefined = properties[tile.id];
    const owner = ownership?.ownerId ? players.find((p) => p.id === ownership.ownerId) : null;
    const colorDef = tile.colorGroup ? COLOR_GROUP_DEFINITIONS[tile.colorGroup] : null;
    const orientation = getTileOrientation(tile.id);

    // Special icons for non-color tiles
    let icon = null;
    if (tile.type === 'railroad') icon = <Train size={13} className="text-stone-700" />;
    else if (tile.type === 'utility') {
      icon = tile.id === 12 ? <Zap size={13} className="text-amber-500" /> : <Droplets size={13} className="text-blue-500" />;
    } else if (tile.type === 'chance') icon = <HelpCircle size={15} className="text-orange-600 animate-pulse" />;
    else if (tile.type === 'community_chest') icon = <PackageOpen size={15} className="text-blue-600" />;
    else if (tile.type === 'tax') icon = <DollarSign size={13} className="text-stone-800" />;
    else if (tile.id === 0) icon = <Compass size={18} className="text-red-600" />;
    else if (tile.id === 10) icon = <Lock size={16} className="text-amber-700" />;
    else if (tile.id === 20) icon = <Building size={16} className="text-emerald-700" />;
    else if (tile.id === 30) icon = <Lock size={18} className="text-red-600" />;

    const hasHouses = (ownership?.houses || 0) > 0;
    const isHotel = ownership?.houses === 5;

    return (
      <div className="w-full h-full flex flex-col justify-between relative p-0.5 select-none text-[9px] sm:text-[10px] leading-tight">
        {/* Color bar on regular properties */}
        {tile.type === 'property' && colorDef && (
          <div
            className={`w-full h-3 sm:h-4 shrink-0 rounded-t-[2px] shadow-2xs flex items-center justify-center gap-0.5 ${
              orientation === 'top' ? 'order-last rounded-t-none rounded-b-[2px]' : ''
            }`}
            style={{ backgroundColor: colorDef.hex }}
          >
            {hasHouses && (
              <div className="flex items-center gap-0.5 px-0.5">
                {isHotel ? (
                  <span className="w-2.5 h-2 bg-red-700 rounded-[1px] text-[7px] text-white font-black flex items-center justify-center">
                    H
                  </span>
                ) : (
                  Array.from({ length: ownership?.houses || 0 }).map((_, i) => (
                    <span key={i} className="w-1.5 h-1.5 bg-emerald-400 rounded-2xs shadow-xs" />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-0.5 min-h-0">
          {icon && <div className="mb-0.5 shrink-0">{icon}</div>}
          <div className="font-extrabold text-stone-800 line-clamp-2 px-0.5 tracking-tight">
            {tile.name}
          </div>
          {tile.price && (
            <div className="font-bold text-stone-600 text-[8px] sm:text-[9px]">
              ${tile.price}
            </div>
          )}
          {tile.type === 'tax' && tile.taxAmount && (
            <div className="font-bold text-red-600 text-[8px]">-${tile.taxAmount}</div>
          )}
        </div>

        {/* Owner indicator stripe */}
        {owner && (
          <div
            className="w-full h-1 shrink-0 rounded-b-xs"
            style={{ backgroundColor: owner.color }}
            title={`Pemilik: ${owner.name}`}
          />
        )}

        {/* Mortgaged indicator badge */}
        {ownership?.isMortgaged && (
          <div className="absolute inset-0 bg-red-900/60 backdrop-blur-[1px] flex items-center justify-center text-white font-black text-[9px] tracking-wider rotate-12">
            GADAI
          </div>
        )}

        {/* Players on this tile */}
        <div className="absolute bottom-0.5 left-0.5 right-0.5 flex flex-wrap gap-0.5 justify-center items-center pointer-events-none z-10">
          {players
            .filter((p) => p.position === tile.id && !p.isBankrupt)
            .map((p) => (
              <div
                key={p.id}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white shadow-md border border-white transform hover:scale-125 transition-transform"
                style={{ backgroundColor: p.color }}
                title={`${p.name}`}
              >
                <TokenIcon token={p.token} size={11} />
              </div>
            ))}
        </div>
      </div>
    );
  };

  const pendingTile = pendingBuyTileId !== null ? getTile(pendingBuyTileId) : null;
  const pendingColor = pendingTile?.colorGroup ? COLOR_GROUP_DEFINITIONS[pendingTile.colorGroup] : null;

  return (
    <div className="relative w-full max-w-[760px] aspect-square mx-auto bg-[#CDE6D0] p-1.5 sm:p-2.5 rounded-3xl shadow-2xl border-4 sm:border-8 border-stone-800">
      {/* 11x11 Grid Layout */}
      <div className="w-full h-full grid grid-cols-11 grid-rows-11 gap-[2px] sm:gap-1 bg-stone-300 rounded-2xl overflow-hidden p-[2px]">
        {/* Render 40 tiles */}
        {BOARD_TILES.map((tile) => {
          const { gridColumn, gridRow } = getGridPosition(tile.id);
          const isCorner = tile.id === 0 || tile.id === 10 || tile.id === 20 || tile.id === 30;

          return (
            <div
              key={tile.id}
              onClick={() => onTileClick(tile.id)}
              style={{ gridColumn, gridRow }}
              className={`bg-[#FAF8E7] hover:bg-amber-50 cursor-pointer transition-colors relative border border-stone-300 flex items-center justify-center ${
                isCorner ? 'bg-[#EAE4C8]' : ''
              }`}
            >
              {renderTileContent(tile)}
            </div>
          );
        })}

        {/* CENTER STAGE (Occupies 9x9 from row 2 to 10 and col 2 to 10) */}
        <div
          style={{ gridColumn: '2 / 11', gridRow: '2 / 11' }}
          className="relative bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-900 p-3 sm:p-5 flex flex-col justify-between items-center text-white overflow-hidden rounded-xl shadow-inner border border-emerald-800/40"
        >
          {/* Subtle monopoly board watermarks */}
          <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
            <span className="text-8xl sm:text-9xl font-black uppercase tracking-widest text-white">
              MONOPOLY
            </span>
          </div>

          {/* Top Header in Center */}
          <div className="w-full flex items-center justify-between z-10">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-red-600 rounded-lg font-black tracking-wider text-white text-xs sm:text-sm uppercase shadow-md flex items-center gap-1.5 border border-red-400">
                <Sparkles size={14} /> MONOPOLI
              </div>
              <span className="text-[10px] sm:text-xs text-emerald-200/80 font-semibold tracking-wide">
                Ruang: <span className="font-mono font-bold text-white">{gameState.roomCode}</span>
              </span>
            </div>

            {/* Turn countdown timer badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-800/80 border border-stone-600 text-xs font-bold text-amber-300">
              <Clock size={13} className="animate-pulse" />
              <span>{turnTimer}s</span>
            </div>
          </div>

          {/* Middle Hub: Cards, Purchases, or Dice Roller */}
          <div className="w-full max-w-md my-auto flex flex-col items-center gap-3 z-10 py-1">
            {/* 1. DRAWN CHANCE / COMMUNITY CHEST CARD POPUP */}
            {drawnCard && (
              <div className="w-full p-3.5 bg-white text-stone-900 rounded-2xl shadow-xl border-2 border-amber-400 animate-in zoom-in-95">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-700 mb-1">
                  <span>{drawnCard.card.type === 'chance' ? 'Kartu Kesempatan' : 'Kartu Dana Umum'}</span>
                  <span>{players.find((p) => p.id === drawnCard.playerId)?.name}</span>
                </div>
                <h4 className="text-sm font-black text-stone-900">{drawnCard.card.title}</h4>
                <p className="text-xs text-stone-600 mt-1 leading-snug">{drawnCard.card.description}</p>
              </div>
            )}

            {/* 2. PENDING PURCHASE DECISION BANNER */}
            {pendingTile && isMyTurn && (
              <div className="w-full p-3.5 bg-white text-stone-900 rounded-2xl shadow-xl border-2 border-emerald-500 animate-in zoom-in-95 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500">Petak Belum Bertuan</span>
                    <h4 className="text-base font-black flex items-center gap-1.5">
                      {pendingColor && (
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pendingColor.hex }} />
                      )}
                      {pendingTile.name}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 block">Harga</span>
                    <span className="text-lg font-black text-emerald-700">${pendingTile.price}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={onBuyProperty}
                    disabled={currentPlayer.cash < (pendingTile.price || 0)}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <CheckCircle2 size={16} /> Beli Sekarang
                  </button>
                  <button
                    onClick={onDeclineProperty}
                    className="py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <XCircle size={16} /> Tolak &amp; Lelang
                  </button>
                </div>
              </div>
            )}

            {/* If pending tile but NOT my turn */}
            {pendingTile && !isMyTurn && (
              <div className="p-3 bg-stone-900/80 backdrop-blur rounded-xl border border-stone-700 text-center text-xs text-stone-300">
                Menunggu <span className="font-bold text-white">{currentPlayer?.name}</span> memutuskan untuk membeli{' '}
                <span className="font-bold text-amber-300">{pendingTile.name}</span> (${pendingTile.price}) atau melelangnya...
              </div>
            )}

            {/* 3. DICE ROLLER COMPONENT */}
            <DiceRoller
              dice={dice}
              isCurrentTurn={isMyTurn}
              hasRolled={hasRolled}
              canRoll={canRoll}
              currentPlayer={currentPlayer}
              onRoll={onRollDice}
              onPayFine={onPayFine}
              onUseCard={onUseCard}
            />
          </div>

          {/* Bottom Center Bar: Turn Actions */}
          <div className="w-full flex items-center justify-between z-10 pt-1 border-t border-emerald-800/40">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-300">Giliran:</span>
              <div
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: currentPlayer?.color || '#ef4444' }}
              >
                <TokenIcon token={currentPlayer?.token || 'car'} size={12} />
                <span>{currentPlayer?.name}</span>
              </div>
            </div>

            {/* End Turn Button */}
            {isMyTurn && hasRolled && !pendingBuyTileId && (
              <button
                onClick={onEndTurn}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs uppercase rounded-xl shadow-md transition-all cursor-pointer animate-bounce"
              >
                Selesai &amp; Oper Giliran &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
