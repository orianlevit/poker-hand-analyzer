import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useHand } from '../contexts/HandContext';
import type { GameStyle, Blinds } from '../types/hand';

type Props = NativeStackScreenProps<RootStackParamList, 'Screening'>;

export default function ScreeningScreen({ navigation }: Props) {
  const { handData, updateHandData } = useHand();
  const [gameStyle, setGameStyle] = useState<GameStyle | null>(handData.gameStyle || null);
  const [blinds, setBlinds] = useState<Blinds | null>(handData.blinds || null);
  const [playerCount, setPlayerCount] = useState<number>(handData.playerCount || 6);
  const [smallBlind, setSmallBlind] = useState('');
  const [bigBlind, setBigBlind] = useState('');
  const [isManualBlinds, setIsManualBlinds] = useState(false);

  const blindOptions: (Blinds | 'Manual')[] = ['1/2', '1/3', '2/5', '5/10', '10/25', '25/50', 'Manual'];
  const playerCountOptions = [2, 3, 4, 5, 6, 7, 8, 9];

  const SelectionButton = ({ 
    selected, 
    onPress, 
    title 
  }: { 
    selected: boolean; 
    onPress: () => void; 
    title: string;
  }) => (
    <TouchableOpacity
      style={[styles.selectionButton, selected && styles.selectedButton]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, selected && styles.selectedButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const handleGameStyleSelect = (style: GameStyle) => {
    setGameStyle(style);
    setBlinds(null);
    setSmallBlind('');
    setBigBlind('');
    setIsManualBlinds(false);
    updateHandData({ 
      gameStyle: style,
      blinds: undefined
    });
  };

  const handleBlindsSelect = (blind: Blinds | 'Manual') => {
    if (blind === 'Manual') {
      setIsManualBlinds(true);
      setBlinds(null);
      setSmallBlind('');
      setBigBlind('');
      updateHandData({ 
        blinds: undefined,
        smallBlind: 0,
        bigBlind: 0
      });
    } else {
      setIsManualBlinds(false);
      setBlinds(blind);
      // Parse the blinds string and update context
      const [sb, bb] = blind.split('/').map(num => parseInt(num));
      updateHandData({ 
        blinds: blind,
        smallBlind: sb,
        bigBlind: bb
      });
    }
  };

  const handleSmallBlindChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setSmallBlind(numericValue);
    if (numericValue) {
      const sb = parseInt(numericValue);
      updateHandData({ smallBlind: sb });
    }
  };

  const handleBigBlindChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setBigBlind(numericValue);
    if (numericValue) {
      const bb = parseInt(numericValue);
      updateHandData({ bigBlind: bb });
    }
  };

  const handlePlayerCountSelect = (count: number) => {
    setPlayerCount(count);
    updateHandData({ playerCount: count });
  };

  const canProceed = gameStyle && 
    (gameStyle === 'cash' ? 
      (isManualBlinds ? 
        (smallBlind !== '' && bigBlind !== '' && parseInt(bigBlind) > parseInt(smallBlind)) : 
        blinds !== null) : 
      (smallBlind !== '' && bigBlind !== '' && parseInt(bigBlind) > parseInt(smallBlind)));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Game Style</Text>
          <View style={styles.buttonGroup}>
            <SelectionButton
              selected={gameStyle === 'cash'}
              onPress={() => handleGameStyleSelect('cash')}
              title="Cash"
            />
            <SelectionButton
              selected={gameStyle === 'tournament'}
              onPress={() => handleGameStyleSelect('tournament')}
              title="Tournament"
            />
          </View>

          {gameStyle === 'cash' && (
            <>
              <Text style={styles.sectionTitle}>Blinds</Text>
              <View style={styles.blindsContainer}>
                {blindOptions.map((blind) => (
                  <SelectionButton
                    key={blind}
                    selected={blind === 'Manual' ? isManualBlinds : blinds === blind}
                    onPress={() => handleBlindsSelect(blind)}
                    title={blind}
                  />
                ))}
              </View>
              {isManualBlinds && (
                <>
                  <View style={styles.tournamentBlindsContainer}>
                    <View style={styles.blindInput}>
                      <Text style={styles.blindLabel}>Small Blind</Text>
                      <TextInput
                        style={styles.input}
                        value={smallBlind}
                        onChangeText={handleSmallBlindChange}
                        keyboardType="number-pad"
                        placeholder="Enter SB"
                      />
                    </View>
                    <View style={styles.blindInput}>
                      <Text style={styles.blindLabel}>Big Blind</Text>
                      <TextInput
                        style={styles.input}
                        value={bigBlind}
                        onChangeText={handleBigBlindChange}
                        keyboardType="number-pad"
                        placeholder="Enter BB"
                      />
                    </View>
                  </View>
                  {parseInt(bigBlind) <= parseInt(smallBlind) && bigBlind !== '' && (
                    <Text style={styles.errorText}>Big blind must be greater than small blind</Text>
                  )}
                </>
              )}
            </>
          )}

          {gameStyle === 'tournament' && (
            <>
              <Text style={styles.sectionTitle}>Tournament Blinds</Text>
              <View style={styles.tournamentBlindsContainer}>
                <View style={styles.blindInput}>
                  <Text style={styles.blindLabel}>Small Blind</Text>
                  <TextInput
                    style={styles.input}
                    value={smallBlind}
                    onChangeText={handleSmallBlindChange}
                    keyboardType="number-pad"
                    placeholder="Enter SB"
                  />
                </View>
                <View style={styles.blindInput}>
                  <Text style={styles.blindLabel}>Big Blind</Text>
                  <TextInput
                    style={styles.input}
                    value={bigBlind}
                    onChangeText={handleBigBlindChange}
                    keyboardType="number-pad"
                    placeholder="Enter BB"
                  />
                </View>
              </View>
              {parseInt(bigBlind) <= parseInt(smallBlind) && bigBlind !== '' && (
                <Text style={styles.errorText}>Big blind must be greater than small blind</Text>
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>Number of Players</Text>
          <View style={styles.buttonGroup}>
            {playerCountOptions.map((count) => (
              <SelectionButton
                key={count}
                selected={playerCount === count}
                onPress={() => handlePlayerCountSelect(count)}
                title={count.toString()}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, !canProceed && styles.disabledButton]}
          onPress={() => canProceed && navigation.navigate('Preflop')}
          disabled={!canProceed}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  blindsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
    alignItems: 'center',
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
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  nextButton: {
    backgroundColor: '#2C3E50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tournamentBlindsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 8,
  },
  blindInput: {
    flex: 1,
  },
  blindLabel: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
}); 