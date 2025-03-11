import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useHand } from '../contexts/HandContext';

type Props = NativeStackScreenProps<RootStackParamList, 'PreflopAction'>;

export default function PreflopActionScreen({ navigation }: Props) {
  const { handData, updateHandData } = useHand();
  const [previousAction, setPreviousAction] = useState('');
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize from context if available
  useEffect(() => {
    if (handData.preflopAction) {
      setPreviousAction(handData.preflopAction.previousAction || '');
      setAction(handData.preflopAction.action || '');
      setNotes(handData.preflopAction.notes || '');
    }
  }, []);

  // Update context whenever any field changes
  const handlePreviousActionChange = (text: string) => {
    setPreviousAction(text);
    updateHandData({
      preflopAction: {
        ...handData.preflopAction,
        previousAction: text,
        action: action,
        notes: notes
      }
    });
  };

  const handleActionChange = (text: string) => {
    setAction(text);
    updateHandData({
      preflopAction: {
        ...handData.preflopAction,
        previousAction: previousAction,
        action: text,
        notes: notes
      }
    });
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    updateHandData({
      preflopAction: {
        ...handData.preflopAction,
        previousAction: previousAction,
        action: action,
        notes: text
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Previous Action</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={previousAction}
                onChangeText={handlePreviousActionChange}
                placeholder="What happened before your turn? (e.g. MP raised to 50, 3 callers including button and self)"
                multiline
                numberOfLines={3}
                returnKeyType="done"
                blurOnSubmit={true}
              />

              <Text style={styles.sectionTitle}>Your Action</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={action}
                onChangeText={handleActionChange}
                placeholder="What did you decide to do? (e.g. Called 50, Raised to 150)"
                multiline
                numberOfLines={3}
                returnKeyType="done"
                blurOnSubmit={true}
              />

              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={handleNotesChange}
                placeholder="Any additional notes..."
                multiline
                numberOfLines={3}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigation.navigate('Flop')}
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
  keyboardAvoidingView: {
    flex: 1,
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
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 