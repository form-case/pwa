import { writable } from 'svelte/store';

// Tienda global para almacenar el enketoId
export const enketoIdStore = writable<string | null>(null);
