import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import CardSelector from './components/CardSelector';
import { useHand } from '../contexts/HandContext';
import type { Card as CardType } from '../types/hand';
import PokerTable from './components/PokerTable';

type Props = NativeStackScreenProps<RootStackParamList, 'Flop'>;

type Action = 'Fold' | 'Call' | 'Raise' | 'Check' | null;
type Position = 'UTG' | 'UTG+1' | 'UTG+2' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

interface PlayerAction {
  position: Position;
  action: Action;
  raiseAmount?: number;
}

type StepType = 'cards' | 'action' | 'observations';

interface Step {
  id: number;
  type: StepType;
  position?: Position;
  complete: boolean;
}

export default function FlopScreen({ navigation }: Props) {
  const { handData, updateHandData } = useHand();
  
  // Step Management
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, type: 'cards', complete: false }
  ]);

  // Game State
  const [flopCards, setFlopCards] = useState<CardType[]>([]);
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([]);
  const [observations, setObservations] = useState('');
  
  // Modal State
  const [raiseModalVisible, setRaiseModalVisible] = useState(false);
  const [currentActionPosition, setCurrentActionPosition] = useState<Position | null>(null);
  const [raiseAmount, setRaiseAmount] = useState('');

  // Initialize steps and actions based on player positions
  useEffect(() => {
    if (handData.position) {
      const positions = getPositionsInOrder(handData.position);
      
      // Get preflop actions to identify folded players
      const foldedPositions = new Set(
        (handData.preflopActions || [])
          .filter(pa => pa.action === 'Fold')
          .map(pa => pa.position)
      );

      // Initialize actions for all positions, marking folded players
      const initialActions = positions.map(pos => ({
        position: pos,
        action: foldedPositions.has(pos) ? ('Fold' as const) : null
      }));
      setPlayerActions(initialActions);
      
      // Add action steps only for active positions
      const activePositions = positions.filter(pos => !foldedPositions.has(pos));
      const actionSteps = activePositions.map((pos, index) => ({
        id: 2 + index,
        type: 'action' as StepType,
        position: pos,
        complete: false
      }));
      
      setSteps([
        { id: 1, type: 'cards', complete: false },
        ...actionSteps,
        { id: 2 + activePositions.length, type: 'observations', complete: false }
      ]);

      // Log for debugging
      console.log('Preflop actions:', handData.preflopActions);
      console.log('Folded positions:', Array.from(foldedPositions));
      console.log('Initial actions:', initialActions);
    }
  }, [handData.position, handData.preflopActions]);

  // When actions are updated, save them to context
  useEffect(() => {
    if (playerActions.length > 0) {
      // Get preflop folded positions to maintain fold state
      const preflopFoldedPositions = new Set(
        (handData.preflopActions || [])
          .filter(pa => pa.action === 'Fold')
          .map(pa => pa.position)
      );

      // Combine preflop folds with current actions
      const updatedActions = playerActions.map(action => 
        preflopFoldedPositions.has(action.position)
          ? { ...action, action: ('Fold' as const) }
          : action
      );

      updateHandData({
        flopActions: updatedActions
      });

      // Log for debugging
      console.log('Updated actions:', updatedActions);
    }
  }, [playerActions, handData.preflopActions]);

  // Initialize from context
  useEffect(() => {
    if (handData.flopCards) {
      setFlopCards(handData.flopCards);
      setSteps(prev => prev.map(step => 
        step.type === 'cards' ? { ...step, complete: true } : step
      ));
    }
  }, []);

  const getPositionsInOrder = (heroPosition: Position): Position[] => {
    const allPositions: Position[] = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    const playerCount = handData.playerCount || 6;
    
    // Get the positions for the current player count
    let positions: Position[];
    switch (playerCount) {
      case 2:
        positions = ['BTN', 'BB'];
        break;
      case 3:
        positions = ['BTN', 'SB', 'BB'];
        break;
      case 4:
        positions = ['CO', 'BTN', 'SB', 'BB'];
        break;
      case 5:
        positions = ['HJ', 'CO', 'BTN', 'SB', 'BB'];
        break;
      case 6:
        positions = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
        break;
      case 7:
        positions = ['UTG', 'UTG+1', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
        break;
      case 8:
        positions = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
        break;
      case 9:
        positions = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
        break;
      default:
        positions = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    }

    // Post-flop action starts with SB or first active player after dealer in heads-up
    if (playerCount === 2) {
      // In heads-up, BB acts first post-flop
      return positions;
    } else {
      // In 3+ player games, SB acts first post-flop
      const sbIndex = positions.indexOf('SB');
      return [...positions.slice(sbIndex), ...positions.slice(0, sbIndex)];
    }
  };

  const handleCardSelect = (card: CardType) => {
    setFlopCards(prev => {
      let newCards;
      if (prev.some(c => c.rank === card.rank && c.suit === card.suit)) {
        newCards = prev.filter(c => !(c.rank === card.rank && c.suit === card.suit));
      } else if (prev.length >= 3) {
        newCards = [...prev.slice(0, 2), card];
      } else {
        newCards = [...prev, card];
      }
      
      if (newCards.length === 3) {
        updateHandData({ flopCards: newCards as [CardType, CardType, CardType] });
        setSteps(prev => prev.map(step => 
          step.type === 'cards' ? { ...step, complete: true } : step
        ));
        goToNextStep();
      }
      return newCards;
    });
  };

  const handleAction = (position: Position, action: Action) => {
    if (action === 'Raise') {
      setCurrentActionPosition(position);
      setRaiseAmount('');
      setRaiseModalVisible(true);
      return;
    }

    setPlayerActions(prev => 
      prev.map(p => 
        p.position === position
          ? { ...p, action: p.action === action ? null : action }
          : p
      )
    );

    setSteps(prev => prev.map(step => 
      step.type === 'action' && step.position === position
        ? { ...step, complete: true }
        : step
    ));

    goToNextStep();
  };

  const handleRaise = () => {
    const amount = parseFloat(raiseAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid raise amount');
      return;
    }

    setPlayerActions(prev => 
      prev.map(p => 
        p.position === currentActionPosition
          ? { ...p, action: 'Raise', raiseAmount: amount }
          : p
      )
    );

    setSteps(prev => prev.map(step => 
      step.type === 'action' && step.position === currentActionPosition
        ? { ...step, complete: true }
        : step
    ));

    setRaiseModalVisible(false);
    goToNextStep();
  };

  const handleObservationsChange = (text: string) => {
    setObservations(text);
    updateHandData({
      flopAction: {
        ...handData.flopAction,
        actions: handData.flopAction?.actions || '',
        notes: text
      }
    });
  };

  const handleObservationsSubmit = () => {
    setSteps(prev => prev.map(step => 
      step.type === 'observations' ? { ...step, complete: true } : step
    ));
    navigation.navigate('Turn');
  };

  const goToNextStep = () => {
    const nextIncompleteStep = steps.findIndex((step, index) => 
      index > currentStepIndex && !step.complete
    );
    
    if (nextIncompleteStep !== -1) {
      setCurrentStepIndex(nextIncompleteStep);
    } else if (steps.every(step => step.complete)) {
      navigation.navigate('Turn');
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      
      // Reset current step's data
      switch (steps[currentStepIndex].type) {
        case 'cards':
          setFlopCards([]);
          break;
        case 'action':
          const currentPos = steps[currentStepIndex].position;
          if (currentPos) {
            setPlayerActions(prev => 
              prev.map(p => p.position === currentPos ? { ...p, action: null } : p)
            );
          }
          break;
      }
      
      // Mark current step as incomplete
      setSteps(prev => prev.map(step => 
        step.id === steps[currentStepIndex].id ? { ...step, complete: false } : step
      ));
      
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const renderCurrentStep = () => {
    const currentStep = steps[currentStepIndex];

    switch (currentStep.type) {
      case 'cards':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Flop Cards</Text>
            <CardSelector
              selectedCards={flopCards}
              onSelectCard={handleCardSelect}
              maxCards={3}
            />
          </View>
        );

      case 'action':
        const actionPosition = currentStep.position!;
        const currentAction = playerActions.find(p => p.position === actionPosition);
        
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              Action for {actionPosition}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, currentAction?.action === 'Fold' && styles.selectedActionButton]}
                onPress={() => handleAction(actionPosition, 'Fold')}
              >
                <Text style={styles.actionButtonText}>Fold</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, currentAction?.action === 'Call' && styles.selectedActionButton]}
                onPress={() => handleAction(actionPosition, 'Call')}
              >
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, currentAction?.action === 'Raise' && styles.selectedActionButton]}
                onPress={() => handleAction(actionPosition, 'Raise')}
              >
                <Text style={styles.actionButtonText}>Raise</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, currentAction?.action === 'Check' && styles.selectedActionButton]}
                onPress={() => handleAction(actionPosition, 'Check')}
              >
                <Text style={styles.actionButtonText}>Check</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'observations':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Additional Observations (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={observations}
              onChangeText={handleObservationsChange}
              placeholder="Any additional observations about the flop action..."
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleObservationsSubmit}
            >
              <Text style={styles.submitButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  const isCurrentStepComplete = () => {
    const currentStep = steps[currentStepIndex];
    switch (currentStep.type) {
      case 'cards':
        return flopCards.length === 3;
      case 'action':
        const currentAction = playerActions.find(p => p.position === currentStep.position);
        return currentAction?.action !== null;
      case 'observations':
        return true; // Observations are optional
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      navigation.navigate('Turn');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Poker Table Visualization */}
              <View style={styles.tableContainer}>
                <PokerTable
                  playerCount={handData.playerCount || 6}
                  positions={getPositionsInOrder(handData.position || 'BB')}
                  actions={playerActions}
                  selectedPosition={handData.position || null}
                  currentStep={steps[currentStepIndex].type}
                  stackSize={handData.stackSize?.toString()}
                  holeCards={handData.holeCards}
                  currentActionPosition={steps[currentStepIndex].type === 'action' ? steps[currentStepIndex].position : undefined}
                  communityCards={[...(handData.flopCards || [])]}
                  smallBlind={handData.smallBlind || 0}
                  bigBlind={handData.bigBlind || 0}
                />
              </View>

              {/* Current Step */}
              {renderCurrentStep()}
            </ScrollView>

            {/* Fixed Bottom Navigation */}
            <View style={styles.bottomNavigation}>
              <TouchableOpacity
                style={[styles.navButton, currentStepIndex === 0 && styles.disabledButton]}
                onPress={goToPreviousStep}
                disabled={currentStepIndex === 0}
              >
                <Text style={styles.navButtonText}>Back</Text>
              </TouchableOpacity>
              
              <Text style={styles.stepIndicator}>
                Step {currentStepIndex + 1} of {steps.length}
              </Text>

              <TouchableOpacity
                style={[styles.navButton, !isCurrentStepComplete() && styles.disabledButton]}
                onPress={handleNextStep}
                disabled={!isCurrentStepComplete()}
              >
                <Text style={styles.navButtonText}>
                  {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Raise Modal */}
      <Modal
        visible={raiseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRaiseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Raise Amount</Text>
            <TextInput
              style={styles.raiseInput}
              value={raiseAmount}
              onChangeText={setRaiseAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setRaiseModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={handleRaise}
              >
                <Text style={[styles.modalButtonText, styles.modalPrimaryButtonText]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Add padding to account for bottom navigation
  },
  tableContainer: {
    height: 300, // Fixed height for the table
    marginBottom: 20,
  },
  stepContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#2C3E50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#34495E',
  },
  selectedActionButton: {
    backgroundColor: '#34495E',
  },
  actionButtonText: {
    color: '#34495E',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    backgroundColor: '#2C3E50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  raiseInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C3E50',
    alignItems: 'center',
  },
  modalPrimaryButton: {
    backgroundColor: '#2C3E50',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  modalPrimaryButtonText: {
    color: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
}); 