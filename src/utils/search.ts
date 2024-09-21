import PouchDB from 'pouchdb-browser';
import PouchFind from 'pouchdb-find';
import type { Participant } from '../types';
import { generateAvatarUrl } from './avatar';

// Aplicar el plugin PouchDB Find
PouchDB.plugin(PouchFind);

// Definir el tipo de base de datos con la interfaz Participant
type DB = PouchDB.Database<Participant>;

/**
 * Define la interfaz si no está disponible en @types/pouchdb
 */
interface AllDocsResponseRow<T> {
  id: string;
  key: string;
  value: {
    rev: string;
    deleted?: boolean;
  };
  doc?: T;
  error?: string;
}

// Tipo para una fila individual
type AllDocsRow = AllDocsResponseRow<Participant>;

/**
 * Verifica si un objeto es un Record<string, unknown>.
 *
 * @param data - El dato a verificar.
 * @returns `true` si `data` es un Record<string, unknown> y no es un array, de lo contrario, `false`.
 */
export const isRecordStringUnknown = (data: unknown): data is Record<string, unknown> => {
  return data !== null && typeof data === 'object' && !Array.isArray(data);
};

/**
 * Verifica si una fila de AllDocsResponseRow contiene un documento y no tiene error.
 *
 * @param row - La fila a verificar.
 * @returns `true` si la fila tiene un documento y no tiene error, de lo contrario, `false`.
 */
const isDocRow = (row: AllDocsRow): row is AllDocsRow & { doc: Participant } => {
  return !('error' in row) && row.doc !== undefined;
};

/**
 * Realiza una búsqueda de participantes en la base de datos PouchDB.
 *
 * @param db - Instancia de PouchDB.
 * @param searchTerm - Término de búsqueda ingresado por el usuario.
 * @param client - Bandera para determinar si está en el cliente.
 * @returns Una promesa que resuelve a un arreglo de participantes que coinciden con la búsqueda.
 */
export const searchParticipants = async (
  db: DB,
  searchTerm: string,
  client: boolean
): Promise<Participant[]> => {
  if (!db) return [];

  if (!searchTerm.trim()) {
    // Si no hay término de búsqueda, devuelve todos los participantes
    const allDocs = await db.allDocs({
      include_docs: true,
      attachments: true,
      binary: true
    });

    const participantData = allDocs.rows.map((row) => {
      const doc = row.doc;

      if (!doc || !doc.jsonData || Object.keys(doc.jsonData).length === 0) {
        console.warn(`Documento ${doc?._id} no tiene jsonData o está vacío`);
        return null;
      }

      const jsonDataKey = Object.keys(doc.jsonData)[0];
      const jsonData = doc.jsonData[jsonDataKey];

      // Usar type guard
      if (!isRecordStringUnknown(jsonData)) {
        console.warn(`jsonData en el documento ${doc._id} no es un Record<string, unknown>`);
        return null;
      }

      const searchTextTokens = doc.searchTextTokens || [];

      const avatarUrl = generateAvatarUrl(jsonData, doc._id, doc._attachments, client);

      return { ...doc, jsonData, avatarUrl, searchTextTokens } as Participant;
    });

    return participantData.filter((p): p is Participant => p !== null);
  }

  const lowerCaseTerm = searchTerm.toLowerCase();
  const tokens = lowerCaseTerm.split(',').map(token => token.trim()).filter(token => token);

  const selector: PouchDB.Find.Selector = {
    $and: tokens.map((token) => ({
      searchTextTokens: { $elemMatch: { $regex: token } },
    })),
  };

  try {
    // Paso 1: Realizar la búsqueda para obtener los IDs
    const result: PouchDB.Find.FindResponse<Pick<Participant, '_id'>> = await db.find({
      selector,
      fields: ['_id'], // Solo necesitamos los IDs
    });

    const ids: string[] = result.docs.map((doc) => doc._id);

    if (ids.length === 0) {
      return [];
    }

    // Paso 2: Recuperar los documentos completos con adjuntos usando allDocs
    const allDocsResult = await db.allDocs({
      include_docs: true,
      attachments: true,
      binary: true,
      keys: ids,
    });

    console.log('Resultados de búsqueda con adjuntos:', allDocsResult.rows);

    // Filtrar filas sin error y que tengan documentos
    const validRows = allDocsResult.rows.filter(isDocRow);

    const participantData: (Participant | null)[] = validRows.map((row) => {
      const doc = row.doc;

      if (!doc || !doc.jsonData || Object.keys(doc.jsonData).length === 0) {
        console.warn(`Documento ${doc?._id} no tiene jsonData o está vacío`);
        return null;
      }

      const jsonDataKey = Object.keys(doc.jsonData)[0];
      const jsonData = doc.jsonData[jsonDataKey];

      // Usar type guard
      if (!isRecordStringUnknown(jsonData)) {
        console.warn(`jsonData en el documento ${doc._id} no es un Record<string, unknown>`);
        return null;
      }

      const searchTextTokens = doc.searchTextTokens || [];

      console.log(`Procesando documento: ${doc._id}`);
      console.log('Adjuntos:', doc._attachments);

      const avatarUrl = generateAvatarUrl(jsonData, doc._id, doc._attachments, client);

      console.log(`URL del avatar para ${doc._id}:`, avatarUrl);

      return { ...doc, jsonData, avatarUrl, searchTextTokens } as Participant;
    });

    return participantData.filter((p): p is Participant => p !== null);
  } catch (error) {
    console.error('Error en searchParticipants:', error);
    return [];
  }
};
