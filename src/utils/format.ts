import type { DriveNode } from '../types';

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const fixed = value >= 100 || unit === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(fixed)} ${UNITS[unit]}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `Today, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function extensionOf(name: string): string {
  const idx = name.lastIndexOf('.');
  if (idx <= 0 || idx === name.length - 1) return '';
  return name.slice(idx + 1).toLowerCase();
}

export function baseName(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx > 0 ? name.slice(0, idx) : name;
}

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other';

export function categoryOf(node: Pick<DriveNode, 'kind' | 'mimeType' | 'name'>): FileCategory | 'folder' {
  if (node.kind === 'folder') return 'folder';
  const mime = (node.mimeType || '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'document';
  if (mime.includes('zip') || mime.includes('tar') || mime.includes('compressed')) return 'archive';
  const ext = extensionOf(node.name);
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'm4a', 'flac'].includes(ext)) return 'audio';
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'].includes(ext)) return 'document';
  if (['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return 'archive';
  if (['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'go', 'rs', 'java', 'kt', 'swift', 'html', 'css', 'sh', 'yml', 'yaml'].includes(ext)) return 'code';
  return 'other';
}

export function guessMime(name: string, fallback = 'application/octet-stream'): string {
  const ext = extensionOf(name);
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
    csv: 'text/csv',
    zip: 'application/zip',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
  };
  return map[ext] ?? fallback;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'N';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function pluralize(count: number, one: string, many?: string): string {
  return count === 1 ? one : many ?? `${one}s`;
}
