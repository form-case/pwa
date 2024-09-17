// src/stores/hxlStore.ts
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { Field } from '../types'; // Asegúrate de ajustar la ruta según tu estructura de carpetas

export const hxlFieldsStore: Writable<Map<string, Field[]>> = writable(new Map());

