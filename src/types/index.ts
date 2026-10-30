export type ThemeMode = 'light' | 'dark' | 'system';

export type NodeKind = 'folder' | 'file';

export interface ShareInfo {
  link: string;
  createdAt: number;
  downloads: number;
}

export interface DriveNode {
  id: string;
  name: string;
  kind: NodeKind;
  /** null means the node sits at the vault root */
  parentId: string | null;
  size: number;
  mimeType: string;
  /** local blob uri inside the app vault, null for folders */
  localUri: string | null;
  createdAt: number;
  updatedAt: number;
  starred: boolean;
  /** soft delete timestamp, null when live */
  trashedAt: number | null;
  share: ShareInfo | null;
}

export interface DriveMeta {
  version: number;
  quotaBytes: number;
  passcode: string | null;
  onboarded: boolean;
  themeMode: ThemeMode;
  apiUrl: string | null;
}

export interface DriveState {
  nodes: DriveNode[];
  meta: DriveMeta;
}

export type SortKey = 'name' | 'updated' | 'size';
export type ViewMode = 'list' | 'grid';

export interface UploadAsset {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
}
