import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import type { Card, Suit, Rank } from '../../types/hand';

interface Props {
  selectedCards: Card[];
  onSelectCard: (card: Card) => void;
  maxCards: number;
}

export default function CardSelector({ selectedCards, onSelectCard, maxCards }: Props) {
  const suits: Suit[] = ['♠', '♣', '♥', '♦'];
  const ranks: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  const [selectedSuit, setSelectedSuit] = React.useState<Suit | null>(null);

  const handleSuitSelect = (suit: Suit) => {
    setSelectedSuit(suit === selectedSuit ? null : suit);
  };

  const handleCardSelect = (rank: Rank) => {
    if (selectedSuit) {
      onSelectCard({ rank, suit: selectedSuit });
      setSelectedSuit(null);
    }
  };

  const isCardSelected = (rank: Rank, suit: Suit) => {
    return selectedCards.some(card => card.rank === rank && card.suit === suit);
  };

  return (
    <View style={styles.container}>
      {/* Suit Selection */}
      <View style={styles.suitRow}>
        {suits.map((suit) => (
          <TouchableOpacity
            key={suit}
            style={[
              styles.suitButton,
              selectedSuit === suit && styles.selectedSuitButton,
              (suit === '♥' || suit === '♦') && styles.redSuit
            ]}
            onPress={() => handleSuitSelect(suit)}
          >
            <Text style={[
              styles.suitText,
              selectedSuit === suit && styles.selectedSuitText,
              (suit === '♥' || suit === '♦') && styles.redText
            ]}>
              {suit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rank Selection */}
      <View style={styles.rankGrid}>
        {ranks.map((rank) => (
          <TouchableOpacity
            key={rank}
            style={[
              styles.rankButton,
              selectedSuit && styles.rankButtonActive
            ]}
            onPress={() => selectedSuit && handleCardSelect(rank)}
            disabled={!selectedSuit}
          >
            <Text style={[
              styles.rankText,
              selectedSuit && styles.rankTextActive
            ]}>
              {rank}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  suitRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  suitButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedSuitButton: {
    backgroundColor: '#2C3E50',
    borderColor: '#2C3E50',
  },
  redSuit: {
    borderColor: '#E74C3C',
  },
  suitText: {
    fontSize: 28,
    color: '#2C3E50',
  },
  selectedSuitText: {
    color: '#fff',
  },
  redText: {
    color: '#E74C3C',
  },
  rankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  rankButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rankButtonActive: {
    borderColor: '#2C3E50',
  },
  rankText: {
    fontSize: 18,
    color: '#95a5a6',
    fontWeight: '600',
  },
  rankTextActive: {
    color: '#2C3E50',
  },
}); 