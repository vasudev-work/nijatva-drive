import type { DriveNode } from '../types';

/**
 * Thin client for the optional backend stub in `server/`.
 * The app is fully usable offline; set an API base url in Settings to exercise
 * these calls against `node server/index.js`.
 */
export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface RemoteFile {
  id: string;
  name: string;
  kind: 'file' | 'folder';
  size: number;
  updatedAt: number;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

async function request<T>(baseUrl: string, path: string, init?: RequestInit): Promise<ApiResult<T>> {
  if (!baseUrl) return { ok: false, error: 'No API url configured' };
  try {
    const response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) {
      return { ok: false, error: `Request failed (${response.status})` };
    }
    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

export function ping(baseUrl: string): Promise<ApiResult<{ status: string; service: string; version: string }>> {
  return request(baseUrl, '/health');
}

export function listRemoteFiles(baseUrl: string): Promise<ApiResult<{ files: RemoteFile[] }>> {
  return request(baseUrl, '/api/files');
}

export function pushSnapshot(
  baseUrl: string,
  nodes: DriveNode[],
): Promise<ApiResult<{ accepted: number }>> {
  const files = nodes.map((node) => ({
    id: node.id,
    name: node.name,
    kind: node.kind,
    size: node.size,
    updatedAt: node.updatedAt,
  }));
  return request(baseUrl, '/api/files/sync', {
    method: 'POST',
    body: JSON.stringify({ files }),
  });
}

export function createRemoteFolder(baseUrl: string, name: string): Promise<ApiResult<RemoteFile>> {
  return request(baseUrl, '/api/files', {
    method: 'POST',
    body: JSON.stringify({ name, kind: 'folder' }),
  });
}

export function deleteRemoteFile(baseUrl: string, id: string): Promise<ApiResult<{ deleted: string }>> {
  return request(baseUrl, `/api/files/${id}`, { method: 'DELETE' });
}
