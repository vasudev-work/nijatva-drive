import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import { DriveHeader } from '../components/DriveHeader';
import { EmptyState, IconTile, SectionTitle } from '../components/ui';
import { categoryOf, formatDate } from '../utils/format';
import { iconForCategory, inkForCategory, tintForCategory } from '../utils/icons';

export function SharedScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { theme, sharedNodes, revokeShare, notify, share } = useDrive();
  const items = sharedNodes();

  return (
    <View style={{ flex: 1 }}>
      <DriveHeader
        title="Shared"
        subtitle="Links you have handed out"
        showSearch={false}
        onAvatarPress={onOpenSettings}
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 140 }}
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={{ marginBottom: 6 }}>
              <SectionTitle title={`${items.length} active ${items.length === 1 ? 'link' : 'links'}`} />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon="link"
            title="Nothing shared yet"
            body="Create a link from any file or folder, then send it to whoever needs access. Revoke it any time."
          />
        }
        renderItem={({ item }) => {
          const category = categoryOf(item);
          return (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                theme.shadow.card,
              ]}
            >
              <View style={styles.head}>
                <IconTile
                  icon={iconForCategory(category)}
                  tint={tintForCategory(category, theme)}
                  ink={inkForCategory(category, theme)}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.textFaint }]}>
                    Shared {item.share ? formatDate(item.share.createdAt) : ''}
                  </Text>
                </View>
              </View>
              <View style={[styles.linkRow, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Ionicons name="link" size={13} color={theme.colors.textMuted} />
                <Text style={[styles.link, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {item.share?.link}
                </Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  onPress={async () => {
                    if (item.share) {
                      await Clipboard.setStringAsync(item.share.link);
                      notify('Link copied');
                    }
                  }}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons name="copy" size={14} color={theme.colors.text} />
                  <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Copy</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    await share(item.id);
                    notify('New link generated');
                  }}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons name="refresh" size={14} color={theme.colors.text} />
                  <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Rotate</Text>
                </Pressable>
                <Pressable
                  onPress={() => revokeShare(item.id)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons name="close-circle" size={14} color={theme.colors.danger} />
                  <Text style={[styles.actionLabel, { color: theme.colors.danger }]}>Revoke</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
    marginBottom: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 14.5, fontWeight: '600' },
  meta: { fontSize: 11.5, marginTop: 3, fontWeight: '500' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 12,
  },
  link: { fontSize: 11.5, flex: 1, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionLabel: { fontSize: 12, fontWeight: '600' },
});
