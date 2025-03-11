import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScreeningScreen from './screen-screening';
import PreflopScreen from './screen-preflop';
import FlopScreen from './screen-flop';
import TurnScreen from './screen-turn';
import RiverScreen from './screen-river';
import { RootStackParamList } from './types';
import { HandProvider } from '../contexts/HandContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <HandProvider>
      <Stack.Navigator>
        <Stack.Screen 
          name="Screening" 
          component={ScreeningScreen}
          options={{ title: 'Poker Hand Analysis' }}
        />
        <Stack.Screen 
          name="Preflop" 
          component={PreflopScreen}
          options={{ title: 'Preflop' }}
        />
        <Stack.Screen 
          name="Flop" 
          component={FlopScreen}
          options={{ title: 'Flop' }}
        />
        <Stack.Screen 
          name="Turn" 
          component={TurnScreen}
          options={{ title: 'Turn' }}
        />
        <Stack.Screen 
          name="River" 
          component={RiverScreen}
          options={{ title: 'River' }}
        />
      </Stack.Navigator>
    </HandProvider>
  );
} 