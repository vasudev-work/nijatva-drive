import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import type { DriveNode } from '../types';
import { categoryOf, formatBytes } from '../utils/format';
import { iconForCategory, inkForCategory, tintForCategory } from '../utils/icons';

export function FileGridCard({
  node,
  onPress,
  onLongPress,
  width,
}: {
  node: DriveNode;
  onPress: () => void;
  onLongPress: () => void;
  width: number;
}) {
  const { theme } = useDrive();
  const category = categoryOf(node);
  const showThumb = category === 'image' && node.localUri;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      style={({ pressed }) => [
        styles.card,
        {
          width,
          backgroundColor: pressed ? theme.colors.surfaceAlt : theme.colors.surface,
          borderColor: theme.colors.border,
        },
        theme.shadow.card,
      ]}
    >
      <View
        style={[
          styles.preview,
          { backgroundColor: showThumb ? theme.colors.surfaceSunken : tintForCategory(category, theme) },
        ]}
      >
        {showThumb ? (
          <Image source={{ uri: node.localUri as string }} style={styles.image} resizeMode="cover" />
        ) : (
          <Ionicons name={iconForCategory(category)} size={30} color={inkForCategory(category, theme)} />
        )}
        {node.starred ? (
          <View style={styles.star}>
            <Ionicons name="star" size={12} color={theme.colors.star} />
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {node.name}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textFaint }]} numberOfLines={1}>
          {node.kind === 'folder' ? 'Folder' : formatBytes(node.size)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  preview: { height: 104, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  star: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  body: { paddingHorizontal: 11, paddingVertical: 10 },
  name: { fontSize: 13, fontWeight: '600' },
  meta: { fontSize: 11, marginTop: 2, fontWeight: '500' },
});
