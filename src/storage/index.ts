import { Directory, File, Paths } from 'expo-file-system';
import type { DriveMeta, DriveNode, DriveState } from '../types';

const VAULT_DIR_NAME = 'nijatva-vault';
const INDEX_FILE = 'index.json';
const BLOBS_DIR = 'blobs';

export const DEFAULT_QUOTA = 15 * 1024 * 1024 * 1024; // 15 GB plan

const defaultMeta: DriveMeta = {
  version: 2,
  quotaBytes: DEFAULT_QUOTA,
  passcode: null,
  onboarded: false,
  themeMode: 'system',
  apiUrl: null,
  defaultHomeTab: 'files',
  photoBackup: false,
  telemetry: false,
  crashReports: false,
};

export function vaultDirectory(): Directory {
  return new Directory(Paths.document, VAULT_DIR_NAME);
}

function blobsDirectory(): Directory {
  return new Directory(vaultDirectory(), BLOBS_DIR);
}

export function ensureVault(): void {
  const vault = vaultDirectory();
  if (!vault.exists) vault.create({ intermediates: true, idempotent: true });
  const blobs = blobsDirectory();
  if (!blobs.exists) blobs.create({ intermediates: true, idempotent: true });
}

function indexFile(): File {
  return new File(vaultDirectory(), INDEX_FILE);
}

export function newId(prefix = 'n'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadState(): Promise<DriveState> {
  ensureVault();
  const file = indexFile();
  if (file.exists) {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as Partial<DriveState>;
      if (parsed && Array.isArray(parsed.nodes)) {
        return {
          nodes: parsed.nodes.map(normalizeNode),
          meta: { ...defaultMeta, ...(parsed.meta ?? {}) },
        };
      }
    } catch {
      // fall through to a fresh vault if the index is unreadable
    }
  }
  const seeded = await seedVault();
  await saveState(seeded);
  return seeded;
}

function normalizeNode(node: DriveNode): DriveNode {
  return {
    ...node,
    starred: Boolean(node.starred),
    offline: Boolean(node.offline),
    trashedAt: node.trashedAt ?? null,
    share: node.share ?? null,
    localUri: node.localUri ?? null,
    size: Number.isFinite(node.size) ? node.size : 0,
  };
}

export async function saveState(state: DriveState): Promise<void> {
  ensureVault();
  await indexFile().write(JSON.stringify(state));
}

export async function copyIntoVault(sourceUri: string, fileName: string): Promise<{ uri: string; size: number }> {
  ensureVault();
  const safeName = fileName.replace(/[^\w.\- ]+/g, '_');
  const destination = new File(blobsDirectory(), `${newId('b')}-${safeName}`);
  const source = new File(sourceUri);
  await source.copy(destination);
  return { uri: destination.uri, size: destination.exists ? destination.size : 0 };
}

export async function writeTextIntoVault(content: string, fileName: string): Promise<{ uri: string; size: number }> {
  ensureVault();
  const safeName = fileName.replace(/[^\w.\- ]+/g, '_');
  const destination = new File(blobsDirectory(), `${newId('b')}-${safeName}`);
  await destination.write(content);
  return { uri: destination.uri, size: destination.exists ? destination.size : 0 };
}

export function removeBlob(uri: string | null): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // a missing blob is not an error for the UI
  }
}

export async function readTextBlob(uri: string): Promise<string> {
  const file = new File(uri);
  if (!file.exists) return '';
  return file.text();
}

export function blobExists(uri: string | null): boolean {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export function vaultFootprint(): { files: number; bytes: number } {
  ensureVault();
  const blobs = blobsDirectory();
  let bytes = 0;
  let files = 0;
  for (const entry of blobs.list()) {
    if (entry instanceof File) {
      files += 1;
      bytes += entry.size;
    }
  }
  return { files, bytes };
}

async function seedVault(): Promise<DriveState> {
  const now = Date.now();
  const design: DriveNode = folder('Design', null, now - 1000 * 60 * 60 * 26);
  const documents: DriveNode = folder('Documents', null, now - 1000 * 60 * 60 * 51);
  const media: DriveNode = folder('Media', null, now - 1000 * 60 * 60 * 90);

  const readme = await makeSeedFile(
    'Vault notes.md',
    '# Nijatva Drive\n\nThis vault lives on your device. Everything here is a local file you can move, rename or delete.\n\n- Soft deletes go to Trash for 30 days\n- Share links are generated locally as a demo\n- Nothing leaves the device unless you point the app at the API stub in Settings\n',
    'text/markdown',
    null,
    now - 1000 * 60 * 42,
  );
  const roadmap = await makeSeedFile(
    'Roadmap.txt',
    'Q1  folder sharing\nQ2  offline pinning\nQ3  end-to-end encrypted sync\n',
    'text/plain',
    documents.id,
    now - 1000 * 60 * 60 * 30,
  );
  const palette = await makeSeedFile(
    'Brand palette.json',
    JSON.stringify({ ink: '#0B1412', teal: '#0E7C66', mint: '#19C08A', amber: '#FFB020' }, null, 2),
    'application/json',
    design.id,
    now - 1000 * 60 * 60 * 12,
  );

  const nodes: DriveNode[] = [
    { ...design, starred: true },
    documents,
    media,
    readme,
    { ...roadmap, starred: true },
    palette,
  ];

  return { nodes, meta: defaultMeta };
}

function folder(name: string, parentId: string | null, createdAt: number): DriveNode {
  return {
    id: newId('f'),
    name,
    kind: 'folder',
    parentId,
    size: 0,
    mimeType: 'application/vnd.nijatva.folder',
    localUri: null,
    createdAt,
    updatedAt: createdAt,
    starred: false,
    offline: false,
    trashedAt: null,
    share: null,
  };
}

async function makeSeedFile(
  name: string,
  content: string,
  mimeType: string,
  parentId: string | null,
  createdAt: number,
): Promise<DriveNode> {
  let uri: string | null = null;
  let size = content.length;
  try {
    const stored = await writeTextIntoVault(content, name);
    uri = stored.uri;
    size = stored.size;
  } catch {
    // seeding is best effort
  }
  return {
    id: newId('d'),
    name,
    kind: 'file',
    parentId,
    size,
    mimeType,
    localUri: uri,
    createdAt,
    updatedAt: createdAt,
    starred: false,
    offline: false,
    trashedAt: null,
    share: null,
  };
}

export function pruneOrphanBlobs(validUris: string[]): { removed: number; bytes: number } {
  ensureVault();
  const valid = new Set(validUris);
  let removed = 0;
  let bytes = 0;
  for (const entry of blobsDirectory().list()) {
    if (entry instanceof File && !valid.has(entry.uri)) {
      bytes += entry.size;
      try {
        entry.delete();
        removed += 1;
      } catch {
        // leave it for the next sweep
      }
    }
  }
  return { removed, bytes };
}

export { folder as makeFolderNode };
