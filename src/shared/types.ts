export type ColorGroup = 
  | 'brown' 
  | 'light_blue' 
  | 'pink' 
  | 'orange' 
  | 'red' 
  | 'yellow' 
  | 'green' 
  | 'dark_blue' 
  | 'railroad' 
  | 'utility' 
  | 'special';

export type TileType = 'property' | 'railroad' | 'utility' | 'go' | 'community_chest' | 'chance' | 'tax' | 'jail' | 'free_parking' | 'go_to_jail';

export interface BoardTile {
  id: number; // 0 to 39
  name: string;
  subName?: string;
  type: TileType;
  colorGroup?: ColorGroup;
  price?: number;
  rent?: number[]; // [base, 1 house, 2 houses, 3 houses, 4 houses, hotel]
  mortgageValue?: number;
  houseCost?: number;
  taxAmount?: number;
}

export type PlayerToken = 'hat' | 'car' | 'thimble' | 'dog' | 'ship' | 'cat';

export interface PlayerState {
  id: string; // unique socket/user id
  name: string;
  token: PlayerToken;
  color: string;
  cash: number;
  position: number; // 0 to 39
  inJail: boolean;
  jailTurns: number;
  getOutOfJailCards: number;
  isBankrupt: boolean;
  isBot: boolean;
  isConnected: boolean;
}

export interface PropertyOwnership {
  ownerId: string | null;
  houses: number; // 0-4 houses, 5 = hotel
  isMortgaged: boolean;
}

export interface Card {
  id: string;
  type: 'chance' | 'chest';
  title: string;
  description: string;
  action: CardAction;
}

export type CardAction = 
  | { type: 'move_to'; targetPosition: number; collectGo?: boolean }
  | { type: 'move_nearest'; tileType: 'railroad' | 'utility' }
  | { type: 'move_steps'; steps: number }
  | { type: 'receive_cash'; amount: number }
  | { type: 'pay_cash'; amount: number }
  | { type: 'pay_each_player'; amount: number }
  | { type: 'receive_each_player'; amount: number }
  | { type: 'property_repairs'; houseCost: number; hotelCost: number }
  | { type: 'go_to_jail' }
  | { type: 'get_out_of_jail_free' };

export interface TradeOffer {
  id: string;
  senderId: string;
  receiverId: string;
  offeredCash: number;
  offeredProperties: number[]; // tile IDs
  offeredJailCards: number;
  requestedCash: number;
  requestedProperties: number[]; // tile IDs
  requestedJailCards: number;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
}

export interface AuctionState {
  tileId: number;
  currentBid: number;
  highestBidderId: string | null;
  participants: string[]; // player IDs still in auction
  currentBidderIndex: number;
  timeRemaining: number;
}

export interface GameLogEntry {
  id: string;
  timestamp: number;
  text: string;
  type: 'roll' | 'buy' | 'rent' | 'card' | 'jail' | 'trade' | 'bankruptcy' | 'info' | 'chat';
  playerId?: string;
}

export interface GameState {
  roomCode: string;
  hostId: string;
  status: 'lobby' | 'playing' | 'game_over';
  players: PlayerState[];
  currentTurnIndex: number;
  dice: [number, number];
  hasRolled: boolean;
  consecutiveDoubles: number;
  properties: Record<number, PropertyOwnership>;
  drawnCard: { card: Card; playerId: string } | null;
  pendingBuyTileId: number | null; // Tile waiting for player to buy or auction
  activeAuction: AuctionState | null;
  activeTrade: TradeOffer | null;
  logs: GameLogEntry[];
  winnerId: string | null;
  turnTimeLimit: number; // in seconds
  turnTimer: number; // remaining seconds
}

// Client to Server Actions
export type ClientMessage = 
  | { type: 'JOIN_ROOM'; roomCode: string; playerName: string; token: PlayerToken; playerId?: string }
  | { type: 'START_GAME' }
  | { type: 'ADD_BOT'; token?: PlayerToken }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'ROLL_DICE' }
  | { type: 'BUY_PROPERTY' }
  | { type: 'DECLINE_PROPERTY' }
  | { type: 'BID_AUCTION'; amount: number }
  | { type: 'PASS_AUCTION' }
  | { type: 'BUILD_HOUSE'; tileId: number }
  | { type: 'SELL_HOUSE'; tileId: number }
  | { type: 'MORTGAGE_PROPERTY'; tileId: number }
  | { type: 'UNMORTGAGE_PROPERTY'; tileId: number }
  | { type: 'PAY_JAIL_FINE' }
  | { type: 'USE_JAIL_CARD' }
  | { type: 'PROPOSE_TRADE'; offer: Omit<TradeOffer, 'id' | 'status' | 'senderId'> }
  | { type: 'ACCEPT_TRADE' }
  | { type: 'DECLINE_TRADE' }
  | { type: 'CANCEL_TRADE' }
  | { type: 'END_TURN' }
  | { type: 'DECLARE_BANKRUPTCY' }
  | { type: 'SEND_CHAT'; message: string };

// Server to Client Messages
export type ServerMessage = 
  | { type: 'ROOM_STATE'; state: GameState; myPlayerId: string }
  | { type: 'ERROR'; message: string }
  | { type: 'NOTIFICATION'; message: string; style?: 'success' | 'warning' | 'error' | 'info' };
