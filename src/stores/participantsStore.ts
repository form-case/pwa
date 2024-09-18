// src/stores/participantsStore.ts
import { writable } from 'svelte/store';
import type { Participant } from '../types';

export const participantsStore = writable<Participant[]>([]);
export const filteredParticipantsStore = writable<Participant[]>([]);
export const loadingStore = writable<boolean>(true);
