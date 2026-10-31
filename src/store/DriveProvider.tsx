import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from '../theme';
import type {
  DriveMeta,
  DriveNode,
  DriveState,
  HomeTab,
  ThemeMode,
  UploadAsset,
  ZohoSession,
  ZohoStatus,
} from '../types';
import {
  loadSession as loadZohoSession,
  refreshSession as refreshZohoSession,
  signIn as zohoSignIn,
  signOut as zohoSignOut,
  zohoConfigured,
} from '../auth/zoho';
import {
  copyIntoVault,
  loadState,
  makeFolderNode,
  newId,
  pruneOrphanBlobs,
  removeBlob,
  saveState,
  writeTextIntoVault,
} from '../storage';
import { categoryOf, guessMime } from '../utils/format';

export interface DriveStats {
  used: number;
  quota: number;
  files: number;
  folders: number;
  trashed: number;
  shared: number;
  byCategory: Record<string, number>;
}

export interface UploadProgressState {
  total: number;
  done: number;
  current: string;
}

export interface DriveApi {
  ready: boolean;
  nodes: DriveNode[];
  meta: DriveMeta;
  theme: Theme;
  locked: boolean;
  lock: () => void;
  unlock: () => void;
  zoho: { status: ZohoStatus; session: ZohoSession | null };
  connectZoho: () => Promise<void>;
  disconnectZoho: () => Promise<void>;
  refreshZoho: () => Promise<void>;
  uploading: UploadProgressState | null;
  toast: string | null;
  notify: (message: string) => void;
  dismissToast: () => void;
  childrenOf: (parentId: string | null) => DriveNode[];
  nodeById: (id: string | null) => DriveNode | undefined;
  pathTo: (folderId: string | null) => DriveNode[];
  stats: DriveStats;
  trashedNodes: () => DriveNode[];
  sharedNodes: () => DriveNode[];
  starredNodes: () => DriveNode[];
  offlineNodes: () => DriveNode[];
  toggleOffline: (id: string) => Promise<void>;
  setDefaultHomeTab: (tab: HomeTab) => Promise<void>;
  setPhotoBackup: (value: boolean) => Promise<void>;
  setTelemetry: (value: boolean) => Promise<void>;
  setCrashReports: (value: boolean) => Promise<void>;
  clearCache: () => Promise<{ removed: number; bytes: number }>;
  recentNodes: (limit?: number) => DriveNode[];
  search: (query: string) => DriveNode[];
  createFolder: (name: string, parentId: string | null) => Promise<void>;
  createNote: (name: string, content: string, parentId: string | null) => Promise<void>;
  upload: (assets: UploadAsset[], parentId: string | null) => Promise<number>;
  rename: (id: string, name: string) => Promise<void>;
  move: (id: string, targetParentId: string | null) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  trash: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  destroy: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  share: (id: string) => Promise<string>;
  revokeShare: (id: string) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setPasscode: (code: string | null) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setApiUrl: (url: string | null) => Promise<void>;
}

const DriveContext = createContext<DriveApi | null>(null);

const EMPTY_STATE: DriveState = {
  nodes: [],
  meta: {
    version: 1,
    quotaBytes: 15 * 1024 * 1024 * 1024,
    passcode: null,
    onboarded: false,
    themeMode: 'system',
    apiUrl: null,
    defaultHomeTab: 'files',
    photoBackup: false,
    telemetry: false,
    crashReports: false,
  },
};

export function DriveProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [state, setState] = useState<DriveState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [zohoSession, setZohoSession] = useState<ZohoSession | null>(null);
  const [zohoStatus, setZohoStatus] = useState<ZohoStatus>(
    zohoConfigured ? 'disconnected' : 'unconfigured',
  );
  const [uploading, setUploading] = useState<UploadProgressState | null>(null);
  const stateRef = useRef<DriveState>(EMPTY_STATE);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    loadState()
      .then((loaded) => {
        if (!mounted) return;
        stateRef.current = loaded;
        setState(loaded);
        setLocked(loaded.meta.passcode !== null);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const commit = useCallback(async (updater: (prev: DriveState) => DriveState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
    await saveState(next);
  }, []);

  useEffect(() => {
    if (!zohoConfigured) return;
    let mounted = true;
    loadZohoSession()
      .then((session) => {
        if (!mounted || !session) return;
        setZohoSession(session);
        setZohoStatus('connected');
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);
  const lock = useCallback(() => setLocked(true), []);
  const unlock = useCallback(() => setLocked(false), []);

  const connectZoho = useCallback(async () => {
    setZohoStatus('connecting');
    try {
      const session = await zohoSignIn();
      setZohoSession(session);
      setZohoStatus('connected');
      notify(`Signed in as ${session.profile.email || 'your Zoho account'}`);
    } catch (error) {
      setZohoStatus(zohoSession ? 'connected' : 'disconnected');
      notify(error instanceof Error ? error.message : 'Zoho sign-in failed');
    }
  }, [notify, zohoSession]);

  const disconnectZoho = useCallback(async () => {
    await zohoSignOut(zohoSession);
    setZohoSession(null);
    setZohoStatus(zohoConfigured ? 'disconnected' : 'unconfigured');
    notify('Zoho account disconnected');
  }, [zohoSession, notify]);

  const refreshZoho = useCallback(async () => {
    if (!zohoSession) return;
    try {
      const next = await refreshZohoSession(zohoSession);
      setZohoSession(next);
      setZohoStatus('connected');
      notify('Zoho session refreshed');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not refresh Zoho session');
    }
  }, [zohoSession, notify]);

  const theme = useMemo<Theme>(() => {
    const mode = state.meta.themeMode;
    const resolved = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
    return resolved === 'dark' ? darkTheme : lightTheme;
  }, [state.meta.themeMode, systemScheme]);

  const childrenOf = useCallback(
    (parentId: string | null) =>
      state.nodes
        .filter((node) => node.parentId === parentId && node.trashedAt === null)
        .sort((a, b) => {
          if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
    [state.nodes],
  );

  const nodeById = useCallback(
    (id: string | null) => (id ? state.nodes.find((node) => node.id === id) : undefined),
    [state.nodes],
  );

  const pathTo = useCallback(
    (folderId: string | null) => {
      const trail: DriveNode[] = [];
      let cursor = folderId;
      let guard = 0;
      while (cursor && guard < 32) {
        const node = state.nodes.find((item) => item.id === cursor);
        if (!node) break;
        trail.unshift(node);
        cursor = node.parentId;
        guard += 1;
      }
      return trail;
    },
    [state.nodes],
  );

  const stats = useMemo<DriveStats>(() => {
    const live = state.nodes.filter((node) => node.trashedAt === null);
    const byCategory: Record<string, number> = {};
    let used = 0;
    let files = 0;
    let folders = 0;
    let shared = 0;
    for (const node of live) {
      if (node.share) shared += 1;
      if (node.kind === 'folder') {
        folders += 1;
        continue;
      }
      files += 1;
      used += node.size;
      const category = categoryOf(node);
      byCategory[category] = (byCategory[category] ?? 0) + node.size;
    }
    return {
      used,
      quota: state.meta.quotaBytes,
      files,
      folders,
      trashed: state.nodes.filter((node) => node.trashedAt !== null).length,
      shared,
      byCategory,
    };
  }, [state.nodes, state.meta.quotaBytes]);

  const trashedNodes = useCallback(
    () =>
      state.nodes
        .filter((node) => node.trashedAt !== null)
        .sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0)),
    [state.nodes],
  );

  const sharedNodes = useCallback(
    () =>
      state.nodes
        .filter((node) => node.share !== null && node.trashedAt === null)
        .sort((a, b) => (b.share?.createdAt ?? 0) - (a.share?.createdAt ?? 0)),
    [state.nodes],
  );

  const starredNodes = useCallback(
    () =>
      state.nodes
        .filter((node) => node.starred && node.trashedAt === null)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [state.nodes],
  );

  const offlineNodes = useCallback(
    () =>
      state.nodes
        .filter((node) => node.offline && node.trashedAt === null)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [state.nodes],
  );

  const recentNodes = useCallback(
    (limit = 12) =>
      state.nodes
        .filter((node) => node.kind === 'file' && node.trashedAt === null)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, limit),
    [state.nodes],
  );

  const search = useCallback(
    (query: string) => {
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) return [];
      return state.nodes
        .filter((node) => node.trashedAt === null && node.name.toLowerCase().includes(trimmed))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 40);
    },
    [state.nodes],
  );

  const createFolder = useCallback(
    async (name: string, parentId: string | null) => {
      const clean = name.trim();
      if (!clean) return;
      const now = Date.now();
      const node = { ...makeFolderNode(clean, parentId, now), updatedAt: now };
      await commit((prev) => ({ ...prev, nodes: [node, ...prev.nodes] }));
      notify(`Folder "${clean}" created`);
    },
    [commit, notify],
  );

  const createNote = useCallback(
    async (name: string, content: string, parentId: string | null) => {
      const clean = name.trim().endsWith('.txt') ? name.trim() : `${name.trim()}.txt`;
      const stored = await writeTextIntoVault(content, clean);
      const now = Date.now();
      const node: DriveNode = {
        id: newId('d'),
        name: clean,
        kind: 'file',
        parentId,
        size: stored.size,
        mimeType: 'text/plain',
        localUri: stored.uri,
        createdAt: now,
        updatedAt: now,
        starred: false,
        offline: false,
        trashedAt: null,
        share: null,
      };
      await commit((prev) => ({ ...prev, nodes: [node, ...prev.nodes] }));
      notify('Note saved');
    },
    [commit, notify],
  );

  const upload = useCallback(
    async (assets: UploadAsset[], parentId: string | null) => {
      const created: DriveNode[] = [];
      setUploading({ total: assets.length, done: 0, current: assets[0]?.name ?? '' });
      for (const [index, asset] of assets.entries()) {
        setUploading({ total: assets.length, done: index, current: asset.name });
        const name = asset.name || 'Untitled';
        try {
          const stored = await copyIntoVault(asset.uri, name);
          const now = Date.now();
          created.push({
            id: newId('d'),
            name,
            kind: 'file',
            parentId,
            size: stored.size || asset.size || 0,
            mimeType: asset.mimeType || guessMime(name),
            localUri: stored.uri,
            createdAt: now,
            updatedAt: now,
            starred: false,
            offline: false,
            trashedAt: null,
            share: null,
          });
        } catch {
          notify(`Could not add ${name}`);
        }
      }
      setUploading(null);
      if (created.length > 0) {
        await commit((prev) => ({ ...prev, nodes: [...created, ...prev.nodes] }));
        notify(created.length === 1 ? `Added ${created[0].name}` : `Added ${created.length} items`);
      }
      return created.length;
    },
    [commit, notify],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      const clean = name.trim();
      if (!clean) return;
      await commit((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === id ? { ...node, name: clean, updatedAt: Date.now() } : node,
        ),
      }));
      notify('Renamed');
    },
    [commit, notify],
  );

  const move = useCallback(
    async (id: string, targetParentId: string | null) => {
      const node = stateRef.current.nodes.find((item) => item.id === id);
      if (!node) return;
      if (node.id === targetParentId) return;
      let cursor = targetParentId;
      let guard = 0;
      while (cursor && guard < 32) {
        if (cursor === id) {
          notify('Cannot move a folder into itself');
          return;
        }
        cursor = stateRef.current.nodes.find((item) => item.id === cursor)?.parentId ?? null;
        guard += 1;
      }
      await commit((prev) => ({
        ...prev,
        nodes: prev.nodes.map((item) =>
          item.id === id ? { ...item, parentId: targetParentId, updatedAt: Date.now() } : item,
        ),
      }));
      notify('Moved');
    },
    [commit, notify],
  );

  const toggleStar = useCallback(
    async (id: string) => {
      let starred = false;
      await commit((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) => {
          if (node.id !== id) return node;
          starred = !node.starred;
          return { ...node, starred, updatedAt: Date.now() };
        }),
      }));
      notify(starred ? 'Added to starred' : 'Removed from starred');
    },
    [commit, notify],
  );

  const descendantsOf = (nodes: DriveNode[], rootId: string): string[] => {
    const out: string[] = [];
    const queue = [rootId];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const node of nodes) {
        if (node.parentId === current) {
          out.push(node.id);
          queue.push(node.id);
        }
      }
    }
    return out;
  };

  const trash = useCallback(
    async (id: string) => {
      const now = Date.now();
      await commit((prev) => {
        const affected = new Set([id, ...descendantsOf(prev.nodes, id)]);
        return {
          ...prev,
          nodes: prev.nodes.map((node) =>
            affected.has(node.id) ? { ...node, trashedAt: now, updatedAt: now } : node,
          ),
        };
      });
      notify('Moved to trash');
    },
    [commit, notify],
  );

  const restore = useCallback(
    async (id: string) => {
      await commit((prev) => {
        const affected = new Set([id, ...descendantsOf(prev.nodes, id)]);
        const parentExists = prev.nodes.some(
          (node) =>
            node.id === prev.nodes.find((item) => item.id === id)?.parentId &&
            node.trashedAt === null,
        );
        const rootNode = prev.nodes.find((node) => node.id === id);
        const reparent = rootNode && rootNode.parentId && !parentExists ? null : undefined;
        return {
          ...prev,
          nodes: prev.nodes.map((node) => {
            if (!affected.has(node.id)) return node;
            const cleared = { ...node, trashedAt: null, updatedAt: Date.now() };
            if (reparent !== undefined && node.id === id) return { ...cleared, parentId: reparent };
            return cleared;
          }),
        };
      });
      notify('Restored');
    },
    [commit, notify],
  );

  const destroy = useCallback(
    async (id: string) => {
      const doomed = new Set([id, ...descendantsOf(stateRef.current.nodes, id)]);
      for (const node of stateRef.current.nodes) {
        if (doomed.has(node.id)) removeBlob(node.localUri);
      }
      await commit((prev) => ({ ...prev, nodes: prev.nodes.filter((node) => !doomed.has(node.id)) }));
      notify('Deleted permanently');
    },
    [commit, notify],
  );

  const emptyTrash = useCallback(async () => {
    const doomed = stateRef.current.nodes.filter((node) => node.trashedAt !== null);
    for (const node of doomed) removeBlob(node.localUri);
    await commit((prev) => ({ ...prev, nodes: prev.nodes.filter((node) => node.trashedAt === null) }));
    notify('Trash emptied');
  }, [commit, notify]);

  const share = useCallback(
    async (id: string) => {
      const token = Math.random().toString(36).slice(2, 10);
      const link = `https://nijatva.drive/s/${token}`;
      await commit((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === id
            ? { ...node, share: { link, createdAt: Date.now(), downloads: node.share?.downloads ?? 0 } }
            : node,
        ),
      }));
      return link;
    },
    [commit],
  );

  const revokeShare = useCallback(
    async (id: string) => {
      await commit((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) => (node.id === id ? { ...node, share: null } : node)),
      }));
      notify('Share link revoked');
    },
    [commit, notify],
  );

  const toggleOffline = useCallback(
    async (id: string) => {
      let pinned = false;
      await commit((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) => {
          if (node.id !== id) return node;
          pinned = !node.offline;
          return { ...node, offline: pinned };
        }),
      }));
      notify(pinned ? 'Pinned for offline access' : 'Removed from offline');
    },
    [commit, notify],
  );

  const setDefaultHomeTab = useCallback(
    async (tab: HomeTab) => {
      await commit((prev) => ({ ...prev, meta: { ...prev.meta, defaultHomeTab: tab } }));
    },
    [commit],
  );

  const setPhotoBackup = useCallback(
    async (value: boolean) => {
      await commit((prev) => ({ ...prev, meta: { ...prev.meta, photoBackup: value } }));
    },
    [commit],
  );

  const setTelemetry = useCallback(
    async (value: boolean) => {
      await commit((prev) => ({ ...prev, meta: { ...prev.meta, telemetry: value } }));
    },
    [commit],
  );

  const setCrashReports = useCallback(
    async (value: boolean) => {
      await commit((prev) => ({ ...prev, meta: { ...prev.meta, crashReports: value } }));
    },
    [commit],
  );

  const clearCache = useCallback(async () => {
    const referenced = stateRef.current.nodes
      .map((node) => node.localUri)
      .filter((uri): uri is string => Boolean(uri));
    const result = pruneOrphanBlobs(referenced);
    notify(
      result.removed > 0
        ? `Cleared ${result.removed} orphaned blob${result.removed === 1 ? '' : 's'}`
        : 'Nothing to clear — cache is tidy',
    );
    return result;
  }, [notify]);

  const setThemeMode = useCallback(
    async (mode: ThemeMode) => {
      await commit((prev) => ({ ...prev, meta: { ...prev.meta, themeMode: mode } }));
    },
    [commit],
  );

  const setPasscode = useCallback(
    async (code: string | null) => {
      await commit((prev) => ({ ...prev, meta: { ...prev.meta, passcode: code } }));
      notify(code ? 'App lock enabled' : 'App lock disabled');
    },
    [commit, notify],
  );

  const completeOnboarding = useCallback(async () => {
    await commit((prev) => ({ ...prev, meta: { ...prev.meta, onboarded: true } }));
  }, [commit]);

  const setApiUrl = useCallback(
    async (url: string | null) => {
      await commit((prev) => ({ ...prev, meta: { ...prev.meta, apiUrl: url } }));
    },
    [commit],
  );

  const api = useMemo<DriveApi>(
    () => ({
      ready,
      nodes: state.nodes,
      meta: state.meta,
      theme,
      locked,
      lock,
      unlock,
      zoho: { status: zohoStatus, session: zohoSession },
      connectZoho,
      disconnectZoho,
      refreshZoho,
      uploading,
      toast,
      notify,
      dismissToast,
      childrenOf,
      nodeById,
      pathTo,
      stats,
      trashedNodes,
      sharedNodes,
      starredNodes,
      recentNodes,
      offlineNodes,
      toggleOffline,
      setDefaultHomeTab,
      setPhotoBackup,
      setTelemetry,
      setCrashReports,
      clearCache,
      search,
      createFolder,
      createNote,
      upload,
      rename,
      move,
      toggleStar,
      trash,
      restore,
      destroy,
      emptyTrash,
      share,
      revokeShare,
      setThemeMode,
      setPasscode,
      completeOnboarding,
      setApiUrl,
    }),
    [
      ready,
      state.nodes,
      state.meta,
      theme,
      locked,
      lock,
      unlock,
      zohoStatus,
      zohoSession,
      connectZoho,
      disconnectZoho,
      refreshZoho,
      uploading,
      toast,
      notify,
      dismissToast,
      childrenOf,
      nodeById,
      pathTo,
      stats,
      trashedNodes,
      sharedNodes,
      starredNodes,
      recentNodes,
      offlineNodes,
      toggleOffline,
      setDefaultHomeTab,
      setPhotoBackup,
      setTelemetry,
      setCrashReports,
      clearCache,
      search,
      createFolder,
      createNote,
      upload,
      rename,
      move,
      toggleStar,
      trash,
      restore,
      destroy,
      emptyTrash,
      share,
      revokeShare,
      setThemeMode,
      setPasscode,
      completeOnboarding,
      setApiUrl,
    ],
  );

  return <DriveContext.Provider value={api}>{children}</DriveContext.Provider>;
}

export function useDrive(): DriveApi {
  const context = useContext(DriveContext);
  if (!context) throw new Error('useDrive must be used inside DriveProvider');
  return context;
}
