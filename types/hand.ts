export type Suit = '♠' | '♣' | '♥' | '♦';
export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type Card = { rank: Rank; suit: Suit };

export type GameStyle = 'cash' | 'tournament';
export type Position = 'UTG' | 'UTG+1' | 'UTG+2' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type Blinds = '1/2' | '1/3' | '2/5' | '5/10' | '10/25' | '25/50';
export type Action = 'Fold' | 'Call' | 'Raise' | 'Check' | null;

export interface PlayerAction {
  position: Position;
  action: Action;
  amount?: number;  // The actual amount in currency units for calls and raises
}

export interface HandData {
  // Screening
  gameStyle: GameStyle;
  blinds?: Blinds;  // only for cash games
  smallBlind: number;  // Amount in currency units
  bigBlind: number;    // Amount in currency units
  playerCount: number;
  positions: Position[];

  // Preflop
  position: Position;
  stackSize: number;
  holeCards: [Card, Card];
  
  // Preflop Action
  preflopAction: {
    actions: string;
    notes?: string;
  };
  preflopActions: PlayerAction[];
  preflopObservations?: string;

  // Flop
  flopCards: [Card, Card, Card];
  flopAction: {
    actions: string;
    notes?: string;
  };
  flopActions: PlayerAction[];
  flopObservations?: string;

  // Turn
  turnCard: Card;
  turnAction: {
    actions: string;
    notes?: string;
  };
  turnActions: PlayerAction[];
  turnObservations?: string;

  // River
  riverCard: Card;
  riverAction: {
    actions: string;
    notes?: string;
  };
  riverActions: PlayerAction[];
  riverObservations?: string;
} 