import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrive } from '../store/DriveProvider';
import { TabBar, type TabKey } from '../components/TabBar';
import { Loading, Toast } from '../components/ui';
import { FilesScreen } from '../screens/FilesScreen';
import { PhotosScreen } from '../screens/PhotosScreen';
import { SharedScreen } from '../screens/SharedScreen';
import { TrashScreen } from '../screens/TrashScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ViewerScreen } from '../screens/ViewerScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LockScreen } from '../screens/LockScreen';

export function Root() {
  const { ready, meta, theme } = useDrive();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('files');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!ready || initialized.current) return;
    initialized.current = true;
    setUnlocked(meta.passcode === null);
  }, [ready, meta.passcode]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <StatusBar barStyle="dark-content" />
        <Loading />
      </View>
    );
  }

  if (!meta.onboarded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.headerFrom }}>
        <StatusBar barStyle="light-content" />
        <WelcomeScreen />
      </View>
    );
  }

  if (meta.passcode !== null && !unlocked) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}>
        <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
        <LockScreen onUnlock={() => setUnlocked(true)} />
      </View>
    );
  }

  const openSettings = () => setTab('settings');

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.headerFrom }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.content, { paddingTop: insets.top, backgroundColor: theme.colors.bg }]}>
        {viewerId ? (
          <ViewerScreen nodeId={viewerId} onClose={() => setViewerId(null)} />
        ) : (
          <>
            {tab === 'files' ? (
              <FilesScreen
                folderId={folderId}
                onOpenFolder={(id) => setFolderId(id)}
                onOpenFile={(id) => setViewerId(id)}
                onOpenSettings={openSettings}
              />
            ) : null}
            {tab === 'photos' ? (
              <PhotosScreen onOpenFile={(id) => setViewerId(id)} onOpenSettings={openSettings} />
            ) : null}
            {tab === 'shared' ? <SharedScreen onOpenSettings={openSettings} /> : null}
            {tab === 'trash' ? <TrashScreen onOpenSettings={openSettings} /> : null}
            {tab === 'settings' ? <SettingsScreen /> : null}
            <TabBar active={tab} onChange={setTab} bottomInset={insets.bottom} />
            <Toast />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
