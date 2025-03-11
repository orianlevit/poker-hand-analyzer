import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

type Suit = '♠' | '♣' | '♥' | '♦';
type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
type Card = { rank: Rank; suit: Suit };

interface CardSelectorProps {
  onSelectCard: (card: Card) => void;
  selectedCards: Card[];
  maxCards?: number;
}

export default function CardSelector({ onSelectCard, selectedCards, maxCards = 2 }: CardSelectorProps) {
  const [selectedSuit, setSelectedSuit] = useState<Suit>('♠');
  
  const ranks: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits: Suit[] = ['♠', '♣', '♥', '♦'];

  const isCardSelected = (rank: Rank, suit: Suit) => {
    return selectedCards.some(card => card.rank === rank && card.suit === suit);
  };

  const renderCard = (rank: Rank) => {
    const isSelected = isCardSelected(rank, selectedSuit);
    const isDisabled = selectedCards.length >= maxCards && !isSelected;
    const card = { rank, suit: selectedSuit };
    
    return (
      <TouchableOpacity
        key={`${rank}${selectedSuit}`}
        style={[
          styles.card,
          isSelected && styles.selectedCard,
          isDisabled && styles.disabledCard,
        ]}
        onPress={() => !isDisabled && onSelectCard(card)}
        disabled={isDisabled}
      >
        <Text style={[
          styles.cardText,
          (selectedSuit === '♥' || selectedSuit === '♦') && styles.redCard,
          isSelected && styles.selectedCardText,
        ]}>
          {rank}
          {selectedSuit}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.suitSelector}>
        {suits.map((suit) => (
          <TouchableOpacity
            key={suit}
            style={[
              styles.suitButton,
              selectedSuit === suit && styles.selectedSuitButton,
            ]}
            onPress={() => setSelectedSuit(suit)}
          >
            <Text style={[
              styles.suitText,
              (suit === '♥' || suit === '♦') && styles.redCard,
            ]}>
              {suit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.cardGrid} contentContainerStyle={styles.cardGridContent}>
        {ranks.map(rank => renderCard(rank))}
      </ScrollView>

      <View style={styles.selectedCardsContainer}>
        <Text style={styles.selectedCardsTitle}>Selected Cards: ({selectedCards.length}/{maxCards})</Text>
        <View style={styles.selectedCardsDisplay}>
          {selectedCards.map((card, index) => (
            <Text
              key={index}
              style={[
                styles.selectedCardDisplay,
                (card.suit === '♥' || card.suit === '♦') && styles.redCard,
              ]}
            >
              {card.rank}{card.suit}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  suitSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  suitButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  selectedSuitButton: {
    borderColor: '#2C3E50',
    backgroundColor: '#f5f5f5',
  },
  suitText: {
    fontSize: 24,
    color: '#000',
  },
  cardGrid: {
    maxHeight: 200,
  },
  cardGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  card: {
    width: 45,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  selectedCard: {
    borderColor: '#2C3E50',
    backgroundColor: '#2C3E50',
  },
  disabledCard: {
    opacity: 0.5,
  },
  cardText: {
    fontSize: 18,
    color: '#000',
  },
  selectedCardText: {
    color: '#fff',
  },
  redCard: {
    color: '#E74C3C',
  },
  selectedCardsContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  selectedCardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  selectedCardsDisplay: {
    flexDirection: 'row',
    gap: 16,
  },
  selectedCardDisplay: {
    fontSize: 24,
    color: '#000',
  },
}); 