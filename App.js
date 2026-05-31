import React from 'react';
import { View } from 'react-native';
import { ConversationProvider } from './src/context/ConversationContext';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <ConversationProvider>
        <HomeScreen />
      </ConversationProvider>
    </View>
  );
}
