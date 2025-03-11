import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import CardSelector from './components/CardSelector';
import { useHand } from '../contexts/HandContext';
import type { Card as CardType } from '../types/hand';
import PokerTable from './components/PokerTable';

type Props = NativeStackScreenProps<RootStackParamList, 'Preflop'>;

type Action = 'Fold' | 'Call' | 'Raise' | 'Check' | null;
type PlayerPosition = 'UTG' | 'UTG+1' | 'UTG+2' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
type Position = PlayerPosition;

interface PlayerAction {
  position: PlayerPosition;
  action: Action;
  raiseAmount?: number;
  amount?: number;
}

type StepType = 'position' | 'stack' | 'cards' | 'action' | 'observations';

interface Step {
  id: number;
  type: StepType;
  position?: Position;  // For action steps
  complete: boolean;
}

export default function PreflopScreen({ navigation }: Props) {
  const { handData, updateHandData } = useHand();
  
  // Step Management
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, type: 'position', complete: false },
    { id: 2, type: 'stack', complete: false },
    { id: 3, type: 'cards', complete: false }
  ]);

  // Game State
  const [position, setPosition] = useState<Position | null>(null);
  const [stackSize, setStackSize] = useState('');
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([]);
  const [observations, setObservations] = useState('');
  const [currentBet, setCurrentBet] = useState<number>(0);
  
  // Modal State
  const [raiseModalVisible, setRaiseModalVisible] = useState(false);
  const [currentActionPosition, setCurrentActionPosition] = useState<PlayerPosition | null>(null);
  const [raiseAmount, setRaiseAmount] = useState('');

  const getPositionsInOrder = (heroPosition: PlayerPosition): PlayerPosition[] => {
    const playerCount = handData.playerCount || 6;
    
    // Get the positions for the current player count
    let positions: PlayerPosition[];
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

    // For preflop, we want to start with UTG
    const utgIndex = positions.indexOf('UTG');
    if (utgIndex !== -1) {
      // If UTG exists, start from UTG
      return [...positions.slice(utgIndex), ...positions.slice(0, utgIndex)];
    } else {
      // If UTG doesn't exist (2-4 players), start from first early position
      return positions;
    }
  };

  // Initialize player positions and steps based on player count
  useEffect(() => {
    if (handData.playerCount) {
      // Get positions for the current player count
      const positions = getPositionsInOrder(handData.position || 'BB');
      
      // Initialize player actions for each position
      setPlayerActions(positions.map(pos => ({ 
        position: pos, 
        action: null 
      })));
      
      // Add action steps for each position
      const actionSteps = positions.map((pos, index) => ({
        id: 4 + index,
        type: 'action' as StepType,
        position: pos,
        complete: false
      }));
      
      // Set all steps including position selection, stack size, cards, actions, and observations
      setSteps([
        { id: 1, type: 'position', complete: false },
        { id: 2, type: 'stack', complete: false },
        { id: 3, type: 'cards', complete: false },
        ...actionSteps,
        { id: 4 + positions.length, type: 'observations', complete: false }
      ]);
    }
  }, [handData.playerCount]);

  // Initialize data from context
  useEffect(() => {
    if (handData.position) {
      setPosition(handData.position as Position);
      setSteps(prev => prev.map(step => 
        step.type === 'position' ? { ...step, complete: true } : step
      ));
    }
    if (handData.stackSize) {
      setStackSize(handData.stackSize.toString());
      setSteps(prev => prev.map(step => 
        step.type === 'stack' ? { ...step, complete: true } : step
      ));
    }
    if (handData.holeCards) {
      setSelectedCards(handData.holeCards);
      setSteps(prev => prev.map(step => 
        step.type === 'cards' ? { ...step, complete: true } : step
      ));
    }
  }, [handData]);

  const handlePositionSelect = (pos: Position) => {
    setPosition(pos);
    updateHandData({ position: pos });
    setSteps(prev => prev.map(step => 
      step.type === 'position' ? { ...step, complete: true } : step
    ));
    goToNextStep();
  };

  const handleStackSizeChange = (value: string) => {
    setStackSize(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateHandData({ stackSize: numValue });
    }
  };

  const handleStackSizeSubmit = () => {
    if (stackSize && !isNaN(parseFloat(stackSize))) {
      setSteps(prev => prev.map(step => 
        step.type === 'stack' ? { ...step, complete: true } : step
      ));
      goToNextStep();
    } else {
      Alert.alert('Invalid Stack Size', 'Please enter a valid number');
    }
  };

  const handleCardSelect = (card: CardType) => {
    setSelectedCards(prev => {
      const newCards = prev.some(c => c.rank === card.rank && c.suit === card.suit)
        ? prev.filter(c => !(c.rank === card.rank && c.suit === card.suit))
        : prev.length >= 2 ? [prev[0], card] : [...prev, card];
      
      if (newCards.length === 2) {
        updateHandData({ holeCards: newCards as [CardType, CardType] });
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

    // For calls, use the current highest bet
    let amount: number | undefined;
    if (action === 'Call') {
      amount = currentBet > 0 ? currentBet : (handData.bigBlind || 0);
    }

    setPlayerActions(prev => 
      prev.map(p => 
        p.position === position
          ? { ...p, action: p.action === action ? null : action, amount }
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
    const minRaise = Math.max(currentBet, handData.bigBlind || 0);
    if (!amount || amount <= 0 || amount <= minRaise) {
      Alert.alert('Invalid Amount', 'Please enter a valid raise amount greater than the current bet');
      return;
    }

    // Update current highest bet
    setCurrentBet(amount);

    // Update player actions
    setPlayerActions(prev => 
      prev.map(p => 
        p.position === currentActionPosition
          ? { ...p, action: 'Raise', amount }
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
      preflopObservations: text
    });
  };

  const handleObservationsSubmit = () => {
    setSteps(prev => prev.map(step => 
      step.type === 'observations' ? { ...step, complete: true } : step
    ));
    navigation.navigate('Flop');
  };

  const goToNextStep = () => {
    const nextIncompleteStep = steps.findIndex((step, index) => 
      index > currentStepIndex && !step.complete
    );
    
    if (nextIncompleteStep !== -1) {
      setCurrentStepIndex(nextIncompleteStep);
    } else if (steps.every(step => step.complete)) {
      navigation.navigate('Flop');
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      
      // Reset current step's data
      switch (steps[currentStepIndex].type) {
        case 'position':
          setPosition(null);
          break;
        case 'stack':
          setStackSize('');
          break;
        case 'cards':
          setSelectedCards([]);
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
      case 'position':
        const positions = getPositionsInOrder(handData.position || 'BB');
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Your Position</Text>
            <View style={styles.buttonRow}>
              {positions.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  style={[styles.button, position === pos && styles.selectedButton]}
                  onPress={() => handlePositionSelect(pos)}
                >
                  <Text style={[styles.buttonText, position === pos && styles.selectedButtonText]}>
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'stack':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Enter Stack Size (USD)</Text>
            <TextInput
              style={styles.input}
              value={stackSize}
              onChangeText={handleStackSizeChange}
              keyboardType="decimal-pad"
              placeholder="Enter stack size"
              onSubmitEditing={handleStackSizeSubmit}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleStackSizeSubmit}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        );

      case 'cards':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Your Hole Cards</Text>
            <CardSelector
              selectedCards={selectedCards}
              onSelectCard={handleCardSelect}
              maxCards={2}
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
              {actionPosition === 'BB' && !playerActions.some(p => p.action === 'Raise') && (
                <TouchableOpacity
                  style={[styles.actionButton, currentAction?.action === 'Check' && styles.selectedActionButton]}
                  onPress={() => handleAction(actionPosition, 'Check')}
                >
                  <Text style={styles.actionButtonText}>Check</Text>
                </TouchableOpacity>
              )}
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
              placeholder="Any additional observations about the preflop action..."
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Poker Table Visualization */}
            <View style={styles.tableContainer}>
              <PokerTable
                playerCount={handData.playerCount || 6}
                positions={getPositionsInOrder(handData.position || 'BB')}
                actions={playerActions}
                selectedPosition={position}
                currentStep={steps[currentStepIndex].type}
                stackSize={stackSize}
                holeCards={selectedCards}
                currentActionPosition={steps[currentStepIndex].type === 'action' ? steps[currentStepIndex].position : undefined}
                smallBlind={handData.smallBlind || 0}
                bigBlind={handData.bigBlind || 0}
              />
            </View>

            {/* Current Step */}
            {renderCurrentStep()}

            {/* Navigation */}
            <View style={styles.navigationContainer}>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tableContainer: {
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
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedButton: {
    backgroundColor: '#2C3E50',
    borderColor: '#2C3E50',
  },
  buttonText: {
    color: '#2C3E50',
    fontSize: 16,
  },
  selectedButtonText: {
    color: '#fff',
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
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
  },
  navButton: {
    backgroundColor: '#2C3E50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
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