// src/types.ts
export interface Participant {
    _id: string;
    name?: string;
    jsonData: Record<string, unknown>;
    avatarUrl?: string;
    searchTextTokens: string[];
  }
  
  export interface Field {
    label: string;
    value: unknown;
    hxl: string;
  }
  
  