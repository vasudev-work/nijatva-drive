import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import type { IconName } from '../utils/icons';

export type TabKey = 'files' | 'photos' | 'shared' | 'trash' | 'settings';

const TABS: { key: TabKey; label: string; icon: IconName; activeIcon: IconName }[] = [
  { key: 'files', label: 'Files', icon: 'folder-outline', activeIcon: 'folder' },
  { key: 'photos', label: 'Photos', icon: 'images-outline', activeIcon: 'images' },
  { key: 'shared', label: 'Shared', icon: 'link-outline', activeIcon: 'link' },
  { key: 'trash', label: 'Trash', icon: 'trash-outline', activeIcon: 'trash' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

export function TabBar({
  active,
  onChange,
  bottomInset = 0,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  bottomInset?: number;
}) {
  const { theme, stats } = useDrive();
  return (
    <View style={[styles.wrap, { bottom: 18 + bottomInset }]} pointerEvents="box-none">
      <View style={[styles.barWrap, theme.shadow.float]}>
        <View
          style={[
            styles.glass,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.mode === 'dark' ? 'rgba(17,26,24,0.92)' : 'rgba(255,255,255,0.92)',
            },
          ]}
        />
        <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.6 : 1 }]}
            >
              <View>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={21}
                  color={isActive ? theme.colors.primary : theme.colors.textFaint}
                />
                {tab.key === 'trash' && stats.trashed > 0 ? (
                  <View style={[styles.dot, { backgroundColor: theme.colors.danger }]} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: isActive ? theme.colors.primary : theme.colors.textFaint },
                  isActive && { fontWeight: '700' },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  barWrap: { borderRadius: 24 },
  glass: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 9,
    gap: 2,
  },
  tab: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 11, gap: 3, minWidth: 58 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
  dot: { position: 'absolute', top: -1, right: -2, width: 6, height: 6, borderRadius: 3 },
});
