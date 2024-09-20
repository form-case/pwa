// src/utils/avatar.ts

import type { Attachment } from '../types';

/**
 * Mapa para almacenar las URLs de los avatares, evitando crearlas múltiples veces.
 */
const avatarUrls = new Map<string, string>();

/**
 * Genera y obtiene la URL del avatar para un participante específico.
 * @param jsonData Datos JSON del participante.
 * @param docId ID del documento del participante.
 * @param attachments Adjuntos del documento.
 * @param isClient Indica si el código se está ejecutando en el cliente.
 * @returns La URL del avatar o null si no se puede generar.
 */
export function generateAvatarUrl(
  jsonData: Record<string, unknown>,
  docId: string,
  attachments?: Record<string, Attachment>,
  isClient: boolean = true
): string | null {
  if (!isClient) return null;

  const avatarFileName = (jsonData.image as Record<string, string> | undefined)?.['#text'];
  if (avatarFileName && attachments && attachments[avatarFileName]) {
    const avatarAttachment = attachments[avatarFileName];
    const blob = avatarAttachment.data;

    if (blob instanceof Blob) {
      // Verifica si ya existe una URL para este avatar
      if (avatarUrls.has(docId)) {
        return avatarUrls.get(docId)!;
      }

      const url = URL.createObjectURL(blob);
      avatarUrls.set(docId, url);
      return url;
    }
  }
  return null;
}

/**
 * Revoca todas las URLs de avatares creadas y limpia el mapa.
 */
export function revokeAllAvatarUrls(): void {
  avatarUrls.forEach((url) => URL.revokeObjectURL(url));
  avatarUrls.clear();
}
