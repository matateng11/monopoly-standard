import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { BOARD_TILES, COLOR_GROUP_DEFINITIONS, calculateRent, getTile } from './src/shared/boardData.ts';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from './src/shared/cardsData.ts';
import {
  GameState,
  PlayerState,
  PlayerToken,
  ClientMessage,
  ServerMessage,
  TradeOffer,
  AuctionState,
  GameLogEntry,
  Card,
} from './src/shared/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);

interface ClientConnection {
  ws: WebSocket;
  roomCode: string;
  playerId: string;
}

const PLAYER_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'];
const AVAILABLE_TOKENS: PlayerToken[] = ['car', 'hat', 'thimble', 'dog', 'ship', 'cat'];

class MonopolyServer {
  private rooms: Map<string, GameState> = new Map();
  private connections: Map<WebSocket, ClientConnection> = new Map();
  private chanceDecks: Map<string, Card[]> = new Map();
  private chestDecks: Map<string, Card[]> = new Map();
  private botTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private turnIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initExpressAndWs();
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private getChanceCard(roomCode: string): Card {
    let deck = this.chanceDecks.get(roomCode);
    if (!deck || deck.length === 0) {
      deck = this.shuffle(CHANCE_CARDS);
      this.chanceDecks.set(roomCode, deck);
    }
    return deck.pop()!;
  }

  private getChestCard(roomCode: string): Card {
    let deck = this.chestDecks.get(roomCode);
    if (!deck || deck.length === 0) {
      deck = this.shuffle(COMMUNITY_CHEST_CARDS);
      this.chestDecks.set(roomCode, deck);
    }
    return deck.pop()!;
  }

  private initExpressAndWs() {
    const app = express();
    app.use(express.json());

    const server = createServer(app);
    const wss = new WebSocketServer({ server });

    // Active rooms API for quick join/discovery
    app.get('/api/rooms', (_req, res) => {
      const publicRooms = Array.from(this.rooms.values())
        .filter((r) => r.status === 'lobby' && r.players.length < 4)
        .map((r) => ({
          roomCode: r.roomCode,
          playerCount: r.players.length,
          hostName: r.players[0]?.name || 'Unknown',
        }));
      res.json({ rooms: publicRooms });
    });

    // Dev / Prod Vite handling
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      import('vite').then(({ createServer: createViteServer }) => {
        createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        }).then((vite) => {
          app.use(vite.middlewares);
        });
      });
    } else {
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      });
    }

    // WebSocket Handling
    wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (data: string) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (err) => {
        console.error('Socket error:', err);
      });
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Monopoly server listening on http://0.0.0.0:${PORT}`);
    });
  }

  private sendToSocket(ws: WebSocket, msg: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  private broadcastRoom(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    for (const [ws, conn] of this.connections.entries()) {
      if (conn.roomCode === roomCode && ws.readyState === WebSocket.OPEN) {
        this.sendToSocket(ws, {
          type: 'ROOM_STATE',
          state: room,
          myPlayerId: conn.playerId,
        });
      }
    }

    // Trigger bot if current player is a bot
    this.checkBotTurn(roomCode);
  }

  private addLog(room: GameState, text: string, type: GameLogEntry['type'] = 'info', playerId?: string) {
    const log: GameLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      text,
      type,
      playerId,
    };
    room.logs.push(log);
    if (room.logs.length > 80) {
      room.logs.shift();
    }
  }

  private handleDisconnect(ws: WebSocket) {
    const conn = this.connections.get(ws);
    if (!conn) return;

    const { roomCode, playerId } = conn;
    this.connections.delete(ws);

    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.isConnected = false;
      this.addLog(room, `${player.name} terputus dari permainan.`, 'info');

      // If in lobby and player disconnects, remove them
      if (room.status === 'lobby') {
        room.players = room.players.filter((p) => p.id !== playerId);
        if (room.hostId === playerId && room.players.length > 0) {
          room.hostId = room.players[0].id;
        }
      }
    }

    // Clean up empty room if everyone left
    const activeHumans = room.players.filter((p) => !p.isBot && p.isConnected);
    if (activeHumans.length === 0 && room.status === 'lobby') {
      this.cleanupRoom(roomCode);
      return;
    }

    this.broadcastRoom(roomCode);
  }

  private cleanupRoom(roomCode: string) {
    const botTimeout = this.botTimeouts.get(roomCode);
    if (botTimeout) clearTimeout(botTimeout);
    this.botTimeouts.delete(roomCode);

    const timer = this.turnIntervals.get(roomCode);
    if (timer) clearInterval(timer);
    this.turnIntervals.delete(roomCode);

    this.rooms.delete(roomCode);
    this.chanceDecks.delete(roomCode);
    this.chestDecks.delete(roomCode);
  }

  private createInitialProperties(): Record<number, { ownerId: string | null; houses: number; isMortgaged: boolean }> {
    const props: Record<number, { ownerId: string | null; houses: number; isMortgaged: boolean }> = {};
    for (const tile of BOARD_TILES) {
      if (tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility') {
        props[tile.id] = { ownerId: null, houses: 0, isMortgaged: false };
      }
    }
    return props;
  }

  private handleClientMessage(ws: WebSocket, msg: ClientMessage) {
    if (msg.type === 'JOIN_ROOM') {
      this.handleJoinRoom(ws, msg.roomCode.toUpperCase().trim(), msg.playerName.trim(), msg.token, msg.playerId);
      return;
    }

    const conn = this.connections.get(ws);
    if (!conn) {
      this.sendToSocket(ws, { type: 'ERROR', message: 'Anda belum bergabung ke dalam ruangan.' });
      return;
    }

    const room = this.rooms.get(conn.roomCode);
    if (!room) {
      this.sendToSocket(ws, { type: 'ERROR', message: 'Ruangan tidak ditemukan.' });
      return;
    }

    const player = room.players.find((p) => p.id === conn.playerId);
    if (!player) {
      this.sendToSocket(ws, { type: 'ERROR', message: 'Pemain tidak ditemukan.' });
      return;
    }

    switch (msg.type) {
      case 'START_GAME':
        this.handleStartGame(room, player);
        break;
      case 'ADD_BOT':
        this.handleAddBot(room, player, msg.token);
        break;
      case 'REMOVE_PLAYER':
        this.handleRemovePlayer(room, player, msg.playerId);
        break;
      case 'ROLL_DICE':
        this.handleRollDice(room, player);
        break;
      case 'BUY_PROPERTY':
        this.handleBuyProperty(room, player);
        break;
      case 'DECLINE_PROPERTY':
        this.handleDeclineProperty(room, player);
        break;
      case 'BID_AUCTION':
        this.handleBidAuction(room, player, msg.amount);
        break;
      case 'PASS_AUCTION':
        this.handlePassAuction(room, player);
        break;
      case 'BUILD_HOUSE':
        this.handleBuildHouse(room, player, msg.tileId);
        break;
      case 'SELL_HOUSE':
        this.handleSellHouse(room, player, msg.tileId);
        break;
      case 'MORTGAGE_PROPERTY':
        this.handleMortgageProperty(room, player, msg.tileId);
        break;
      case 'UNMORTGAGE_PROPERTY':
        this.handleUnmortgageProperty(room, player, msg.tileId);
        break;
      case 'PAY_JAIL_FINE':
        this.handlePayJailFine(room, player);
        break;
      case 'USE_JAIL_CARD':
        this.handleUseJailCard(room, player);
        break;
      case 'PROPOSE_TRADE':
        this.handleProposeTrade(room, player, msg.offer);
        break;
      case 'ACCEPT_TRADE':
        this.handleAcceptTrade(room, player);
        break;
      case 'DECLINE_TRADE':
        this.handleDeclineTrade(room, player);
        break;
      case 'CANCEL_TRADE':
        this.handleCancelTrade(room, player);
        break;
      case 'END_TURN':
        this.handleEndTurn(room, player);
        break;
      case 'DECLARE_BANKRUPTCY':
        this.handleBankruptcy(room, player);
        break;
      case 'SEND_CHAT':
        this.handleSendChat(room, player, msg.message);
        break;
    }

    this.broadcastRoom(room.roomCode);
  }

  private handleJoinRoom(ws: WebSocket, roomCode: string, playerName: string, token: PlayerToken, existingPlayerId?: string) {
    let room = this.rooms.get(roomCode);

    if (!room) {
      // Create new room
      const newPlayerId = existingPlayerId || 'p_' + Math.random().toString(36).substring(2, 8);
      const newPlayer: PlayerState = {
        id: newPlayerId,
        name: playerName || 'Player 1',
        token: token || 'car',
        color: PLAYER_COLORS[0],
        cash: 1500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        isBankrupt: false,
        isBot: false,
        isConnected: true,
      };

      room = {
        roomCode,
        hostId: newPlayerId,
        status: 'lobby',
        players: [newPlayer],
        currentTurnIndex: 0,
        dice: [1, 1],
        hasRolled: false,
        consecutiveDoubles: 0,
        properties: this.createInitialProperties(),
        drawnCard: null,
        pendingBuyTileId: null,
        activeAuction: null,
        activeTrade: null,
        logs: [],
        winnerId: null,
        turnTimeLimit: 60,
        turnTimer: 60,
      };

      this.rooms.set(roomCode, room);
      this.connections.set(ws, { ws, roomCode, playerId: newPlayerId });
      this.addLog(room, `${newPlayer.name} membuat ruangan permainan ${roomCode}.`, 'info');
      this.broadcastRoom(roomCode);
      return;
    }

    // If existing player reconnecting
    if (existingPlayerId) {
      const existingPlayer = room.players.find((p) => p.id === existingPlayerId);
      if (existingPlayer) {
        existingPlayer.isConnected = true;
        this.connections.set(ws, { ws, roomCode, playerId: existingPlayerId });
        this.addLog(room, `${existingPlayer.name} kembali bergabung!`, 'info');
        this.broadcastRoom(roomCode);
        return;
      }
    }

    // Joining existing room as new player
    if (room.status !== 'lobby') {
      this.sendToSocket(ws, { type: 'ERROR', message: 'Permainan di ruangan ini sudah dimulai.' });
      return;
    }

    if (room.players.length >= 4) {
      this.sendToSocket(ws, { type: 'ERROR', message: 'Ruangan sudah penuh (maksimal 4 pemain).' });
      return;
    }

    const newPlayerId = 'p_' + Math.random().toString(36).substring(2, 8);
    const colorIndex = room.players.length;
    // ensure unique token
    const usedTokens = room.players.map((p) => p.token);
    let chosenToken = token;
    if (usedTokens.includes(chosenToken)) {
      chosenToken = AVAILABLE_TOKENS.find((t) => !usedTokens.includes(t)) || 'car';
    }

    const newPlayer: PlayerState = {
      id: newPlayerId,
      name: playerName || `Player ${room.players.length + 1}`,
      token: chosenToken,
      color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
      cash: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isBot: false,
      isConnected: true,
    };

    room.players.push(newPlayer);
    this.connections.set(ws, { ws, roomCode, playerId: newPlayerId });
    this.addLog(room, `${newPlayer.name} bergabung ke ruangan.`, 'info');
    this.broadcastRoom(roomCode);
  }

  private handleAddBot(room: GameState, player: PlayerState, requestedToken?: PlayerToken) {
    if (room.status !== 'lobby' || room.hostId !== player.id) return;
    if (room.players.length >= 4) return;

    const usedTokens = room.players.map((p) => p.token);
    const botToken = requestedToken && !usedTokens.includes(requestedToken)
      ? requestedToken
      : AVAILABLE_TOKENS.find((t) => !usedTokens.includes(t)) || 'dog';

    const botNames = ['Bot Arjuna', 'Bot Bima', 'Bot Gatotkaca', 'Bot Yudhistira'];
    const botName = botNames[room.players.length % botNames.length];
    const botId = 'bot_' + Math.random().toString(36).substring(2, 7);

    const botPlayer: PlayerState = {
      id: botId,
      name: botName,
      token: botToken,
      color: PLAYER_COLORS[room.players.length % PLAYER_COLORS.length],
      cash: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false,
      isBot: true,
      isConnected: true,
    };

    room.players.push(botPlayer);
    this.addLog(room, `${botName} (Komputer) ditambahkan ke ruangan.`, 'info');
  }

  private handleRemovePlayer(room: GameState, player: PlayerState, targetPlayerId: string) {
    if (room.status !== 'lobby' || room.hostId !== player.id) return;
    if (targetPlayerId === player.id) return;

    const target = room.players.find((p) => p.id === targetPlayerId);
    if (!target) return;

    room.players = room.players.filter((p) => p.id !== targetPlayerId);
    this.addLog(room, `${target.name} dikeluarkan dari ruangan.`, 'info');
  }

  private handleStartGame(room: GameState, player: PlayerState) {
    if (room.hostId !== player.id || room.status !== 'lobby') return;
    if (room.players.length < 2) {
      this.addLog(room, 'Butuh minimal 2 pemain untuk memulai permainan.', 'info');
      return;
    }

    room.status = 'playing';
    room.currentTurnIndex = 0;
    room.hasRolled = false;
    room.consecutiveDoubles = 0;
    room.turnTimer = room.turnTimeLimit;

    this.addLog(room, 'Permainan Monopoli DIMULAI! Semoga beruntung semua pemain!', 'info');
    const firstPlayer = room.players[0];
    this.addLog(room, `Giliran pertama: ${firstPlayer.name}`, 'info');

    this.startTurnTimer(room.roomCode);
  }

  private startTurnTimer(roomCode: string) {
    const existing = this.turnIntervals.get(roomCode);
    if (existing) clearInterval(existing);

    const interval = setInterval(() => {
      const room = this.rooms.get(roomCode);
      if (!room || room.status !== 'playing') {
        clearInterval(interval);
        return;
      }

      if (room.turnTimer > 0) {
        room.turnTimer--;
      } else {
        // Timer expired! Force end turn or auto-roll
        const currentPlayer = room.players[room.currentTurnIndex];
        if (currentPlayer) {
          if (!room.hasRolled) {
            this.handleRollDice(room, currentPlayer);
          } else {
            // Auto decline if pending buy
            if (room.pendingBuyTileId !== null) {
              this.handleDeclineProperty(room, currentPlayer);
            }
            this.nextTurn(room);
          }
          this.broadcastRoom(roomCode);
        }
      }
    }, 1000);

    this.turnIntervals.set(roomCode, interval);
  }

  private handleRollDice(room: GameState, player: PlayerState) {
    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer.id !== player.id || room.hasRolled || room.status !== 'playing') return;

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const isDouble = d1 === d2;
    room.dice = [d1, d2];
    const totalSteps = d1 + d2;

    this.addLog(room, `${player.name} melempar dadu: [${d1}] dan [${d2}] (Total: ${totalSteps})${isDouble ? ' - DOUBLE!' : ''}`, 'roll', player.id);

    // If in jail
    if (player.inJail) {
      if (isDouble) {
        player.inJail = false;
        player.jailTurns = 0;
        this.addLog(room, `${player.name} melempar dadu kembar dan BEBAS dari penjara!`, 'jail', player.id);
        this.movePlayer(room, player, totalSteps);
        room.hasRolled = true;
      } else {
        player.jailTurns++;
        if (player.jailTurns >= 3) {
          // Must pay $50 and move
          player.cash -= 50;
          player.inJail = false;
          player.jailTurns = 0;
          this.addLog(room, `${player.name} gagal melempar double 3x. Membayar denda $50 dan bebas.`, 'jail', player.id);
          this.movePlayer(room, player, totalSteps);
        } else {
          this.addLog(room, `${player.name} belum mendapat double. Tetap berada di penjara (${player.jailTurns}/3).`, 'jail', player.id);
        }
        room.hasRolled = true;
      }
      return;
    }

    // Normal turn
    if (isDouble) {
      room.consecutiveDoubles++;
      if (room.consecutiveDoubles >= 3) {
        // Send to jail for speeding!
        this.sendPlayerToJail(room, player, '3 kali berturut-turut melempar double!');
        room.hasRolled = true;
        return;
      }
      // Double gives another turn, so hasRolled is temporarily false after resolving tile
      this.movePlayer(room, player, totalSteps);
      // If landed without pending purchase, player can roll again
      if (room.pendingBuyTileId === null) {
        room.hasRolled = false;
        this.addLog(room, `${player.name} mendapat giliran lempar dadu lagi karena Double!`, 'roll', player.id);
      } else {
        room.hasRolled = true; // Wait for buy decision
      }
    } else {
      room.consecutiveDoubles = 0;
      room.hasRolled = true;
      this.movePlayer(room, player, totalSteps);
    }
  }

  private movePlayer(room: GameState, player: PlayerState, steps: number) {
    const oldPos = player.position;
    const newPos = (oldPos + steps + 40) % 40;

    // Check passing GO (0)
    if (steps > 0 && newPos < oldPos && oldPos !== 0) {
      player.cash += 200;
      this.addLog(room, `${player.name} melewati petak MULAI dan mengambil gaji $200!`, 'info', player.id);
    } else if (newPos === 0) {
      player.cash += 200;
      this.addLog(room, `${player.name} mendarat persis di petak MULAI dan mengambil $200!`, 'info', player.id);
    }

    player.position = newPos;
    const tile = getTile(newPos);
    this.addLog(room, `${player.name} mendarat di ${tile.name} (${tile.subName || ''})`, 'info', player.id);

    this.resolveTileLanding(room, player, tile);
  }

  private resolveTileLanding(room: GameState, player: PlayerState, tile: ReturnType<typeof getTile>) {
    switch (tile.type) {
      case 'property':
      case 'railroad':
      case 'utility': {
        const ownership = room.properties[tile.id];
        if (!ownership || !ownership.ownerId) {
          // Unowned property available to buy
          room.pendingBuyTileId = tile.id;
          this.addLog(room, `${tile.name} belum ada pemiliknya. ${player.name} dapat membeli seharga $${tile.price}.`, 'info', player.id);
        } else if (ownership.ownerId === player.id) {
          this.addLog(room, `${player.name} mendarat di properti miliknya sendiri.`, 'info', player.id);
        } else {
          // Owned by someone else
          if (ownership.isMortgaged) {
            this.addLog(room, `${tile.name} sedang digadaikan. Tidak ada biaya sewa.`, 'info', player.id);
          } else {
            const owner = room.players.find((p) => p.id === ownership.ownerId);
            if (owner && !owner.isBankrupt) {
              const diceSum = room.dice[0] + room.dice[1];
              const rent = calculateRent(tile, room.properties, diceSum);
              if (rent > 0) {
                player.cash -= rent;
                owner.cash += rent;
                this.addLog(room, `${player.name} membayar sewa $${rent} kepada ${owner.name}!`, 'rent', player.id);
                this.checkPlayerSolvency(room, player, owner);
              }
            }
          }
        }
        break;
      }

      case 'tax': {
        const tax = tile.taxAmount || 100;
        player.cash -= tax;
        this.addLog(room, `${player.name} membayar pajak sebesar $${tax} ke Kas Negara.`, 'info', player.id);
        this.checkPlayerSolvency(room, player);
        break;
      }

      case 'go_to_jail': {
        this.sendPlayerToJail(room, player, 'Mendarat di petak Masuk Penjara!');
        break;
      }

      case 'chance': {
        const card = this.getChanceCard(room.roomCode);
        room.drawnCard = { card, playerId: player.id };
        this.addLog(room, `${player.name} mengambil Kartu Kesempatan: "${card.title}" - ${card.description}`, 'card', player.id);
        this.executeCardAction(room, player, card);
        break;
      }

      case 'community_chest': {
        const card = this.getChestCard(room.roomCode);
        room.drawnCard = { card, playerId: player.id };
        this.addLog(room, `${player.name} mengambil Kartu Dana Umum: "${card.title}" - ${card.description}`, 'card', player.id);
        this.executeCardAction(room, player, card);
        break;
      }

      case 'free_parking':
        this.addLog(room, `${player.name} istirahat santai di Parkir Bebas.`, 'info', player.id);
        break;

      case 'jail':
        this.addLog(room, `${player.name} hanya lewat menjenguk di Penjara.`, 'info', player.id);
        break;

      case 'go':
        break;
    }
  }

  private executeCardAction(room: GameState, player: PlayerState, card: Card) {
    const { action } = card;
    switch (action.type) {
      case 'move_to': {
        const oldPos = player.position;
        player.position = action.targetPosition;
        if (action.collectGo && action.targetPosition < oldPos && action.targetPosition !== 0) {
          player.cash += 200;
          this.addLog(room, `${player.name} melewati MULAI dan dapat $200.`, 'info', player.id);
        } else if (action.targetPosition === 0) {
          player.cash += 200;
          this.addLog(room, `${player.name} tiba di petak MULAI dan dapat $200.`, 'info', player.id);
        }
        const targetTile = getTile(action.targetPosition);
        this.resolveTileLanding(room, player, targetTile);
        break;
      }
      case 'move_nearest': {
        let pos = player.position;
        let found = -1;
        for (let i = 1; i <= 40; i++) {
          const check = (pos + i) % 40;
          const t = getTile(check);
          if (t.type === action.tileType) {
            found = check;
            break;
          }
        }
        if (found !== -1) {
          if (found < player.position) {
            player.cash += 200;
            this.addLog(room, `${player.name} melewati MULAI dan dapat $200.`, 'info', player.id);
          }
          player.position = found;
          const targetTile = getTile(found);
          this.resolveTileLanding(room, player, targetTile);
        }
        break;
      }
      case 'move_steps': {
        const newPos = (player.position + action.steps + 40) % 40;
        player.position = newPos;
        const targetTile = getTile(newPos);
        this.resolveTileLanding(room, player, targetTile);
        break;
      }
      case 'receive_cash': {
        player.cash += action.amount;
        break;
      }
      case 'pay_cash': {
        player.cash -= action.amount;
        this.checkPlayerSolvency(room, player);
        break;
      }
      case 'pay_each_player': {
        const others = room.players.filter((p) => p.id !== player.id && !p.isBankrupt);
        for (const other of others) {
          player.cash -= action.amount;
          other.cash += action.amount;
        }
        this.checkPlayerSolvency(room, player);
        break;
      }
      case 'receive_each_player': {
        const others = room.players.filter((p) => p.id !== player.id && !p.isBankrupt);
        for (const other of others) {
          other.cash -= action.amount;
          player.cash += action.amount;
          this.checkPlayerSolvency(room, other, player);
        }
        break;
      }
      case 'property_repairs': {
        let totalCost = 0;
        for (const [tileIdStr, prop] of Object.entries(room.properties)) {
          if (prop.ownerId === player.id) {
            if (prop.houses === 5) {
              totalCost += action.hotelCost;
            } else if (prop.houses > 0) {
              totalCost += prop.houses * action.houseCost;
            }
          }
        }
        player.cash -= totalCost;
        this.addLog(room, `${player.name} membayar total perbaikan bangunan sebesar $${totalCost}.`, 'info', player.id);
        this.checkPlayerSolvency(room, player);
        break;
      }
      case 'go_to_jail': {
        this.sendPlayerToJail(room, player, 'Kartu memerintahkan masuk penjara!');
        break;
      }
      case 'get_out_of_jail_free': {
        player.getOutOfJailCards++;
        this.addLog(room, `${player.name} menyimpan 1 Kartu Bebas Penjara.`, 'info', player.id);
        break;
      }
    }
  }

  private sendPlayerToJail(room: GameState, player: PlayerState, reason: string) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    room.consecutiveDoubles = 0;
    room.hasRolled = true;
    room.pendingBuyTileId = null;
    this.addLog(room, `${player.name} MASUK PENJARA! Alasan: ${reason}`, 'jail', player.id);
  }

  private handleBuyProperty(room: GameState, player: PlayerState) {
    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer.id !== player.id || room.pendingBuyTileId === null) return;

    const tile = getTile(room.pendingBuyTileId);
    const price = tile.price || 0;

    if (player.cash < price) {
      this.addLog(room, `${player.name} uang tidak mencukupi untuk membeli ${tile.name} ($${price}).`, 'info', player.id);
      return;
    }

    player.cash -= price;
    room.properties[tile.id] = { ownerId: player.id, houses: 0, isMortgaged: false };
    room.pendingBuyTileId = null;

    this.addLog(room, `${player.name} berhasil membeli sertifikat ${tile.name} seharga $${price}!`, 'buy', player.id);
  }

  private handleDeclineProperty(room: GameState, player: PlayerState) {
    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer.id !== player.id || room.pendingBuyTileId === null) return;

    const tileId = room.pendingBuyTileId;
    room.pendingBuyTileId = null;
    const tile = getTile(tileId);

    this.addLog(room, `${player.name} memilih untuk tidak membeli ${tile.name}. Lelang dimulai untuk semua pemain!`, 'info', player.id);

    // Start auction
    const activeParticipants = room.players.filter((p) => !p.isBankrupt).map((p) => p.id);
    room.activeAuction = {
      tileId,
      currentBid: 10,
      highestBidderId: null,
      participants: activeParticipants,
      currentBidderIndex: 0,
      timeRemaining: 15,
    };
  }

  private handleBidAuction(room: GameState, player: PlayerState, amount: number) {
    const auction = room.activeAuction;
    if (!auction || !auction.participants.includes(player.id)) return;

    if (amount <= auction.currentBid || player.cash < amount) {
      return;
    }

    auction.currentBid = amount;
    auction.highestBidderId = player.id;
    auction.timeRemaining = 15;
    const tile = getTile(auction.tileId);

    this.addLog(room, `${player.name} menawar ${tile.name} seharga $${amount}!`, 'info', player.id);
  }

  private handlePassAuction(room: GameState, player: PlayerState) {
    const auction = room.activeAuction;
    if (!auction) return;

    auction.participants = auction.participants.filter((id) => id !== player.id);
    this.addLog(room, `${player.name} mundur dari lelang.`, 'info', player.id);

    // If only one bidder remaining or no bidders
    if (auction.participants.length <= 1) {
      const winnerId = auction.highestBidderId || (auction.participants.length === 1 ? auction.participants[0] : null);
      const tile = getTile(auction.tileId);

      if (winnerId) {
        const winner = room.players.find((p) => p.id === winnerId);
        if (winner && winner.cash >= auction.currentBid) {
          winner.cash -= auction.currentBid;
          room.properties[tile.id] = { ownerId: winner.id, houses: 0, isMortgaged: false };
          this.addLog(room, `Lelang selesai! ${winner.name} memenangkan ${tile.name} seharga $${auction.currentBid}!`, 'buy', winner.id);
        }
      } else {
        this.addLog(room, `Tidak ada pemain yang memenangkan lelang ${tile.name}.`, 'info');
      }

      room.activeAuction = null;
    }
  }

  private handleBuildHouse(room: GameState, player: PlayerState, tileId: number) {
    const tile = getTile(tileId);
    if (!tile.colorGroup || tile.type !== 'property' || !tile.houseCost) return;

    const groupDef = COLOR_GROUP_DEFINITIONS[tile.colorGroup];
    const ownsAll = groupDef.tileIds.every((id) => room.properties[id]?.ownerId === player.id);
    if (!ownsAll) {
      this.addLog(room, `Anda harus memiliki semua petak berwarna ${groupDef.name} sebelum membangun rumah.`, 'info', player.id);
      return;
    }

    const anyMortgaged = groupDef.tileIds.some((id) => room.properties[id]?.isMortgaged);
    if (anyMortgaged) {
      this.addLog(room, `Tidak dapat membangun rumah saat ada properti segrup yang digadaikan.`, 'info', player.id);
      return;
    }

    const currentProp = room.properties[tileId];
    if (currentProp.houses >= 5) {
      this.addLog(room, `Sudah mencapai batas maksimal (Hotel) pada ${tile.name}.`, 'info', player.id);
      return;
    }

    // Even building rule: cannot build on tile if any tile in group has fewer houses
    const minHousesInGroup = Math.min(...groupDef.tileIds.map((id) => room.properties[id]?.houses || 0));
    if (currentProp.houses > minHousesInGroup) {
      this.addLog(room, `Aturan Monopoli: Bangunan harus merata pada semua petak ${groupDef.name}.`, 'info', player.id);
      return;
    }

    if (player.cash < tile.houseCost) {
      this.addLog(room, `Uang tidak mencukupi untuk membangun ($${tile.houseCost}).`, 'info', player.id);
      return;
    }

    player.cash -= tile.houseCost;
    currentProp.houses += 1;
    const label = currentProp.houses === 5 ? 'HOTEL' : `Rumah ke-${currentProp.houses}`;
    this.addLog(room, `${player.name} membangun ${label} di ${tile.name} seharga $${tile.houseCost}!`, 'buy', player.id);
  }

  private handleSellHouse(room: GameState, player: PlayerState, tileId: number) {
    const tile = getTile(tileId);
    if (!tile.colorGroup || tile.type !== 'property' || !tile.houseCost) return;

    const groupDef = COLOR_GROUP_DEFINITIONS[tile.colorGroup];
    const currentProp = room.properties[tileId];
    if (currentProp.ownerId !== player.id || currentProp.houses <= 0) return;

    // Even building rule in reverse: cannot sell if another property has more houses
    const maxHousesInGroup = Math.max(...groupDef.tileIds.map((id) => room.properties[id]?.houses || 0));
    if (currentProp.houses < maxHousesInGroup) {
      this.addLog(room, `Penjualan bangunan harus merata. Jual rumah pada properti yang lebih tinggi terlebih dahulu.`, 'info', player.id);
      return;
    }

    const refund = Math.floor(tile.houseCost / 2);
    player.cash += refund;
    currentProp.houses -= 1;
    this.addLog(room, `${player.name} menjual 1 bangunan di ${tile.name} dan menerima $${refund}.`, 'info', player.id);
  }

  private handleMortgageProperty(room: GameState, player: PlayerState, tileId: number) {
    const tile = getTile(tileId);
    const prop = room.properties[tileId];
    if (!prop || prop.ownerId !== player.id || prop.isMortgaged) return;

    // Check if group has houses
    if (tile.colorGroup) {
      const groupDef = COLOR_GROUP_DEFINITIONS[tile.colorGroup];
      const hasHouses = groupDef.tileIds.some((id) => (room.properties[id]?.houses || 0) > 0);
      if (hasHouses) {
        this.addLog(room, `Jual semua bangunan di grup warna ini sebelum menggadaikan.`, 'info', player.id);
        return;
      }
    }

    const value = tile.mortgageValue || Math.floor((tile.price || 0) / 2);
    prop.isMortgaged = true;
    player.cash += value;
    this.addLog(room, `${player.name} menggadaikan ${tile.name} ke bank dan memperoleh $${value}.`, 'info', player.id);
  }

  private handleUnmortgageProperty(room: GameState, player: PlayerState, tileId: number) {
    const tile = getTile(tileId);
    const prop = room.properties[tileId];
    if (!prop || prop.ownerId !== player.id || !prop.isMortgaged) return;

    const baseValue = tile.mortgageValue || Math.floor((tile.price || 0) / 2);
    const cost = Math.floor(baseValue * 1.1); // 10% bank interest

    if (player.cash < cost) {
      this.addLog(room, `Uang tidak mencukupi untuk menebus gadai ($${cost}).`, 'info', player.id);
      return;
    }

    player.cash -= cost;
    prop.isMortgaged = false;
    this.addLog(room, `${player.name} menebus gadai ${tile.name} dengan membayar $${cost}.`, 'info', player.id);
  }

  private handlePayJailFine(room: GameState, player: PlayerState) {
    if (!player.inJail || player.cash < 50) return;
    player.cash -= 50;
    player.inJail = false;
    player.jailTurns = 0;
    this.addLog(room, `${player.name} membayar denda $50 dan bebas dari penjara.`, 'jail', player.id);
  }

  private handleUseJailCard(room: GameState, player: PlayerState) {
    if (!player.inJail || player.getOutOfJailCards <= 0) return;
    player.getOutOfJailCards -= 1;
    player.inJail = false;
    player.jailTurns = 0;
    this.addLog(room, `${player.name} menggunakan Kartu Bebas Penjara dan keluar dari sel!`, 'jail', player.id);
  }

  private handleProposeTrade(room: GameState, player: PlayerState, offer: Omit<TradeOffer, 'id' | 'status' | 'senderId'>) {
    if (room.activeTrade) return;

    const receiver = room.players.find((p) => p.id === offer.receiverId);
    if (!receiver || receiver.isBankrupt) return;

    room.activeTrade = {
      ...offer,
      id: Math.random().toString(36).substring(2, 9),
      senderId: player.id,
      status: 'pending',
    };

    this.addLog(room, `${player.name} mengajukan tawaran barter/perdagangan kepada ${receiver.name}.`, 'trade', player.id);
  }

  private handleAcceptTrade(room: GameState, player: PlayerState) {
    const trade = room.activeTrade;
    if (!trade || trade.receiverId !== player.id) return;

    const sender = room.players.find((p) => p.id === trade.senderId);
    const receiver = player;

    if (!sender || sender.cash < trade.offeredCash || receiver.cash < trade.requestedCash) {
      this.addLog(room, `Transaksi dibatalkan karena saldo salah satu pihak tidak mencukupi.`, 'info');
      room.activeTrade = null;
      return;
    }

    // Transfer cash
    sender.cash -= trade.offeredCash;
    receiver.cash += trade.offeredCash;
    receiver.cash -= trade.requestedCash;
    sender.cash += trade.requestedCash;

    // Transfer cards
    sender.getOutOfJailCards -= trade.offeredJailCards;
    receiver.getOutOfJailCards += trade.offeredJailCards;
    receiver.getOutOfJailCards -= trade.requestedJailCards;
    sender.getOutOfJailCards += trade.requestedJailCards;

    // Transfer properties
    for (const tileId of trade.offeredProperties) {
      if (room.properties[tileId]?.ownerId === sender.id) {
        room.properties[tileId].ownerId = receiver.id;
      }
    }
    for (const tileId of trade.requestedProperties) {
      if (room.properties[tileId]?.ownerId === receiver.id) {
        room.properties[tileId].ownerId = sender.id;
      }
    }

    this.addLog(room, `Kesepakatan barter berhasil disetujui antara ${sender.name} dan ${receiver.name}!`, 'trade', receiver.id);
    room.activeTrade = null;
  }

  private handleDeclineTrade(room: GameState, player: PlayerState) {
    if (!room.activeTrade || room.activeTrade.receiverId !== player.id) return;
    this.addLog(room, `${player.name} menolak tawaran barter.`, 'trade', player.id);
    room.activeTrade = null;
  }

  private handleCancelTrade(room: GameState, player: PlayerState) {
    if (!room.activeTrade || room.activeTrade.senderId !== player.id) return;
    this.addLog(room, `${player.name} membatalkan tawaran barter.`, 'trade', player.id);
    room.activeTrade = null;
  }

  private handleEndTurn(room: GameState, player: PlayerState) {
    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer.id !== player.id || !room.hasRolled || room.pendingBuyTileId !== null) return;

    room.drawnCard = null;
    this.nextTurn(room);
  }

  private nextTurn(room: GameState) {
    room.hasRolled = false;
    room.consecutiveDoubles = 0;
    room.drawnCard = null;
    room.turnTimer = room.turnTimeLimit;

    const activePlayers = room.players.filter((p) => !p.isBankrupt);
    if (activePlayers.length <= 1) {
      this.declareWinner(room, activePlayers[0]?.id || null);
      return;
    }

    let nextIndex = (room.currentTurnIndex + 1) % room.players.length;
    while (room.players[nextIndex].isBankrupt) {
      nextIndex = (nextIndex + 1) % room.players.length;
    }

    room.currentTurnIndex = nextIndex;
    const nextPlayer = room.players[nextIndex];
    this.addLog(room, `Giliran berikutnya: ${nextPlayer.name}`, 'info', nextPlayer.id);
  }

  private checkPlayerSolvency(room: GameState, player: PlayerState, creditor?: PlayerState) {
    if (player.cash >= 0) return;

    this.addLog(room, `PERINGATAN: ${player.name} memiliki saldo negatif ($${player.cash})! Segera gadaikan aset atau jual rumah!`, 'info', player.id);

    // Check if player has any assets left
    let totalAssetValue = 0;
    for (const [idStr, prop] of Object.entries(room.properties)) {
      if (prop.ownerId === player.id) {
        const tile = getTile(parseInt(idStr, 10));
        if (!prop.isMortgaged) {
          totalAssetValue += tile.mortgageValue || Math.floor((tile.price || 0) / 2);
        }
        if (prop.houses > 0 && tile.houseCost) {
          totalAssetValue += prop.houses * Math.floor(tile.houseCost / 2);
        }
      }
    }

    if (player.cash + totalAssetValue < 0 && player.isBot) {
      // Bot declares bankruptcy automatically
      this.handleBankruptcy(room, player, creditor);
    }
  }

  private handleBankruptcy(room: GameState, player: PlayerState, creditor?: PlayerState) {
    player.isBankrupt = true;
    player.cash = 0;

    // Transfer or liquidate properties
    for (const [idStr, prop] of Object.entries(room.properties)) {
      const tileId = parseInt(idStr, 10);
      if (prop.ownerId === player.id) {
        if (creditor && !creditor.isBankrupt) {
          prop.ownerId = creditor.id;
        } else {
          // Surrender to bank
          prop.ownerId = null;
          prop.houses = 0;
          prop.isMortgaged = false;
        }
      }
    }

    this.addLog(room, `BANGKRUT! ${player.name} telah tersingkir dari permainan.`, 'bankruptcy', player.id);

    const activePlayers = room.players.filter((p) => !p.isBankrupt);
    if (activePlayers.length <= 1) {
      this.declareWinner(room, activePlayers[0]?.id || null);
    } else if (room.players[room.currentTurnIndex].id === player.id) {
      this.nextTurn(room);
    }
  }

  private declareWinner(room: GameState, winnerId: string | null) {
    room.status = 'game_over';
    room.winnerId = winnerId;
    const winner = room.players.find((p) => p.id === winnerId);
    if (winner) {
      this.addLog(room, `SELAMAT! ${winner.name} keluar sebagai JUARA MONOPOLI!`, 'info', winner.id);
    }
  }

  private handleSendChat(room: GameState, player: PlayerState, message: string) {
    const cleanMsg = message.trim();
    if (!cleanMsg) return;
    this.addLog(room, `${player.name}: ${cleanMsg}`, 'chat', player.id);
  }

  private checkBotTurn(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'playing') return;

    // Check if auction needs bot bids
    if (room.activeAuction) {
      const auction = room.activeAuction;
      for (const participantId of auction.participants) {
        const participant = room.players.find((p) => p.id === participantId);
        if (participant && participant.isBot && auction.highestBidderId !== participant.id) {
          const tile = getTile(auction.tileId);
          const maxWillingBid = Math.floor((tile.price || 100) * 0.8);
          const nextBid = auction.currentBid + 10;
          if (nextBid <= maxWillingBid && participant.cash >= nextBid + 200) {
            setTimeout(() => {
              this.handleBidAuction(room, participant, nextBid);
              this.broadcastRoom(roomCode);
            }, 1200);
            return;
          } else {
            setTimeout(() => {
              this.handlePassAuction(room, participant);
              this.broadcastRoom(roomCode);
            }, 1000);
            return;
          }
        }
      }
    }

    // Bot active turn
    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || !currentPlayer.isBot || currentPlayer.isBankrupt) return;

    // Clear any previous scheduled bot action
    const existing = this.botTimeouts.get(roomCode);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(() => {
      this.executeBotTurn(roomCode, currentPlayer.id);
    }, 1500);

    this.botTimeouts.set(roomCode, timeout);
  }

  private executeBotTurn(roomCode: string, botId: string) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'playing') return;
    const bot = room.players[room.currentTurnIndex];
    if (!bot || bot.id !== botId || bot.isBankrupt) return;

    // 1. If in jail, pay fine if rich or use card
    if (bot.inJail) {
      if (bot.getOutOfJailCards > 0) {
        this.handleUseJailCard(room, bot);
      } else if (bot.cash > 300) {
        this.handlePayJailFine(room, bot);
      }
    }

    // 2. Roll dice if hasn't rolled
    if (!room.hasRolled) {
      this.handleRollDice(room, bot);
      this.broadcastRoom(roomCode);
      return;
    }

    // 3. If landed on unowned property
    if (room.pendingBuyTileId !== null) {
      const tile = getTile(room.pendingBuyTileId);
      const price = tile.price || 0;
      if (bot.cash >= price + 150) {
        this.handleBuyProperty(room, bot);
      } else {
        this.handleDeclineProperty(room, bot);
      }
      this.broadcastRoom(roomCode);
      return;
    }

    // 4. Try building houses if has monopoly and ample cash
    for (const [idStr, prop] of Object.entries(room.properties)) {
      if (prop.ownerId === bot.id) {
        const tile = getTile(parseInt(idStr, 10));
        if (tile.colorGroup && tile.houseCost && prop.houses < 5 && bot.cash > tile.houseCost + 300) {
          const groupDef = COLOR_GROUP_DEFINITIONS[tile.colorGroup];
          const ownsAll = groupDef.tileIds.every((id) => room.properties[id]?.ownerId === bot.id);
          if (ownsAll) {
            this.handleBuildHouse(room, bot, tile.id);
            break;
          }
        }
      }
    }

    // 5. End turn
    setTimeout(() => {
      this.handleEndTurn(room, bot);
      this.broadcastRoom(roomCode);
    }, 1200);
  }
}

new MonopolyServer();
