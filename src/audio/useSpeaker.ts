import { useSyncExternalStore } from 'react';
import { speaker } from './speaker';

/** Re-render when voices or the audio manifest finish loading. */
export function useSpeaker() {
  useSyncExternalStore(speaker.subscribe, speaker.getVersion);
  return speaker;
}
