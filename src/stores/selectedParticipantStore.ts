import { writable } from 'svelte/store';
import type { Participant } from '../types';

// Inicialmente, no hay ningún participante seleccionado
export const selectedParticipantStore = writable<Participant | null>(null);

