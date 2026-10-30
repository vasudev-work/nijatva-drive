import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrive } from '../store/DriveProvider';
import { palette } from '../theme';
import { StorageMeter } from './StorageMeter';
import { initialsOf } from '../utils/format';

export function DriveHeader({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  onAvatarPress,
  showSearch = true,
}: {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onAvatarPress?: () => void;
  showSearch?: boolean;
}) {
  const { theme, stats } = useDrive();
  return (
    <LinearGradient
      colors={[theme.colors.headerFrom, theme.colors.headerTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrap}
    >
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>
            <Ionicons name="shield-checkmark" size={11} color={palette.mintSoft} /> Nijatva Drive
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onAvatarPress}
          style={({ pressed }) => [styles.avatar, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.avatarLabel}>{initialsOf('Vasudev Work')}</Text>
        </Pressable>
      </View>

      {showSearch && onSearchChange !== undefined ? (
        <View style={styles.search}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder="Search your vault"
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchValue ? (
            <Pressable onPress={() => onSearchChange('')} hitSlop={10}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.meter}>
        <StorageMeter light />
      </View>
      <Text style={styles.meta}>
        {stats.files} files · {stats.folders} folders · {stats.shared} shared
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', letterSpacing: -0.6, marginTop: 6 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12.5, marginTop: 3 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14, padding: 0 },
  meter: { marginTop: 16 },
  meta: { color: 'rgba(255,255,255,0.62)', fontSize: 11.5, marginTop: 10, fontWeight: '600' },
});
