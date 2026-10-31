import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import type { IconName } from '../utils/icons';
import { formatBytes, initialsOf } from '../utils/format';
import { StorageMeter } from './StorageMeter';

export type DrawerTarget = 'files' | 'trash' | 'offline' | 'settings';

const REPO_URL = 'https://github.com/vasudev-work/nijatva-drive/issues/new';

export function Drawer({
  visible,
  onClose,
  onNavigate,
  onOpenPlan,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (target: DrawerTarget) => void;
  onOpenPlan: () => void;
}) {
  const { theme, stats, meta, lock, notify, offlineNodes, zoho } = useDrive();
  const pinned = offlineNodes().length;
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.86, 340);
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, anim]);

  if (!mounted) return null;

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-panelWidth, 0] });
  const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const usagePercent = stats.quota > 0 ? Math.round((stats.used / stats.quota) * 100) : 0;

  const item = (icon: IconName, label: string, onPress: () => void, trailing?: string) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed ? { backgroundColor: theme.colors.surfaceAlt } : null]}
    >
      <Ionicons name={icon} size={20} color={theme.colors.textMuted} />
      <Text style={[styles.itemLabel, { color: theme.colors.text }]}>{label}</Text>
      {trailing ? (
        <Text style={[styles.itemTrailing, { color: theme.colors.textFaint }]}>{trailing}</Text>
      ) : null}
    </Pressable>
  );

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdropWrap, { opacity: backdropOpacity }]}>
          <Pressable
            style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            {
              width: panelWidth,
              backgroundColor: theme.colors.bg,
              borderColor: theme.colors.border,
              transform: [{ translateX }],
            },
          ]}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() => onNavigate('files')}
              style={({ pressed }) => [
                styles.account,
                { backgroundColor: theme.colors.surfaceAlt, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.avatarLabel, { color: theme.colors.onPrimary }]}>
                  {initialsOf('Vasudev Work')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountName, { color: theme.colors.text }]} numberOfLines={1}>
                  {zoho.session ? zoho.session.profile.name : 'nijatva.os'}
                </Text>
                <Text style={[styles.accountMail, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {zoho.session ? zoho.session.profile.email : 'vasudev.work@rediffmail.com'}
                </Text>
              </View>
              {zoho.session ? (
                <View style={[styles.zohoBadge, { backgroundColor: theme.colors.primarySoft }]}>
                  <Text style={[styles.zohoBadgeLabel, { color: theme.colors.primary }]}>ZOHO</Text>
                </View>
              ) : (
                <Ionicons name="chevron-down" size={16} color={theme.colors.textFaint} />
              )}
            </Pressable>

            <View style={styles.group}>
              {item('folder-outline', 'My files', () => onNavigate('files'))}
              {item('trash-outline', 'Trash', () => onNavigate('trash'), stats.trashed > 0 ? `${stats.trashed}` : undefined)}
              {item(
                'cloud-download-outline',
                'Available offline',
                () => onNavigate('offline'),
                pinned > 0 ? `${pinned}` : undefined,
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.groupLabel, { color: theme.colors.textFaint }]}>More</Text>
            <View style={styles.group}>
              {item('settings-outline', 'Settings', () => onNavigate('settings'))}
              {item('card-outline', 'Plan & storage', onOpenPlan)}
              {item('bug-outline', 'Report a bug', () => {
                Linking.openURL(REPO_URL).catch(() => notify('No browser available'));
              })}
              {item('lock-closed-outline', 'Lock vault', () => {
                onClose();
                if (meta.passcode) {
                  lock();
                } else {
                  onNavigate('settings');
                  notify('Set a passcode in Security first');
                }
              })}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.storageHead}>
              <Text style={[styles.groupLabel, { color: theme.colors.textFaint }]}>Storage</Text>
              <Text style={[styles.groupLabel, { color: theme.colors.textFaint }]}>
                {formatBytes(stats.quota)}
              </Text>
            </View>

            <Pressable
              onPress={() => notify('Plans are local in this build — no upgrade needed')}
              style={({ pressed }) => [styles.item, pressed ? { backgroundColor: theme.colors.surfaceAlt } : null]}
            >
              <Ionicons name="gift-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.itemLabel, { color: theme.colors.text }]}>Get up to 5 GB for free</Text>
            </Pressable>

            <View style={styles.usageRow}>
              <Ionicons name="cloud-outline" size={18} color={theme.colors.textMuted} />
              <Text style={[styles.usageLabel, { color: theme.colors.textMuted }]}>Drive usage</Text>
              <Text style={[styles.usageValue, { color: theme.colors.text }]}>{usagePercent}%</Text>
            </View>
            <View style={{ paddingHorizontal: 22 }}>
              <StorageMeter showCaption={false} />
              <Text style={[styles.usageCaption, { color: theme.colors.textMuted }]}>
                {formatBytes(stats.used)} of {formatBytes(stats.quota)} used
              </Text>
            </View>

            <Text style={[styles.version, { color: theme.colors.textFaint }]}>Nijatva Drive 1.1.0</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdropWrap: { ...StyleSheet.absoluteFill },
  backdrop: { flex: 1 },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: 54,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 16,
  },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { fontSize: 15, fontWeight: '700' },
  accountName: { fontSize: 14.5, fontWeight: '700' },
  accountMail: { fontSize: 11.5, marginTop: 2 },
  zohoBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  zohoBadgeLabel: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.6 },
  group: { paddingTop: 18, paddingHorizontal: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
  },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  itemTrailing: { fontSize: 12.5, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 18, marginHorizontal: 16 },
  groupLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  storageHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 10,
  },
  usageLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  usageValue: { fontSize: 13, fontWeight: '700' },
  usageCaption: { fontSize: 12, fontWeight: '600', marginTop: 9 },
  version: { fontSize: 11, textAlign: 'center', marginTop: 34, fontWeight: '500' },
});
