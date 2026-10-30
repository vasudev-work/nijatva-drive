import { Ionicons } from '@expo/vector-icons';
import { palette, type Theme } from '../theme';
import type { FileCategory } from './format';

export type IconName = keyof typeof Ionicons.glyphMap;

export function iconForCategory(category: FileCategory | 'folder'): IconName {
  switch (category) {
    case 'folder':
      return 'folder';
    case 'image':
      return 'image';
    case 'video':
      return 'videocam';
    case 'audio':
      return 'musical-notes';
    case 'document':
      return 'document-text';
    case 'archive':
      return 'archive';
    case 'code':
      return 'code-slash';
    default:
      return 'document';
  }
}

export function tintForCategory(category: FileCategory | 'folder', theme: Theme): string {
  if (theme.mode === 'dark') {
    switch (category) {
      case 'folder':
        return '#2A6F5C';
      case 'image':
        return '#4C3F86';
      case 'video':
        return '#7A3B54';
      case 'audio':
        return '#7A5A22';
      case 'document':
        return '#2F5B7A';
      case 'archive':
        return '#6B4A2A';
      case 'code':
        return '#2C5E52';
      default:
        return '#3A4A47';
    }
  }
  switch (category) {
    case 'folder':
      return '#DCF3EA';
    case 'image':
      return '#E8E3FA';
    case 'video':
      return '#FBE3EA';
    case 'audio':
      return '#FBF0DA';
    case 'document':
      return '#E0EDF7';
    case 'archive':
      return '#F4E8DC';
    case 'code':
      return '#E2F2EC';
    default:
      return '#EDF1EF';
  }
}

export function inkForCategory(category: FileCategory | 'folder', theme: Theme): string {
  if (theme.mode === 'dark') {
    switch (category) {
      case 'image':
        return '#C9BEF7';
      case 'video':
        return '#F7BFD1';
      case 'audio':
        return '#F2D79B';
      case 'document':
        return '#A9D2F0';
      case 'archive':
        return '#E3C6A6';
      default:
        return palette.mintSoft;
    }
  }
  switch (category) {
    case 'folder':
      return palette.teal;
    case 'image':
      return palette.violet;
    case 'video':
      return '#C2416B';
    case 'audio':
      return '#A9761C';
    case 'document':
      return '#2F6FA0';
    case 'archive':
      return '#8A5A2B';
    case 'code':
      return '#157A63';
    default:
      return '#5B6B66';
  }
}
