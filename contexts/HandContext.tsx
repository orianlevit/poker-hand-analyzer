import React, { createContext, useContext, useState } from 'react';
import { HandData } from '../types/hand';
import { handService } from '../services/handService';

interface HandContextType {
  handData: Partial<HandData>;
  updateHandData: (data: Partial<HandData>) => void;
  saveHand: () => Promise<void>;
  resetHand: () => void;
}

const HandContext = createContext<HandContextType | undefined>(undefined);

export function HandProvider({ children }: { children: React.ReactNode }) {
  const [handData, setHandData] = useState<Partial<HandData>>({});

  const updateHandData = (data: Partial<HandData>) => {
    setHandData(prev => ({
      ...prev,
      ...data
    }));
  };

  const saveHand = async () => {
    try {
      // Log the current state for debugging
      console.log('Current hand data:', handData);

      // Save whatever data we have
      await handService.saveHand(handData as HandData);
    } catch (error) {
      console.error('Error in saveHand:', error);
      throw error;
    }
  };

  const resetHand = () => {
    setHandData({});
  };

  return (
    <HandContext.Provider value={{ handData, updateHandData, saveHand, resetHand }}>
      {children}
    </HandContext.Provider>
  );
}

export function useHand() {
  const context = useContext(HandContext);
  if (context === undefined) {
    throw new Error('useHand must be used within a HandProvider');
  }
  return context;
}

function getMissingRequiredFields(hand: Partial<HandData>): string[] {
  const missingFields: string[] = [];

  // Check basic fields
  if (!hand.gameStyle) missingFields.push('gameStyle');
  if (!hand.position) missingFields.push('position');
  if (!hand.stackSize) missingFields.push('stackSize');
  
  // Check hole cards
  if (!hand.holeCards || hand.holeCards.length !== 2) {
    missingFields.push('holeCards');
  }

  // Check preflop action
  if (!hand.preflopAction?.action) {
    missingFields.push('preflopAction');
  }

  // Check flop
  if (!hand.flopCards || hand.flopCards.length !== 3) {
    missingFields.push('flopCards');
  }
  if (!hand.flopAction?.actions) {
    missingFields.push('flopAction');
  }

  // Check turn
  if (!hand.turnCard) {
    missingFields.push('turnCard');
  }
  if (!hand.turnAction?.actions) {
    missingFields.push('turnAction');
  }

  // Check river
  if (!hand.riverCard) {
    missingFields.push('riverCard');
  }
  if (!hand.riverAction?.actions) {
    missingFields.push('riverAction');
  }

  // Check blinds for cash games
  if (hand.gameStyle === 'cash' && !hand.blinds) {
    missingFields.push('blinds');
  }

  return missingFields;
} 