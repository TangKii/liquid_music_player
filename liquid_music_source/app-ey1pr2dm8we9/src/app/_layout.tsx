import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';
import { PlayerProvider } from '@/context/PlayerContext';
import '../global.css';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#07070b' }}>
      <PlayerProvider>
        <StatusBar style="light" backgroundColor="#07070b" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#07070b' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="player"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="folders"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
        </Stack>
        <PortalHost />
      </PlayerProvider>
    </GestureHandlerRootView>
  );
}
