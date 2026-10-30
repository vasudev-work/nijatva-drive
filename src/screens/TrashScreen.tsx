import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import type { DriveNode } from '../types';
import { DriveHeader } from '../components/DriveHeader';
import { Sheet } from '../components/Sheet';
import { EmptyState, IconTile, PrimaryButton } from '../components/ui';
import { categoryOf, formatBytes, formatShortDate } from '../utils/format';
import { iconForCategory, inkForCategory, tintForCategory } from '../utils/icons';

export function TrashScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { theme, trashedNodes, restore, destroy, emptyTrash } = useDrive();
  const [menuNode, setMenuNode] = useState<DriveNode | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const items = trashedNodes();

  return (
    <View style={{ flex: 1 }}>
      <DriveHeader
        title="Trash"
        subtitle="Deleted items stay here until you empty them"
        showSearch={false}
        onAvatarPress={onOpenSettings}
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 140 }}
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={styles.headRow}>
              <Text style={[styles.count, { color: theme.colors.textMuted }]}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
              <Pressable onPress={() => setConfirmEmpty(true)} hitSlop={8}>
                <Text style={[styles.emptyTrash, { color: theme.colors.danger }]}>Empty trash</Text>
              </Pressable>
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon="trash-bin"
            title="Trash is empty"
            body="Files you delete land here first, so a mistaken tap is never final."
          />
        }
        renderItem={({ item }) => {
          const category = categoryOf(item);
          return (
            <Pressable
              onPress={() => setMenuNode(item)}
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
                  {item.kind === 'folder' ? 'Folder' : formatBytes(item.size)} · deleted{' '}
                  {item.trashedAt ? formatShortDate(item.trashedAt) : ''}
                </Text>
              </View>
              <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.textFaint} />
            </Pressable>
          );
        }}
      />

      <Sheet
        visible={menuNode !== null}
        title={menuNode?.name ?? ''}
        subtitle="In trash"
        onClose={() => setMenuNode(null)}
        actions={
          menuNode
            ? [
                {
                  key: 'restore',
                  label: 'Restore',
                  icon: 'arrow-undo',
                  onPress: () => restore(menuNode.id),
                },
                {
                  key: 'destroy',
                  label: 'Delete permanently',
                  icon: 'trash',
                  tone: 'danger',
                  onPress: () => destroy(menuNode.id),
                },
              ]
            : []
        }
      />

      <Sheet
        visible={confirmEmpty}
        title="Empty trash?"
        subtitle="Every item in trash is removed from this device for good."
        onClose={() => setConfirmEmpty(false)}
      >
        <View style={{ paddingHorizontal: 12, paddingTop: 6 }}>
          <PrimaryButton label="Empty trash" tone="danger" icon="trash" onPress={() => emptyTrash()} />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  count: { fontSize: 12.5, fontWeight: '600' },
  emptyTrash: { fontSize: 12.5, fontWeight: '700' },
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
});
