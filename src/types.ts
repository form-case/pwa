// src/types.ts

export interface Attachment {
  content_type: string;
  data: Blob; // Asegúrate de que 'data' sea de tipo Blob
  digest: string;
}

export interface JsonDataImage {
  '#text': string;
}

export interface JsonData {
  image?: JsonDataImage;
  // Añade otras propiedades según sea necesario
}

export interface Participant {
  _id: string;
  _rev?: string;
  name?: string;
  jsonData: JsonData; // Usa la interfaz específica
  _attachments?: Record<string, Attachment>;
  avatarUrl?: string;
  searchTextTokens?: string[];
}

export interface Field {
  label: string;
  value: string | number | null | unknown;
  hxl: string;
}
