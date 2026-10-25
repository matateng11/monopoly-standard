/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  ClientMessage,
  ServerMessage,
  PlayerToken,
  TradeOffer,
} from './shared/types.ts';
import { getTile } from './shared/boardData.ts';
import { Lobby } from './components/Lobby.tsx';
import { GameBoard } from './components/GameBoard.tsx';
import { PlayerDashboard } from './components/PlayerDashboard.tsx';
import { ChatAndLogs } from './components/ChatAndLogs.tsx';
import { PropertyModal } from './components/PropertyModal.tsx';
import { AuctionModal } from './components/AuctionModal.tsx';
import { TradeModal } from './components/TradeModal.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { RulesModal } from './components/RulesModal.tsx';
import { sound } from './utils/audio.ts';
import {
  Volume2,
  VolumeX,
  BookOpen,
  LogOut,
  Copy,
  Check,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>(() => {
    return sessionStorage.getItem('monopoly_player_id') || '';
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Send message helper
  const sendMessage = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Connect to WebSocket Server
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);

      // If we have an existing room saved in sessionStorage, rejoin
      const savedRoom = sessionStorage.getItem('monopoly_room_code');
      const savedName = localStorage.getItem('monopoly_player_name') || 'Pemain';
      const savedId = sessionStorage.getItem('monopoly_player_id');

      if (savedRoom && savedId) {
        ws.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            roomCode: savedRoom,
            playerName: savedName,
            token: 'car',
            playerId: savedId,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);
        if (data.type === 'ROOM_STATE') {
          setGameState(data.state);
          if (data.myPlayerId) {
            setMyPlayerId(data.myPlayerId);
            sessionStorage.setItem('monopoly_player_id', data.myPlayerId);
            sessionStorage.setItem('monopoly_room_code', data.state.roomCode);
          }
        } else if (data.type === 'ERROR') {
          showNotification(data.message);
        } else if (data.type === 'NOTIFICATION') {
          showNotification(data.message);
        }
      } catch (err) {
        console.error('Failed to parse WS data:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connectWebSocket]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleToggleMute = () => {
    sound.isMuted = !sound.isMuted;
    setIsMuted(sound.isMuted);
  };

  const handleCopyRoom = () => {
    if (!gameState) return;
    const shareUrl = `${window.location.origin}?room=${gameState.roomCode}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const handleLeaveRoom = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari ruangan ini?')) {
      sessionStorage.removeItem('monopoly_room_code');
      sessionStorage.removeItem('monopoly_player_id');
      window.location.href = window.location.origin;
    }
  };

  // Lobby actions
  const handleJoinRoom = (roomCode: string, playerName: string, token: PlayerToken) => {
    const existingId = sessionStorage.getItem('monopoly_player_id') || undefined;
    sendMessage({
      type: 'JOIN_ROOM',
      roomCode,
      playerName,
      token,
      playerId: existingId,
    });
  };

  const handleStartGame = () => {
    sendMessage({ type: 'START_GAME' });
  };

  const handleAddBot = () => {
    sendMessage({ type: 'ADD_BOT' });
  };

  const handleRemovePlayer = (playerId: string) => {
    sendMessage({ type: 'REMOVE_PLAYER', playerId });
  };

  // In-Game actions
  const handleRollDice = () => {
    sendMessage({ type: 'ROLL_DICE' });
  };

  const handleBuyProperty = () => {
    sound.playCash();
    sendMessage({ type: 'BUY_PROPERTY' });
  };

  const handleDeclineProperty = () => {
    sendMessage({ type: 'DECLINE_PROPERTY' });
  };

  const handleEndTurn = () => {
    sendMessage({ type: 'END_TURN' });
  };

  const handlePayFine = () => {
    sound.playCash();
    sendMessage({ type: 'PAY_JAIL_FINE' });
  };

  const handleUseCard = () => {
    sound.playCard();
    sendMessage({ type: 'USE_JAIL_CARD' });
  };

  const handleBidAuction = (amount: number) => {
    sendMessage({ type: 'BID_AUCTION', amount });
  };

  const handlePassAuction = () => {
    sendMessage({ type: 'PASS_AUCTION' });
  };

  const handleBuildHouse = (tileId: number) => {
    sound.playCash();
    sendMessage({ type: 'BUILD_HOUSE', tileId });
  };

  const handleSellHouse = (tileId: number) => {
    sound.playCash();
    sendMessage({ type: 'SELL_HOUSE', tileId });
  };

  const handleMortgage = (tileId: number) => {
    sound.playCash();
    sendMessage({ type: 'MORTGAGE_PROPERTY', tileId });
  };

  const handleUnmortgage = (tileId: number) => {
    sound.playCash();
    sendMessage({ type: 'UNMORTGAGE_PROPERTY', tileId });
  };

  const handleProposeTrade = (offer: Omit<TradeOffer, 'id' | 'status' | 'senderId'>) => {
    sendMessage({ type: 'PROPOSE_TRADE', offer });
    setIsTradeModalOpen(false);
  };

  const handleAcceptTrade = () => {
    sound.playCash();
    sendMessage({ type: 'ACCEPT_TRADE' });
  };

  const handleDeclineTrade = () => {
    sendMessage({ type: 'DECLINE_TRADE' });
  };

  const handleCancelTrade = () => {
    sendMessage({ type: 'CANCEL_TRADE' });
  };

  const handleDeclareBankruptcy = () => {
    if (confirm('Apakah Anda yakin ingin menyatakan bangkrut dan keluar dari permainan?')) {
      sound.playJailSlam();
      sendMessage({ type: 'DECLARE_BANKRUPTCY' });
    }
  };

  const handleSendMessage = (message: string) => {
    sendMessage({ type: 'SEND_CHAT', message });
  };

  // Find objects for modals
  const myPlayer = gameState?.players.find((p) => p.id === myPlayerId) || null;
  const selectedTile = selectedTileId !== null ? getTile(selectedTileId) : null;
  const selectedOwnership = selectedTileId !== null && gameState ? gameState.properties[selectedTileId] : null;
  const selectedOwner = selectedOwnership?.ownerId && gameState
    ? gameState.players.find((p) => p.id === selectedOwnership.ownerId) || null
    : null;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans select-none">
      {/* Top Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-stone-700 animate-in fade-in slide-in-from-top-2">
          {notification}
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-stone-200 px-3 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 rounded-lg text-white font-black text-xs uppercase shadow-sm">
            <Sparkles size={14} /> MONOPOLI
          </div>
          {gameState && (
            <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
              <span className="font-semibold hidden sm:inline">Ruangan:</span>
              <span className="font-mono font-bold text-stone-900">{gameState.roomCode}</span>
              <button
                onClick={handleCopyRoom}
                className="hover:text-stone-900 cursor-pointer ml-1 p-0.5"
                title="Salin Tautan Ruangan"
              >
                {copiedCode ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            </div>
          )}
        </div>

        {/* Right Nav Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Connection status */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${
              isConnected ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
            }`}
            title={isConnected ? 'Terhubung ke server' : 'Mencoba menghubungkan ulang...'}
          >
            {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span className="hidden sm:inline">{isConnected ? 'Online' : 'Offline'}</span>
          </div>

          {/* Rules Guide Button */}
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg border border-stone-200 transition-colors cursor-pointer"
          >
            <BookOpen size={14} className="text-stone-600" />
            <span className="hidden sm:inline">Panduan Aturan</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={handleToggleMute}
            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-200 transition-colors cursor-pointer"
            title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Leave Room Button */}
          {gameState && (
            <button
              onClick={handleLeaveRoom}
              className="p-1.5 bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 rounded-lg border border-stone-200 transition-colors cursor-pointer"
              title="Keluar Ruangan"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-2 sm:p-4 max-w-7xl w-full mx-auto flex flex-col justify-center">
        {/* If no room joined or status is 'lobby', render Lobby */}
        {!gameState || gameState.status === 'lobby' ? (
          <Lobby
            roomState={gameState}
            myPlayerId={myPlayerId}
            onJoinRoom={handleJoinRoom}
            onStartGame={handleStartGame}
            onAddBot={handleAddBot}
            onRemovePlayer={handleRemovePlayer}
          />
        ) : (
          /* ACTIVE GAME VIEW */
          <div className="space-y-4">
            {/* Top: 4-Player Status Dashboard */}
            <PlayerDashboard
              players={gameState.players}
              currentTurnIndex={gameState.currentTurnIndex}
              myPlayerId={myPlayerId}
              properties={gameState.properties}
              onOpenTrade={() => setIsTradeModalOpen(true)}
              onSelectProperty={(tileId) => setSelectedTileId(tileId)}
              onDeclareBankruptcy={handleDeclareBankruptcy}
            />

            {/* Main Game Layout: Board on Left, Chat and Feed on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Game Board Container */}
              <div className="lg:col-span-8 flex justify-center">
                <GameBoard
                  gameState={gameState}
                  myPlayerId={myPlayerId}
                  onTileClick={(tileId) => setSelectedTileId(tileId)}
                  onRollDice={handleRollDice}
                  onBuyProperty={handleBuyProperty}
                  onDeclineProperty={handleDeclineProperty}
                  onPayFine={handlePayFine}
                  onUseCard={handleUseCard}
                  onEndTurn={handleEndTurn}
                />
              </div>

              {/* Chat & Activity Logs Container */}
              <div className="lg:col-span-4 h-[420px] lg:h-[760px] sticky top-16">
                <ChatAndLogs
                  logs={gameState.logs}
                  players={gameState.players}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* OVERLAY MODALS */}

      {/* 1. Property Title Deed Modal */}
      <PropertyModal
        tile={selectedTile}
        ownership={selectedOwnership}
        owner={selectedOwner}
        viewerPlayer={myPlayer}
        onClose={() => setSelectedTileId(null)}
        onBuildHouse={handleBuildHouse}
        onSellHouse={handleSellHouse}
        onMortgage={handleMortgage}
        onUnmortgage={handleUnmortgage}
      />

      {/* 2. Live Auction Modal */}
      {gameState?.activeAuction && (
        <AuctionModal
          auction={gameState.activeAuction}
          players={gameState.players}
          myPlayerId={myPlayerId}
          onBid={handleBidAuction}
          onPass={handlePassAuction}
        />
      )}

      {/* 3. Barter / Trade Modal */}
      {myPlayer && gameState && (
        <TradeModal
          isOpen={isTradeModalOpen || gameState.activeTrade !== null}
          activeTrade={gameState.activeTrade}
          myPlayer={myPlayer}
          players={gameState.players}
          properties={gameState.properties}
          onClose={() => setIsTradeModalOpen(false)}
          onProposeTrade={handleProposeTrade}
          onAcceptTrade={handleAcceptTrade}
          onDeclineTrade={handleDeclineTrade}
          onCancelTrade={handleCancelTrade}
        />
      )}

      {/* 4. Victory / Game Over Modal */}
      {gameState?.status === 'game_over' && (
        <VictoryModal
          winnerId={gameState.winnerId}
          players={gameState.players}
          onPlayAgain={() => {
            setGameState(null);
            sessionStorage.removeItem('monopoly_room_code');
          }}
        />
      )}

      {/* 5. Official Rules Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}
