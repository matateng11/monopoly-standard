import React, { useState, useEffect } from 'react';
import { GameState, PlayerState, PlayerToken } from '../shared/types.ts';
import { TokenIcon, TOKEN_NAMES } from './TokenIcon.tsx';
import {
  Users,
  Copy,
  Check,
  Bot,
  Play,
  Share2,
  Sparkles,
  BookOpen,
  UserPlus,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface LobbyProps {
  roomState: GameState | null;
  myPlayerId: string;
  onJoinRoom: (roomCode: string, playerName: string, token: PlayerToken) => void;
  onStartGame: () => void;
  onAddBot: () => void;
  onRemovePlayer: (playerId: string) => void;
}

const AVAILABLE_TOKENS: PlayerToken[] = ['car', 'hat', 'thimble', 'dog', 'ship', 'cat'];

export const Lobby: React.FC<LobbyProps> = ({
  roomState,
  myPlayerId,
  onJoinRoom,
  onStartGame,
  onAddBot,
  onRemovePlayer,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [playerNameInput, setPlayerNameInput] = useState(() => {
    return localStorage.getItem('monopoly_player_name') || 'Pemain 1';
  });
  const [selectedToken, setSelectedToken] = useState<PlayerToken>('car');
  const [copied, setCopied] = useState(false);
  const [publicRooms, setPublicRooms] = useState<Array<{ roomCode: string; playerCount: number; hostName: string }>>([]);
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  // Check URL query param for invite link, e.g. ?room=ABCD12
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCodeInput(roomParam.toUpperCase());
    }
  }, []);

  // Fetch available rooms
  const fetchRooms = () => {
    fetch('/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (data.rooms) setPublicRooms(data.rooms);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = () => {
    sound.isMuted = !sound.isMuted;
    setIsMuted(sound.isMuted);
  };

  const handleCreateNewRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('monopoly_player_name', playerNameInput);
    onJoinRoom(code, playerNameInput, selectedToken);
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    localStorage.setItem('monopoly_player_name', playerNameInput);
    onJoinRoom(roomCodeInput.toUpperCase().trim(), playerNameInput, selectedToken);
  };

  const handleCopyCode = () => {
    if (!roomState) return;
    const shareUrl = `${window.location.origin}?room=${roomState.roomCode}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isHost = roomState?.hostId === myPlayerId;
  const canStart = isHost && roomState && roomState.players.length >= 2;

  // IF ALREADY INSIDE A LOBBY ROOM
  if (roomState && roomState.status === 'lobby') {
    const maxPlayers = 4;
    const emptySlots = maxPlayers - roomState.players.length;

    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in">
        {/* Lobby Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-6 text-white text-center relative">
          <button
            onClick={handleToggleMute}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors cursor-pointer text-white"
            title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest inline-block mb-2">
            Ruang Tunggu Monopoli
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">Persiapan Permainan</h2>
          <p className="text-xs sm:text-sm text-red-100 mt-1">
            Undang hingga 4 pemain atau tambahkan Bot Komputer untuk bertanding!
          </p>

          {/* Room Code Badge */}
          <div className="mt-4 inline-flex items-center gap-3 bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 shadow-sm">
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-red-200">Kode Ruangan:</div>
              <div className="text-2xl font-black tracking-widest font-mono text-white">
                {roomState.roomCode}
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-700 hover:bg-red-50 active:scale-95 text-xs font-bold rounded-xl shadow cursor-pointer transition-all"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? 'Tersalin!' : 'Salin Tautan'}
            </button>
          </div>
        </div>

        {/* Players Roster */}
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-stone-800 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                <Users size={16} className="text-red-600" /> Pemain Terdaftar ({roomState.players.length}/4)
              </h3>
              {isHost && emptySlots > 0 && (
                <button
                  onClick={onAddBot}
                  className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 transition-colors shadow-2xs cursor-pointer"
                >
                  <Bot size={15} className="text-indigo-600" /> + Tambah Bot (AI)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roomState.players.map((p, idx) => {
                const isPlayerHost = p.id === roomState.hostId;
                const isMe = p.id === myPlayerId;

                return (
                  <div
                    key={p.id}
                    className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                        style={{ backgroundColor: p.color }}
                      >
                        <TokenIcon token={p.token} size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-stone-900 text-xs sm:text-sm truncate flex items-center gap-1.5">
                          {p.name}
                          {isMe && <span className="text-[10px] text-blue-600 font-bold">(Anda)</span>}
                        </div>
                        <div className="text-[11px] text-stone-500 font-medium flex items-center gap-2">
                          <span>{TOKEN_NAMES[p.token]}</span>
                          {p.isBot && <span className="px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded font-mono text-[9px]">BOT</span>}
                          {isPlayerHost && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold text-[9px]">
                              HOST
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isHost && !isMe && (
                      <button
                        onClick={() => onRemovePlayer(p.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Keluarkan pemain"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Empty Slots Preview */}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="p-3.5 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center text-xs font-semibold text-stone-400"
                >
                  Slot Kosong {roomState.players.length + i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Rules Snapshot */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1.5">
            <div className="font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
              <BookOpen size={15} /> Aturan Standar Monopoli
            </div>
            <ul className="list-disc list-inside space-y-1 text-stone-700">
              <li>Modal awal setiap pemain: <span className="font-bold text-emerald-700">$1,500</span>.</li>
              <li>Lewat atau tiba di petak MULAI mendapat gaji <span className="font-bold text-emerald-700">$200</span>.</li>
              <li>Dadu kembar (Double) boleh melempar lagi! Jika 3x berturut-turut double langsung masuk penjara.</li>
              <li>Miliki semua petak dalam satu grup warna untuk mulai membangun Rumah dan Hotel secara merata.</li>
              <li>Bisa melakukan Barter (Trade) antar pemain secara real-time kapan saja!</li>
            </ul>
          </div>

          {/* Action Footer */}
          <div className="pt-2">
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:pointer-events-none text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Play size={18} />
                {canStart ? 'Mulai Permainan Sekarang!' : 'Butuh Minimal 2 Pemain Untuk Memulai'}
              </button>
            ) : (
              <div className="p-3.5 bg-stone-100 rounded-2xl text-center text-xs font-bold text-stone-600 animate-pulse">
                Menunggu Host ({roomState.players[0]?.name}) memulai permainan...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // INITIAL SCREEN: CREATE / JOIN ROOM
  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-red-600 via-rose-600 to-red-800 p-6 text-white text-center relative">
        <button
          onClick={handleToggleMute}
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors cursor-pointer text-white"
          title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles size={14} /> Game Papan Klasik
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">MONOPOLI ONLINE</h1>
        <p className="text-xs sm:text-sm text-red-100 mt-1 max-w-md mx-auto">
          Multiplayer real-time hingga 4 pemain dengan aturan monopoli standar resmi.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Player Name & Token Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
              Nama Pemain Anda:
            </label>
            <input
              type="text"
              maxLength={15}
              value={playerNameInput}
              onChange={(e) => setPlayerNameInput(e.target.value)}
              placeholder="Masukkan nama Anda..."
              className="w-full px-4 py-2.5 text-sm font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
              Pilih Bidak / Token Anda:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AVAILABLE_TOKENS.map((token) => {
                const isSelected = selectedToken === token;
                return (
                  <button
                    key={token}
                    type="button"
                    onClick={() => setSelectedToken(token)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-50 text-red-700 shadow-sm scale-105'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <TokenIcon token={token} size={22} />
                    <span className="text-[10px] font-bold mt-1 text-center truncate max-w-full">
                      {TOKEN_NAMES[token].split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Options: Create or Join */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200">
          {/* Create Room Option */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="font-black text-emerald-950 text-sm">Buat Ruangan Baru</h3>
              <p className="text-xs text-emerald-800/80 mt-1">
                Mulai ruang permainan baru dan bagikan kode undangan ke teman Anda.
              </p>
            </div>
            <button
              onClick={handleCreateNewRoom}
              className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus size={15} /> Buat Ruangan
            </button>
          </div>

          {/* Join with Code Option */}
          <form onSubmit={handleJoinWithCode} className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="font-black text-indigo-950 text-sm">Gabung Pakai Kode</h3>
              <p className="text-xs text-indigo-800/80 mt-1">
                Punya kode dari teman? Masukkan 6 digit kode di bawah ini:
              </p>
              <input
                type="text"
                maxLength={8}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="CONTOH: 9X4K2P"
                className="w-full mt-2 px-3 py-1.5 text-center font-mono font-black text-sm uppercase rounded-xl border border-indigo-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={!roomCodeInput.trim()}
              className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 active:scale-95 text-white font-black text-xs uppercase rounded-xl shadow cursor-pointer transition-all"
            >
              Gabung Ruangan
            </button>
          </form>
        </div>

        {/* Public Available Rooms */}
        {publicRooms.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide">
              Ruangan Terbuka ({publicRooms.length}):
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {publicRooms.map((r) => (
                <div
                  key={r.roomCode}
                  className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-black text-stone-800">{r.roomCode}</span>
                    <span className="text-stone-500 ml-2">Host: {r.hostName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-stone-600">{r.playerCount}/4 Pemain</span>
                    <button
                      onClick={() => {
                        setRoomCodeInput(r.roomCode);
                        onJoinRoom(r.roomCode, playerNameInput, selectedToken);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Masuk
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
