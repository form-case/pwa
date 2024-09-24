// src/stores/caseNotesStore.ts
import { writable } from 'svelte/store';

interface CaseNote {
  id: number;
  participantId: string;
  text: string;
  date: string;
}

export const caseNotesStore = writable<CaseNote[]>([]);
