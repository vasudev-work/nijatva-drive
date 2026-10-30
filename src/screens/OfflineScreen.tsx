import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import { EmptyState, IconTile } from '../components/ui';
import { categoryOf, formatBytes } from '../utils/format';
import { iconForCategory, inkForCategory, tintForCategory } from '../utils/icons';

export function OfflineScreen({
  onClose,
  onOpenFile,
}: {
  onClose: () => void;
  onOpenFile: (id: string) => void;
}) {
  const { theme, offlineNodes, toggleOffline } = useDrive();
  const items = offlineNodes();
  const bytes = items.reduce((sum, node) => sum + node.size, 0);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={[styles.back, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <Ionicons name="arrow-back" size={18} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Available offline</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {items.length} pinned · {formatBytes(bytes)}
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 }}
        ListEmptyComponent={
          <EmptyState
            icon="cloud-download-outline"
            title="Nothing pinned yet"
            body="Pin a file and it stays available even when the vault is busy syncing. Long-press any file to pin it."
          />
        }
        renderItem={({ item }) => {
          const category = categoryOf(item);
          return (
            <Pressable
              onPress={() => onOpenFile(item.id)}
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
                size={40}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.meta, { color: theme.colors.textFaint }]}>
                  {formatBytes(item.size)} · pinned
                </Text>
              </View>
              <Pressable onPress={() => toggleOffline(item.id)} hitSlop={10} style={styles.unpin}>
                <Ionicons name="cloud-done" size={19} color={theme.colors.accent} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 19, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, marginTop: 3, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  name: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 11.5, marginTop: 3, fontWeight: '500' },
  unpin: { padding: 4 },
});
