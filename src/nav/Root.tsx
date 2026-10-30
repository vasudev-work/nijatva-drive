import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrive } from '../store/DriveProvider';
import { TabBar, type TabKey } from '../components/TabBar';
import { Drawer, type DrawerTarget } from '../components/Drawer';
import { UploadOverlay } from '../components/UploadOverlay';
import { Sheet } from '../components/Sheet';
import { Loading, PrimaryButton, Toast } from '../components/ui';
import { StorageMeter } from '../components/StorageMeter';
import { FilesScreen } from '../screens/FilesScreen';
import { PhotosScreen } from '../screens/PhotosScreen';
import { SharedScreen } from '../screens/SharedScreen';
import { TrashScreen } from '../screens/TrashScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ViewerScreen } from '../screens/ViewerScreen';
import { OfflineScreen } from '../screens/OfflineScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LockScreen } from '../screens/LockScreen';
import { formatBytes } from '../utils/format';

export function Root() {
  const { ready, meta, theme, locked, unlock, notify } = useDrive();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('files');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!ready || initialized.current) return;
    initialized.current = true;
    setTab(meta.defaultHomeTab === 'photos' ? 'photos' : 'files');
  }, [ready, meta.defaultHomeTab]);

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

  if (meta.passcode !== null && locked) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}>
        <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
        <LockScreen onUnlock={unlock} />
      </View>
    );
  }

  const openDrawer = () => setDrawerOpen(true);

  const navigateFromDrawer = (target: DrawerTarget) => {
    setDrawerOpen(false);
    setViewerId(null);
    if (target === 'offline') {
      setOfflineOpen(true);
      return;
    }
    setOfflineOpen(false);
    setTab(target);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.headerFrom }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.content, { paddingTop: insets.top, backgroundColor: theme.colors.bg }]}>
        {viewerId ? (
          <ViewerScreen nodeId={viewerId} onClose={() => setViewerId(null)} />
        ) : offlineOpen ? (
          <OfflineScreen onClose={() => setOfflineOpen(false)} onOpenFile={(id) => setViewerId(id)} />
        ) : (
          <>
            {tab === 'files' ? (
              <FilesScreen
                folderId={folderId}
                onOpenFolder={(id) => setFolderId(id)}
                onOpenFile={(id) => setViewerId(id)}
                onOpenDrawer={openDrawer}
              />
            ) : null}
            {tab === 'photos' ? (
              <PhotosScreen onOpenFile={(id) => setViewerId(id)} onOpenDrawer={openDrawer} />
            ) : null}
            {tab === 'shared' ? <SharedScreen onOpenDrawer={openDrawer} /> : null}
            {tab === 'trash' ? <TrashScreen onOpenDrawer={openDrawer} /> : null}
            {tab === 'settings' ? <SettingsScreen /> : null}
            <TabBar active={tab} onChange={setTab} bottomInset={insets.bottom} />
            <Toast />
          </>
        )}

        <UploadOverlay />
      </View>

      <Drawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={navigateFromDrawer}
        onOpenPlan={() => {
          setDrawerOpen(false);
          setPlanOpen(true);
        }}
      />

      <Sheet
        visible={planOpen}
        title="Plan & storage"
        subtitle="Free — 15 GB on this device"
        onClose={() => setPlanOpen(false)}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
          <StorageMeter />
          <View style={styles.planRow}>
            <View style={{ flex: 1 }}>
              <View style={[styles.planBadge, { backgroundColor: theme.colors.primarySoft }]}>
                <Text style={[styles.planBadgeLabel, { color: theme.colors.primary }]}>FREE</Text>
              </View>
              <Text style={[styles.planTitle, { color: theme.colors.text }]}>Nijatva Free</Text>
              <Text style={[styles.planBody, { color: theme.colors.textMuted }]}>
                {formatBytes(meta.quotaBytes)} quota, unlimited folders, share links and trash.
                Upgrades are not part of this build.
              </Text>
            </View>
          </View>
          <PrimaryButton
            label="Manage storage"
            icon="options-outline"
            tone="neutral"
            onPress={() => {
              setPlanOpen(false);
              setTab('settings');
              notify('Storage breakdown lives in Settings');
            }}
          />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  planRow: { flexDirection: 'row', marginTop: 18, marginBottom: 18 },
  planBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  planBadgeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  planTitle: { fontSize: 15, fontWeight: '700', marginTop: 8 },
  planBody: { fontSize: 12.5, lineHeight: 18, marginTop: 4 },
});
