import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import type { DriveNode } from '../types';
import { categoryOf, formatBytes, formatShortDate } from '../utils/format';
import { iconForCategory, inkForCategory, tintForCategory } from '../utils/icons';
import { IconTile } from './ui';

export function FileRow({
  node,
  onPress,
  onLongPress,
  onMenu,
}: {
  node: DriveNode;
  onPress: () => void;
  onLongPress: () => void;
  onMenu: () => void;
}) {
  const { theme } = useDrive();
  const category = categoryOf(node);
  const meta =
    node.kind === 'folder'
      ? 'Folder'
      : `${formatBytes(node.size)} · ${formatShortDate(node.updatedAt)}`;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfaceAlt : theme.colors.surface,
          borderColor: theme.colors.border,
        },
        theme.shadow.card,
      ]}
    >
      <IconTile
        icon={iconForCategory(category)}
        tint={tintForCategory(category, theme)}
        ink={inkForCategory(category, theme)}
      />
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
            {node.name}
          </Text>
          {node.starred ? <Ionicons name="star" size={12} color={theme.colors.star} /> : null}
          {node.share ? <Ionicons name="link" size={12} color={theme.colors.primary} /> : null}
          {node.offline ? <Ionicons name="cloud-done" size={12} color={theme.colors.accent} /> : null}
        </View>
        <Text style={[styles.meta, { color: theme.colors.textFaint }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Pressable onPress={onMenu} hitSlop={12} style={styles.menu}>
        <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.textFaint} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14.5, fontWeight: '600', letterSpacing: -0.2, flexShrink: 1 },
  meta: { fontSize: 11.5, marginTop: 3, fontWeight: '500' },
  menu: { padding: 4 },
});
