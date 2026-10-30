import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DriveProvider } from './src/store/DriveProvider';
import { Root } from './src/nav/Root';

export default function App() {
  return (
    <SafeAreaProvider>
      <DriveProvider>
        <Root />
      </DriveProvider>
    </SafeAreaProvider>
  );
}
