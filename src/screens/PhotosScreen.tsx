import React, { useMemo } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import { DriveHeader } from '../components/DriveHeader';
import { EmptyState } from '../components/ui';
import { categoryOf, formatBytes } from '../utils/format';

export function PhotosScreen({
  onOpenFile,
  onOpenDrawer,
}: {
  onOpenFile: (id: string) => void;
  onOpenDrawer: () => void;
}) {
  const { theme, nodes } = useDrive();
  const { width } = useWindowDimensions();

  const photos = useMemo(
    () =>
      nodes
        .filter((node) => node.kind === 'file' && node.trashedAt === null && categoryOf(node) === 'image')
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [nodes],
  );

  const groups = useMemo(() => {
    const map = new Map<string, typeof photos>();
    for (const photo of photos) {
      const date = new Date(photo.updatedAt);
      const key = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      const bucket = map.get(key) ?? [];
      bucket.push(photo);
      map.set(key, bucket);
    }
    return [...map.entries()];
  }, [photos]);

  const totalBytes = photos.reduce((sum, node) => sum + node.size, 0);
  const size = (width - 40 - 8) / 3;

  return (
    <View style={{ flex: 1 }}>
      <DriveHeader
        title="Photos"
        subtitle={`${photos.length} images · ${formatBytes(totalBytes)}`}
        showSearch={false}
        onAvatarPress={onOpenDrawer}
      />
      <FlatList
        data={groups}
        keyExtractor={([key]) => key}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 140 }}
        ListEmptyComponent={
          <EmptyState
            icon="images"
            title="No photos yet"
            body="Images you upload from the Files tab are collected here automatically, grouped by day."
          />
        }
        renderItem={({ item: [key, bucket] }) => (
          <View style={{ marginBottom: 22 }}>
            <View style={styles.groupHead}>
              <Text style={[styles.groupTitle, { color: theme.colors.text }]}>{key}</Text>
              <Text style={[styles.groupCount, { color: theme.colors.textFaint }]}>
                {bucket.length}
              </Text>
            </View>
            <View style={styles.grid}>
              {bucket.map((photo) => (
                <Pressable
                  key={photo.id}
                  onPress={() => onOpenFile(photo.id)}
                  style={({ pressed }) => [
                    styles.tile,
                    {
                      width: size,
                      height: size,
                      backgroundColor: theme.colors.surfaceAlt,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  {photo.localUri ? (
                    <Image source={{ uri: photo.localUri }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <Ionicons name="image" size={22} color={theme.colors.textFaint} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  groupTitle: { fontSize: 14, fontWeight: '700' },
  groupCount: { fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tile: { borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});
