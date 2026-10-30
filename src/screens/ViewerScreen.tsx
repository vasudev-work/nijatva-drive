import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { File } from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useDrive } from '../store/DriveProvider';
import { Card } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { FolderPickerSheet, PromptSheet } from '../components/Prompts';
import { readTextBlob } from '../storage';
import { categoryOf, formatBytes, formatDate } from '../utils/format';
import { iconForCategory, inkForCategory, tintForCategory } from '../utils/icons';

export function ViewerScreen({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const { theme, nodeById, toggleStar, trash, rename, move, share, revokeShare, notify } = useDrive();
  const node = nodeById(nodeId);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [menu, setMenu] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const category = node ? categoryOf(node) : 'other';
  const canPreviewText =
    category === 'document' || category === 'code' || (node?.mimeType ?? '').startsWith('text/');

  useEffect(() => {
    let cancelled = false;
    if (node && node.kind === 'file' && node.localUri && canPreviewText) {
      setLoadingText(true);
      readTextBlob(node.localUri)
        .then((content) => {
          if (!cancelled) setTextPreview(content.slice(0, 4000));
        })
        .catch(() => {
          if (!cancelled) setTextPreview(null);
        })
        .finally(() => {
          if (!cancelled) setLoadingText(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [node, canPreviewText]);

  if (!node) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 80 }}>
          This item is no longer available.
        </Text>
        <Pressable onPress={onClose} style={styles.backInline}>
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const openExternally = async () => {
    try {
      if (!node.localUri) {
        notify('No local copy to open');
        return;
      }
      const file = new File(node.localUri);
      const canPreview = await file.canPreview();
      if (canPreview) {
        await file.preview({ title: node.name });
      } else {
        await Share.share({ url: node.localUri, message: node.name });
      }
    } catch {
      notify('Could not open this file');
    }
  };

  const copyShareLink = async () => {
    const link = node.share?.link ?? (await share(node.id));
    await Clipboard.setStringAsync(link);
    notify('Link copied');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={12} style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="arrow-back" size={18} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {node.name}
        </Text>
        <Pressable onPress={() => setMenu(true)} hitSlop={12} style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View
          style={[
            styles.preview,
            { backgroundColor: tintForCategory(category, theme), borderColor: theme.colors.border },
          ]}
        >
          {category === 'image' && node.localUri ? (
            <Image source={{ uri: node.localUri }} style={styles.image} resizeMode="contain" />
          ) : canPreviewText ? (
            loadingText ? (
              <ActivityIndicator color={inkForCategory(category, theme)} />
            ) : textPreview ? (
              <ScrollView style={{ maxHeight: 320, width: '100%' }}>
                <Text style={[styles.code, { color: inkForCategory(category, theme) }]}>
                  {textPreview}
                </Text>
              </ScrollView>
            ) : (
              <Text style={[styles.previewHint, { color: inkForCategory(category, theme) }]}>
                No readable text in this file
              </Text>
            )
          ) : (
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Ionicons name={iconForCategory(category)} size={54} color={inkForCategory(category, theme)} />
              <Text style={[styles.previewHint, { color: inkForCategory(category, theme) }]}>
                Preview not supported — open it in another app
              </Text>
            </View>
          )}
        </View>

        <Card style={{ padding: 16, marginTop: 18 }}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{node.name}</Text>
          <Text style={[styles.sub, { color: theme.colors.textMuted }]}>
            {node.kind === 'folder' ? 'Folder' : formatBytes(node.size)} ·{' '}
            {node.mimeType.split('/').pop()}
          </Text>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <MetaRow label="Created" value={formatDate(node.createdAt)} />
          <MetaRow label="Modified" value={formatDate(node.updatedAt)} />
          <MetaRow label="Location" value={node.parentId ? 'Inside a folder' : 'Vault root'} />
          <MetaRow label="Starred" value={node.starred ? 'Yes' : 'No'} />
          <MetaRow
            label="Share link"
            value={node.share ? node.share.link.replace('https://', '') : 'Not shared'}
          />
        </Card>

        <View style={styles.actions}>
          <ActionButton
            icon="download-outline"
            label="Open"
            onPress={openExternally}
            background={theme.colors.primary}
            color={theme.colors.onPrimary}
          />
          <ActionButton
            icon={node.starred ? 'star' : 'star-outline'}
            label={node.starred ? 'Starred' : 'Star'}
            onPress={() => toggleStar(node.id)}
            background={theme.colors.surface}
            color={theme.colors.text}
          />
          <ActionButton
            icon="link"
            label="Copy link"
            onPress={copyShareLink}
            background={theme.colors.surface}
            color={theme.colors.text}
          />
        </View>
      </ScrollView>

      <Sheet
        visible={menu}
        title={node.name}
        onClose={() => setMenu(false)}
        actions={[
          { key: 'rename', label: 'Rename', icon: 'pencil', onPress: () => setRenameOpen(true) },
          { key: 'move', label: 'Move to folder', icon: 'swap-horizontal', onPress: () => setMoveOpen(true) },
          {
            key: 'share',
            label: node.share ? 'Revoke share link' : 'Create share link',
            icon: 'link',
            onPress: async () => {
              if (node.share) {
                await revokeShare(node.id);
              } else {
                const link = await share(node.id);
                await Clipboard.setStringAsync(link);
                notify('Link created and copied');
              }
            },
          },
          {
            key: 'trash',
            label: 'Move to trash',
            icon: 'trash',
            tone: 'danger',
            onPress: () => {
              trash(node.id);
              onClose();
            },
          },
        ]}
      />

      <PromptSheet
        visible={renameOpen}
        title="Rename"
        initialValue={node.name}
        confirmLabel="Save name"
        onClose={() => setRenameOpen(false)}
        onSubmit={(value) => rename(node.id, value)}
      />

      <FolderPickerSheet
        visible={moveOpen}
        excludeIds={[node.id]}
        onClose={() => setMoveOpen(false)}
        onSelect={(target) => move(node.id, target)}
      />
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const { theme } = useDrive();
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, { color: theme.colors.textFaint }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: theme.colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  background,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  background: string;
  color: string;
}) {
  const { theme } = useDrive();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: background,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={17} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  preview: {
    height: 320,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  code: { fontSize: 12, lineHeight: 18, fontFamily: 'monospace' },
  previewHint: { fontSize: 12.5, fontWeight: '600', textAlign: 'center' },
  name: { fontSize: 17, fontWeight: '700' },
  sub: { fontSize: 12.5, marginTop: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 },
  metaLabel: { fontSize: 12.5, fontWeight: '500' },
  metaValue: { fontSize: 12.5, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: { fontSize: 12.5, fontWeight: '700' },
  backInline: { alignSelf: 'center', marginTop: 16 },
});
