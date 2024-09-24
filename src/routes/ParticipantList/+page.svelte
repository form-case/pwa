<!-- src\routes\ParticipantList\+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { participantsStore, filteredParticipantsStore, loadingStore } from '../../stores/participantsStore';
  import { selectedParticipantStore } from '../../stores/selectedParticipantStore';
  import type { Participant, Field } from '../../types';
  import { get } from 'svelte/store';
  import { generateAvatarUrl, revokeAllAvatarUrls } from '../../utils/avatar';

  let PouchDB: any;
  let db: any;
  let client = false; // Bandera para saber si estamos en el cliente
  let debounce: any;

  let participants: Participant[] = [];
  participantsStore.subscribe(value => participants = value);

  let filteredParticipants: Participant[] = [];
  filteredParticipantsStore.subscribe(value => filteredParticipants = value);

  let loading: boolean = true;
  loadingStore.subscribe(value => loading = value);

  let searchTerm = '';

  let allDocuments: any[] = [];
  const avatarUrls = new Map<string, string>();




  const fetchParticipants = async () => {
    if (!db) return;

    try {
      loadingStore.set(true);
      console.log('Iniciando fetch de participantes desde PouchDB...');

      const allDocs = await db.allDocs({ include_docs: true, attachments: true, binary: true });
      console.log(`Total de documentos obtenidos: ${allDocs.rows.length}`);

      const participantData = await Promise.all(
        allDocs.rows.map(async (row: any) => {
          const doc = row.doc;

          if (!doc.jsonData || Object.keys(doc.jsonData).length === 0) {
            console.warn(`Documento ${doc._id} no tiene jsonData o está vacío`);
            return null;
          }

          const jsonDataKey = Object.keys(doc.jsonData)[0];
          const jsonData = doc.jsonData[jsonDataKey];

          const searchTextTokens = doc.searchTextTokens || [];

          const avatarUrl = generateAvatarUrl(jsonData, doc._id, doc._attachments, client);

          return { ...doc, jsonData, avatarUrl, searchTextTokens };
        })
      );

      participants = participantData.filter((p): p is Participant => p !== null);
      console.log('Participantes procesados:', participants);

      participantsStore.set(participants);
      filteredParticipantsStore.set(participants);

      allDocuments = allDocs.rows.map((row: any) => row.doc);
    } catch (error) {
      console.error('Error en fetchParticipants:', error);
    } finally {
      loadingStore.set(false);
    }
  };

  const createIndex = async () => {
    if (!db) return;
    try {
      await db.createIndex({
        index: { fields: ['searchTextTokens'] },
      });
      console.log('Índice creado en searchTextTokens.');
    } catch (error) {
      console.error('Error al crear el índice:', error);
    }
  };

  const listIndexes = async () => {
    if (!db) return;
    try {
      const result = await db.getIndexes();
      console.log('Índices existentes:', result.indexes);
    } catch (error) {
      console.error('Error al listar los índices:', error);
    }
  };

  let debouncedSearchParticipants: () => void;

  $: if (client && typeof searchTerm === 'string') {
    if (!debouncedSearchParticipants && debounce) {
      debouncedSearchParticipants = debounce(async () => {
        const results = await searchParticipants();
        filteredParticipantsStore.set(results);
      }, 300);
    }
    debouncedSearchParticipants && debouncedSearchParticipants();
  }

  const searchParticipants = async (): Promise<Participant[]> => {
  if (!db) return [];

  if (!searchTerm.trim()) {
    return participants;
  }

  const lowerCaseTerm = searchTerm.toLowerCase();
  const tokens = lowerCaseTerm.split(',').map(token => token.trim()).filter(token => token);

  const selector = {
    $and: tokens.map((token) => ({
      searchTextTokens: { $elemMatch: { $regex: token } },
    })),
  };

  try {
    // Paso 1: Realizar la búsqueda para obtener los IDs
    const result = await db.find({
      selector,
      fields: ['_id'], // Solo necesitamos los IDs
    });

    const ids: string[] = result.docs.map((doc: any) => doc._id);

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

    const participantData: (Participant | null)[] = allDocsResult.rows.map((row: any) => {
      const doc = row.doc;

      if (!doc || !doc.jsonData || Object.keys(doc.jsonData).length === 0) {
        console.warn(`Documento ${doc?._id} no tiene jsonData o está vacío`);
        return null;
      }

      const jsonDataKey = Object.keys(doc.jsonData)[0];
      const jsonData = doc.jsonData[jsonDataKey];

      const searchTextTokens = doc.searchTextTokens || [];

      console.log(`Procesando documento: ${doc._id}`);
      console.log('Adjuntos:', doc._attachments);

      const avatarUrl = generateAvatarUrl(jsonData, doc._id, doc._attachments, client);

      console.log(`URL del avatar para ${doc._id}:`, avatarUrl);

      return { ...doc, jsonData, avatarUrl, searchTextTokens };
    });

    return participantData.filter((p: Participant | null): p is Participant => p !== null);
  } catch (error) {
    console.error('Error en searchParticipants:', error);
    return [];
  }
};


  onMount(async () => {
    client = true;

    // Importaciones dinámicas dentro de onMount
    const { default: PouchDBLib } = await import('pouchdb-browser');
    const PouchFindModule = await import('pouchdb-find');
    ({ debounce } = await import('lodash-es'));

    const PouchFind = PouchFindModule.default || PouchFindModule;

    // Aplicar el plugin a PouchDB
    PouchDBLib.plugin(PouchFind);

    db = new PouchDBLib('enketodb');
    console.log('PouchDB inicializado...');

    await createIndex();
    await listIndexes();
    await fetchParticipants();
  });

  onDestroy(() => {
  //revokeAllAvatarUrls();
  });


  const getFieldsWithHXL = (data: Record<string, unknown>, fields: Field[] = []): Field[] => {
    for (let key in data) {
      if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
        const field = data[key] as Record<string, unknown>;
        if ('@_hxl' in field && '#text' in field) {
          fields.push({ label: key, value: field['#text'], hxl: field['@_hxl'] as string });
        } else {
          getFieldsWithHXL(field, fields);
        }
      }
    }
    return fields;
  };

  const renderParticipantFields = (participant: Participant): string => {
    let fields = getFieldsWithHXL(participant.jsonData);
    fields = fields
      .filter(field => !isNaN(Number(field.hxl)))
      .sort((a, b) => parseInt(a.hxl) - parseInt(b.hxl))
      .slice(0, 6);

    return fields
      .map(field => `<span class="field"><strong>${field.label}:</strong> ${field.value || 'No disponible'}</span>`)
      .join('<hr class="divider" />');
  };

  const handleSelectParticipant = (participant: Participant) => {
    console.log('Participante seleccionado:', participant._id);
    selectedParticipantStore.set(participant);
    //goto(`/participant/${participant._id}`);
    goto(`/Participant`);
  };

  const handleAddParticipant = () => {
    console.log('Navegando para agregar nuevo participante');
    goto('/form');
  };
</script>


<div class="container">
  <div class="fixedTop">
    <input
      type="text"
      bind:value={searchTerm}
      placeholder="Buscar Participante (separa términos con comas)"
      class="searchStyle"
    />
    <button class="add-participant" on:click={handleAddParticipant}>+</button>
  </div>

  <div class="content">
    {#if loading}
      <p>Cargando...</p>
    {:else}
      {#each filteredParticipants as participant}
        <button
          class="cardStyle"
          on:click={() => handleSelectParticipant(participant)}
          aria-label="Seleccionar participante"
          type="button"
        >
          <img src={participant.avatarUrl || '/default-avatar.png'} alt="avatar" class="avatarStyle" loading="lazy" />
          <div>
            {@html renderParticipantFields(participant)}
          </div>
        </button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: hidden;
    position: relative;
  }

  .fixedTop {
    margin-top: 0px;
    z-index: 100;
    padding: 1rem;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .searchStyle {
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #eee4e4;
    background-color: #fffffffc;
    width: 80%;
  }

  .add-participant {
  background-color: #1976D2;
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  bottom: 20px;
  right: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin-left: 10px;
  z-index: 1000; /* Asegúrate de que esté por encima de otros elementos */
}

.add-participant:hover {
  background-color: #0D47A1;
}


  .avatarStyle {
    width: 99px;
    height: 99px;
    object-fit: cover;
    border-radius: 50%;
    margin-right: 16px;
  }

  .cardStyle {
    margin-bottom: 16px;
    border-radius: 12px;
    background-color: #f3f3f3;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding-left: 1rem;
    display: flex;
    align-items: center;
    border: 1px solid #ddd;
    text-align: left;
    padding: 1rem;
    font-size: smaller;
    background-color: #ffffff8a;
  }

  .all-documents {
    margin-top: 20px;
    padding: 1rem;
    background-color: #fff;
    border: 1px solid #ddd;
  }

  .all-documents h3 {
    margin-bottom: 1rem;
  }

  .all-documents ul {
    list-style: none;
    padding: 0;
    overflow: hidden;
  }

  .all-documents li {
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: #f3f3f3;
    border-radius: 8px;
  }

</style>


<div class="all-documents">
  <h3>Todos los Documentos en PouchDB</h3>
  <ul>
    {#each allDocuments as doc}
      <li>
        <strong>ID:</strong> {doc._id} <br />
        <strong>Datos:</strong> {JSON.stringify(doc)}
      </li>
    {/each}
  </ul>
</div>