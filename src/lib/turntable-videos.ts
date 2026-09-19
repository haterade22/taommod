import path from 'path';
import turntables from '../data/armour-turntables.json';

export interface ArmourTurntableItem {
  id: string;
  mesh?: string;
}

export function getArmourTurntableMap(): Map<string, string> {
  const videos = new Map<string, string>();
  for (const file of turntables.files) {
    const key = path.basename(file, path.extname(file)).toLowerCase();
    videos.set(key, `${turntables.baseUrl.replace(/\/$/, '')}/${encodeURIComponent(file)}`);
  }

  return videos;
}

export function findArmourTurntable(item: ArmourTurntableItem, videos = getArmourTurntableMap()): string {
  const keys = [item.id, item.mesh].filter(Boolean).map((value) => value!.toLowerCase());
  for (const key of keys) {
    const video = videos.get(key);
    if (video) return video;
  }

  return '';
}
