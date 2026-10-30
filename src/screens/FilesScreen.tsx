import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDrive } from '../store/DriveProvider';
import type { DriveNode, SortKey, ViewMode } from '../types';
import { DriveHeader } from '../components/DriveHeader';
import { FileRow } from '../components/FileRow';
import { FileGridCard } from '../components/FileGridCard';
import { Sheet, type SheetAction } from '../components/Sheet';
import { FolderPickerSheet, PromptSheet } from '../components/Prompts';
import { Chip, EmptyState, SectionTitle } from '../components/ui';
import { categoryOf, formatBytes, formatShortDate } from '../utils/format';

export function FilesScreen({
  folderId,
  onOpenFolder,
  onOpenFile,
  onOpenDrawer,
}: {
  folderId: string | null;
  onOpenFolder: (id: string | null) => void;
  onOpenFile: (id: string) => void;
  onOpenDrawer: () => void;
}) {
  const {
    theme,
    childrenOf,
    nodeById,
    pathTo,
    search,
    recentNodes,
    upload,
    createFolder,
    createNote,
    rename,
    move,
    trash,
    toggleStar,
    toggleOffline,
    share,
    notify,
    stats,
  } = useDrive();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [filter, setFilter] = useState<'all' | 'starred' | 'recent'>('all');
  const [menuNode, setMenuNode] = useState<DriveNode | null>(null);
  const [uploadSheet, setUploadSheet] = useState(false);
  const [folderPrompt, setFolderPrompt] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DriveNode | null>(null);
  const [notePrompt, setNotePrompt] = useState(false);
  const [moveTarget, setMoveTarget] = useState<DriveNode | null>(null);

  const currentFolder = nodeById(folderId);
  const trail = pathTo(folderId);

  const sortNodes = (nodes: DriveNode[]): DriveNode[] => {
    const copy = [...nodes];
    copy.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
      if (sortKey === 'size') return b.size - a.size;
      if (sortKey === 'updated') return b.updatedAt - a.updatedAt;
      return a.name.localeCompare(b.name);
    });
    return copy;
  };

  const items = useMemo(() => {
    if (query.trim().length > 0) return sortNodes(search(query));
    if (filter === 'starred') return sortNodes(childrenOf(folderId).filter((node) => node.starred));
    return sortNodes(childrenOf(folderId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter, folderId, childrenOf, search, sortKey]);

  const recent = useMemo(() => recentNodes(5), [recentNodes]);

  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const assets = result.assets.map((asset) => ({
        name: asset.name,
        uri: asset.uri,
        mimeType: asset.mimeType,
        size: asset.size,
      }));
      await upload(assets, folderId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch {
      notify('Upload failed');
    }
  };

  const nodeActions: SheetAction[] = menuNode
    ? [
        ...(menuNode.kind === 'folder'
          ? [
              {
                key: 'open',
                label: 'Open folder',
                icon: 'folder-open' as const,
                onPress: () => onOpenFolder(menuNode.id),
              },
            ]
          : [
              {
                key: 'open',
                label: 'Preview',
                icon: 'eye' as const,
                onPress: () => onOpenFile(menuNode.id),
              },
            ]),
        {
          key: 'rename',
          label: 'Rename',
          icon: 'pencil',
          onPress: () => setRenameTarget(menuNode),
        },
        {
          key: 'move',
          label: 'Move to folder',
          icon: 'swap-horizontal',
          onPress: () => setMoveTarget(menuNode),
        },
        {
          key: 'star',
          label: menuNode.starred ? 'Remove star' : 'Add star',
          icon: menuNode.starred ? 'star-outline' : 'star',
          onPress: () => {
            toggleStar(menuNode.id);
          },
        },
        {
          key: 'offline',
          label: menuNode.offline ? 'Remove from offline' : 'Available offline',
          icon: menuNode.offline ? 'cloud-done' : 'cloud-download-outline',
          onPress: () => {
            toggleOffline(menuNode.id);
          },
        },
        {
          key: 'share',
          label: menuNode.share ? 'Manage share link' : 'Create share link',
          icon: 'link',
          onPress: async () => {
            const link = await share(menuNode.id);
            notify(`Link ready: ${link.replace('https://', '')}`);
          },
        },
        {
          key: 'trash',
          label: 'Move to trash',
          icon: 'trash',
          tone: 'danger',
          onPress: () => {
            trash(menuNode.id);
          },
        },
      ]
    : [];

  const gridWidth = (width - 40 - 12) / 2;
  const isSearching = query.trim().length > 0;

  return (
    <View style={{ flex: 1 }}>
      <DriveHeader
        title={currentFolder ? currentFolder.name : 'Your vault'}
        subtitle={
          currentFolder
            ? `${formatBytes(stats.used)} encrypted locally`
            : 'Private by default · stored on device'
        }
        searchValue={query}
        onSearchChange={setQuery}
        onAvatarPress={onOpenDrawer}
      />

      <FlatList
        data={items}
        key={viewMode}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? { gap: 12 } : undefined}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140 }}
        ListHeaderComponent={
          <View>
            {!isSearching && trail.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.crumbs}>
                <Pressable onPress={() => onOpenFolder(null)}>
                  <Text style={[styles.crumb, { color: theme.colors.textMuted }]}>Vault</Text>
                </Pressable>
                {trail.map((folder, index) => (
                  <View key={folder.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="chevron-forward" size={12} color={theme.colors.textFaint} />
                    <Pressable
                      onPress={() => onOpenFolder(folder.id)}
                      disabled={index === trail.length - 1}
                    >
                      <Text
                        style={[
                          styles.crumb,
                          {
                            color:
                              index === trail.length - 1 ? theme.colors.text : theme.colors.textMuted,
                            fontWeight: index === trail.length - 1 ? '700' : '600',
                          },
                        ]}
                      >
                        {folder.name}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            {!isSearching ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
                  <Chip
                    label="Starred"
                    icon="star"
                    active={filter === 'starred'}
                    onPress={() => setFilter('starred')}
                  />
                  <Chip label="Name" active={sortKey === 'name'} onPress={() => setSortKey('name')} />
                  <Chip
                    label="Recent"
                    active={sortKey === 'updated'}
                    onPress={() => setSortKey('updated')}
                  />
                  <Chip label="Size" active={sortKey === 'size'} onPress={() => setSortKey('size')} />
                </ScrollView>

                <View style={styles.toolbar}>
                  <Text style={[styles.count, { color: theme.colors.textMuted }]}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Text>
                  <View style={styles.toggle}>
                    <Pressable
                      onPress={() => setViewMode('list')}
                      style={[
                        styles.toggleBtn,
                        viewMode === 'list' && { backgroundColor: theme.colors.surface },
                      ]}
                    >
                      <Ionicons
                        name="list"
                        size={16}
                        color={viewMode === 'list' ? theme.colors.text : theme.colors.textFaint}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => setViewMode('grid')}
                      style={[
                        styles.toggleBtn,
                        viewMode === 'grid' && { backgroundColor: theme.colors.surface },
                      ]}
                    >
                      <Ionicons
                        name="grid"
                        size={15}
                        color={viewMode === 'grid' ? theme.colors.text : theme.colors.textFaint}
                      />
                    </Pressable>
                  </View>
                </View>

                {filter === 'all' && folderId === null && recent.length > 0 ? (
                  <View style={{ marginBottom: 20 }}>
                    <SectionTitle title="Jump back in" />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                      {recent.map((node) => (
                        <Pressable
                          key={node.id}
                          onPress={() => onOpenFile(node.id)}
                          style={({ pressed }) => [
                            styles.recentCard,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}
                        >
                          <View style={[styles.recentDot, { backgroundColor: theme.colors.primarySoft }]}>
                            <Ionicons name="time" size={14} color={theme.colors.primary} />
                          </View>
                          <Text style={[styles.recentName, { color: theme.colors.text }]} numberOfLines={1}>
                            {node.name}
                          </Text>
                          <Text style={[styles.recentMeta, { color: theme.colors.textFaint }]}>
                            {formatShortDate(node.updatedAt)}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={[styles.count, { color: theme.colors.textMuted, marginBottom: 12 }]}>
                {items.length} result{items.length === 1 ? '' : 's'} for "{query.trim()}"
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) =>
          viewMode === 'grid' ? (
            <FileGridCard
              node={item}
              width={gridWidth}
              onPress={() => (item.kind === 'folder' ? onOpenFolder(item.id) : onOpenFile(item.id))}
              onLongPress={() => setMenuNode(item)}
            />
          ) : (
            <FileRow
              node={item}
              onPress={() => (item.kind === 'folder' ? onOpenFolder(item.id) : onOpenFile(item.id))}
              onLongPress={() => setMenuNode(item)}
              onMenu={() => setMenuNode(item)}
            />
          )
        }
        ListEmptyComponent={
          isSearching ? (
            <EmptyState
              icon="search"
              title="Nothing matched"
              body="Try a different name, or clear the search to browse the vault."
              actionLabel="Clear search"
              onAction={() => setQuery('')}
            />
          ) : (
            <EmptyState
              icon="cloud-upload"
              title={filter === 'starred' ? 'No starred items' : 'This folder is empty'}
              body={
                filter === 'starred'
                  ? 'Star the files you reach for often and they will show up here.'
                  : 'Add your first file, or create a folder to keep things tidy.'
              }
              actionLabel="Upload a file"
              onAction={handlePickFiles}
            />
          )
        }
      />

      <Pressable
        onPress={() => setUploadSheet(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.colors.primary, opacity: pressed ? 0.9 : 1 },
          theme.shadow.float,
        ]}
      >
        <Ionicons name="add" size={28} color={theme.colors.onPrimary} />
      </Pressable>

      <Sheet
        visible={uploadSheet}
        title="Add to vault"
        subtitle={currentFolder ? `Inside ${currentFolder.name}` : 'At the vault root'}
        onClose={() => setUploadSheet(false)}
        actions={[
          {
            key: 'file',
            label: 'Upload files',
            icon: 'cloud-upload',
            onPress: handlePickFiles,
          },
          {
            key: 'folder',
            label: 'New folder',
            icon: 'folder-outline',
            onPress: () => setFolderPrompt(true),
          },
          {
            key: 'note',
            label: 'New note',
            icon: 'create',
            onPress: () => setNotePrompt(true),
          },
        ]}
      />

      <Sheet
        visible={menuNode !== null}
        title={menuNode?.name ?? ''}
        subtitle={
          menuNode
            ? menuNode.kind === 'folder'
              ? 'Folder'
              : `${formatBytes(menuNode.size)} · ${categoryOf(menuNode)}`
            : undefined
        }
        actions={nodeActions}
        onClose={() => setMenuNode(null)}
      />

      <PromptSheet
        visible={folderPrompt}
        title="New folder"
        placeholder="Folder name"
        confirmLabel="Create folder"
        onClose={() => setFolderPrompt(false)}
        onSubmit={(name) => createFolder(name, folderId)}
      />

      <PromptSheet
        visible={notePrompt}
        title="New note"
        subtitle="A plain text note saved straight into the vault"
        placeholder="Note title"
        confirmLabel="Create note"
        onClose={() => setNotePrompt(false)}
        onSubmit={(name) =>
          createNote(name, `# ${name}\n\nWritten in Nijatva Drive.\n`, folderId)
        }
      />

      <PromptSheet
        visible={renameTarget !== null}
        title="Rename"
        initialValue={renameTarget?.name ?? ''}
        confirmLabel="Save name"
        onClose={() => setRenameTarget(null)}
        onSubmit={(name) => {
          if (renameTarget) rename(renameTarget.id, name);
        }}
      />

      <FolderPickerSheet
        visible={moveTarget !== null}
        excludeIds={moveTarget ? [moveTarget.id] : []}
        onClose={() => setMoveTarget(null)}
        onSelect={(target) => {
          if (moveTarget) move(moveTarget.id, target);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  crumbs: { alignItems: 'center', gap: 4, paddingBottom: 14 },
  crumb: { fontSize: 12.5, fontWeight: '600' },
  chips: { paddingBottom: 14, paddingRight: 20 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  count: { fontSize: 12.5, fontWeight: '600' },
  toggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  recentCard: {
    width: 148,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  recentDot: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  recentName: { fontSize: 12.5, fontWeight: '600' },
  recentMeta: { fontSize: 10.5, marginTop: 3, fontWeight: '500' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
