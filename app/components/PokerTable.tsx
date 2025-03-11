import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import type { Position } from '../../types/hand';
import type { Card as CardType } from '../../types/hand';

interface PlayerAction {
  position: Position;
  action: 'Fold' | 'Call' | 'Raise' | 'Check' | null;
  amount?: number;
}

interface Props {
  playerCount: number;
  positions: Position[];
  actions: PlayerAction[];
  selectedPosition: Position | null;
  currentStep: string;
  stackSize?: string;
  holeCards?: CardType[];
  currentActionPosition?: Position;
  communityCards?: CardType[];
  smallBlind: number;
  bigBlind: number;
}

export default function PokerTable({
  playerCount,
  positions,
  actions,
  selectedPosition,
  currentStep,
  stackSize,
  holeCards,
  currentActionPosition,
  communityCards,
  smallBlind,
  bigBlind
}: Props) {
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  
  // Make table size responsive to screen dimensions but larger
  const tableWidth = Math.min(windowWidth * 0.95, windowHeight * 0.45);
  const tableHeight = tableWidth * 0.7;
  
  // Scale seat size based on table size
  const seatSize = Math.max(tableWidth * 0.12, 40);
  const baseAvatarSize = seatSize * 0.9;
  
  const getAvatarSize = (position: Position) => baseAvatarSize;

  // Increased radius multiplier to spread out avatars more
  const radius = Math.min(tableWidth * 0.52, tableHeight * 0.55);

  const getPositionStyle = (index: number) => {
    const totalPositions = positions.length;
    const angle = (index * 2 * Math.PI) / totalPositions - Math.PI / 2;
    
    const x = Math.cos(angle) * radius + tableWidth / 2;
    const y = Math.sin(angle) * radius + tableHeight / 2;

    // Calculate angle to determine which side of the avatar to place the D
    const angleInDegrees = (angle * 180) / Math.PI;
    const isRightSide = Math.abs(angleInDegrees) > 90;

    return {
      position: 'absolute' as const,
      left: x - seatSize/2,
      top: y - seatSize/2,
      width: seatSize,
      height: seatSize,
      alignItems: 'center' as const,
      dealerSide: isRightSide ? 'left' : 'right', // Add this to track which side to place D
    };
  };

  // Helper to determine if position is on left or right half of table
  const isPositionOnLeft = (index: number, totalPositions: number) => {
    const angle = (index * 2 * Math.PI) / totalPositions - Math.PI / 2;
    return Math.cos(angle) < 0;
  };

  const getActionColor = (action: 'Fold' | 'Call' | 'Raise' | 'Check' | null) => {
    switch (action) {
      case 'Fold': return '#e74c3c';
      case 'Call': return '#2ecc71';
      case 'Raise': return '#f1c40f';
      case 'Check': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const isSpecialPosition = (position: Position) => {
    return position === 'BTN'; // Only BTN (Dealer) is special now
  };

  const getPositionLabel = (position: Position) => {
    switch (position) {
      case 'BTN': return 'D';
      case 'SB': return `SB ($${smallBlind})`;
      case 'BB': return `BB ($${bigBlind})`;
      default: return position;
    }
  };

  const getActionText = (action: PlayerAction) => {
    if (!action.action) return '';
    
    switch (action.action) {
      case 'Fold':
        return 'Fold';
      case 'Check':
        return 'Check';
      case 'Call':
        // Find the amount to call (last raise or BB)
        const lastRaise = actions
          .filter(a => a.action === 'Raise' && a.amount)
          .pop();
        const callAmount = lastRaise ? lastRaise.amount : bigBlind;
        return `Call $${callAmount}`;
      case 'Raise':
        return action.amount ? `Raise $${action.amount}` : 'Raise';
      default:
        return action.action;
    }
  };

  const renderHoleCards = (position: Position, index: number) => {
    if ((currentStep === 'cards' || currentStep === 'action' || currentStep === 'observations') && 
        position === selectedPosition && 
        holeCards?.length) {
      const isLeft = isPositionOnLeft(index, positions.length);
      
      return (
        <View style={[
          styles.holeCards,
          isLeft ? styles.holeCardsRight : styles.holeCardsLeft
        ]}>
          {holeCards.map((card, cardIndex) => (
            <View key={cardIndex} style={[
              styles.card,
              { marginLeft: cardIndex > 0 ? 4 : 0 }
            ]}>
              <Text style={[
                styles.cardText,
                (card.suit === '♥' || card.suit === '♦') && styles.redCard
              ]}>
                {card.rank}{card.suit}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    return null;
  };

  // Add render function for community cards
  const renderCommunityCards = () => {
    if (!communityCards?.length) return null;
    
    return (
      <View style={styles.communityCardsContainer}>
        {communityCards.map((card, index) => (
          <View key={index} style={[
            styles.communityCard,
            { marginLeft: index > 0 ? 4 : 0 }
          ]}>
            <Text style={[
              styles.communityCardText,
              (card.suit === '♥' || card.suit === '♦') && styles.redCard
            ]}>
              {card.rank}{card.suit}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: tableWidth, height: tableHeight }]}>
      <View style={[styles.tableFelt, { width: tableWidth, height: tableHeight }]}>
        <View style={styles.tableRail} />

        {/* Community Cards */}
        {renderCommunityCards()}

        {/* Stack Size */}
        {(currentStep === 'stack' || currentStep === 'cards' || currentStep === 'action' || currentStep === 'observations') && 
         stackSize && (
          <Text style={styles.stackAmount}>${stackSize}</Text>
        )}

        {/* Player Positions */}
        {positions.map((position, index) => {
          const playerAction = actions.find(a => a.position === position);
          const isSelected = position === selectedPosition;
          const isFolded = playerAction?.action === 'Fold';
          const positionStyle = getPositionStyle(index);
          
          return (
            <View key={position} style={positionStyle}>
              <View style={[
                styles.seatContainer,
                isFolded && styles.foldedSeatContainer
              ]}>
                {/* Position Label */}
                <View style={[
                  styles.positionMarker,
                  currentStep === 'position' && isSelected && styles.selectedPositionMarker,
                  isFolded && styles.foldedPositionMarker,
                  positionStyle.dealerSide === 'left' ? styles.positionMarkerLeft : styles.positionMarkerRight
                ]}>
                  <Text style={[
                    styles.positionMarkerText,
                    isFolded && styles.foldedText
                  ]}>
                    {getPositionLabel(position)}
                  </Text>
                </View>

                {/* Player Avatar */}
                <View style={[
                  styles.avatarContainer,
                  currentStep === 'action' && position === currentActionPosition && styles.currentActionContainer
                ]}>
                  <View style={[
                    styles.playerAvatar,
                    { 
                      width: getAvatarSize(position), 
                      height: getAvatarSize(position)
                    },
                    isSelected ? styles.selectedPlayerAvatar : styles.defaultPlayerAvatar,
                    isFolded && styles.foldedPlayerAvatar
                  ]}>
                    <Text style={[
                      styles.avatarIcon,
                      isSelected ? styles.selectedAvatarIcon : styles.defaultAvatarIcon,
                      isFolded && styles.foldedText
                    ]}>👤</Text>
                  </View>

                  {/* Action Text */}
                  {playerAction?.action && (
                    <View style={[
                      styles.actionBadge,
                      { backgroundColor: getActionColor(playerAction.action) }
                    ]}>
                      <Text style={styles.actionText}>
                        {getActionText(playerAction)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Hole Cards */}
                {renderHoleCards(position, index)}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    marginBottom: 80,
  },
  tableFelt: {
    backgroundColor: '#35654d',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tableRail: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 110,
    borderWidth: 10,
    borderColor: '#4a2810',
  },
  stackAmount: {
    position: 'absolute',
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  seatContainer: {
    alignItems: 'center',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarContainer: {
    padding: 2,
    borderRadius: 27,
    backgroundColor: '#2E8B57',
  },
  currentActionContainer: {
    padding: 4,
  },
  playerAvatar: {
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  defaultPlayerAvatar: {
    backgroundColor: '#90EE90',
  },
  selectedPlayerAvatar: {
    backgroundColor: '#90EE90',
  },
  avatarIcon: {
    fontSize: 22,
    lineHeight: 26,
  },
  defaultAvatarIcon: {
    color: '#2E8B57',
  },
  selectedAvatarIcon: {
    color: '#2E8B57',
  },
  positionMarker: {
    position: 'absolute',
    backgroundColor: '#2C3E50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 1,
    top: '40%',
  },
  positionMarkerLeft: {
    right: '100%',
    marginRight: 4,
  },
  positionMarkerRight: {
    left: '100%',
    marginLeft: 4,
  },
  selectedPositionMarker: {
    backgroundColor: '#FFA500',
    borderColor: '#FF8C00',
  },
  positionMarkerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionBadge: {
    padding: 2,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
    position: 'absolute',
    bottom: -30,
    left: '50%',
    transform: [{ translateX: -25 }],
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  holeCards: {
    flexDirection: 'row',
    position: 'absolute',
    zIndex: 2,
    top: -25, // Position above avatar
  },
  holeCardsLeft: {
    left: '50%', // Center horizontally
    transform: [{ translateX: -30 }], // Adjust based on card width
  },
  holeCardsRight: {
    left: '50%', // Center horizontally
    transform: [{ translateX: -30 }], // Adjust based on card width
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 3,
    padding: 2,
    minWidth: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 1,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  redCard: {
    color: '#e74c3c',
  },
  communityCardsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    top: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 4,
    minWidth: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  communityCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  foldedSeatContainer: {
    opacity: 0.5,
  },
  foldedPlayerAvatar: {
    backgroundColor: '#ccc',
    borderColor: '#999',
  },
  foldedPositionMarker: {
    backgroundColor: '#999',
    borderColor: '#ccc',
  },
  foldedText: {
    color: '#666',
  },
  foldedActionLabel: {
    backgroundColor: '#999',
  },
}); 