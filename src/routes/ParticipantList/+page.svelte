<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  let PouchDB;

  interface Participant {
    _id: string;
    name?: string;
    jsonData: Record<string, any>;
    avatarUrl?: string;
  }

  interface Field {
    label: string;
    value: any;
    hxl: string;
  }

  let participants: Participant[] = [];
  let allDocuments: any[] = [];
  let searchTerm = '';
  let loading = true;
  let db: any;

  interface Row {
    doc: {
      _id: string;
      jsonData: Record<string, any>;
      _attachments?: {
        [filename: string]: {
          content_type: string;
          data: Blob;
        };
      };
    };
  }

  const fetchParticipants = async () => {
    try {
      loading = true;
      console.log('Iniciando fetch de participantes desde PouchDB...');

      // Incluir adjuntos en la solicitud y obtenerlos como Blobs
      const allDocs = await db.allDocs({ include_docs: true, attachments: true, binary: true });
      console.log(`Total de documentos obtenidos: ${allDocs.rows.length}`);

      const participantData = await Promise.all(
        allDocs.rows.map(async (row: Row) => {
          const doc = row.doc;
          console.log('Procesando documento:', doc._id);

          if (!doc.jsonData || Object.keys(doc.jsonData).length === 0) {
            console.warn(`Documento ${doc._id} no tiene jsonData o está vacío`);
            return null;
          }

          const jsonDataKey = Object.keys(doc.jsonData)[0];
          const jsonData = doc.jsonData[jsonDataKey];
          console.log('jsonDataKey:', jsonDataKey);
          console.log('jsonData:', jsonData);

          // Buscando nombre del archivo del avatar
          const avatarFileName = jsonData.image?.['#text'];
          console.log('Nombre del archivo de avatar:', avatarFileName);
          let avatarUrl = null;

          if (avatarFileName && doc._attachments && doc._attachments[avatarFileName]) {
            console.log('Buscando el archivo de avatar en los adjuntos...');
            const avatarAttachment = doc._attachments[avatarFileName];

            if (avatarAttachment && avatarAttachment.data instanceof Blob) {
              console.log(`Archivo de avatar encontrado: ${avatarFileName}, creando URL...`);
              avatarUrl = URL.createObjectURL(avatarAttachment.data);
              console.log('URL generada para el avatar:', avatarUrl);
            } else {
              console.warn(`No se encontró un Blob válido para el archivo de avatar: ${avatarFileName}`);
            }
          } else {
            console.warn(`Nombre de archivo de avatar no encontrado o adjuntos no válidos para documento: ${doc._id}`);
          }

          return { ...doc, jsonData, avatarUrl };
        })
      );

      participants = participantData.filter((p): p is Participant => p !== null);
      allDocuments = allDocs.rows.map((row: Row) => row.doc);
      console.log('Participantes procesados:', participants);
    } finally {
      loading = false;
      console.log('Fetch completado.');
    }
  };

  const getFieldsWithHXL = (data: Record<string, any>, fields: Field[] = []): Field[] => {
    for (let key in data) {
      if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
        if ('@_hxl' in data[key] && '#text' in data[key]) {
          fields.push({ label: key, value: data[key]['#text'], hxl: data[key]['@_hxl'] });
        } else {
          getFieldsWithHXL(data[key], fields);
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
      .join('<hr class="divider" />'); // Añadir líneas divisorias entre los campos
  };

  onMount(async () => {
    if (typeof window !== 'undefined') {
      const { default: PouchDBLib } = await import('pouchdb-browser');
      db = new PouchDBLib('enketodb');
      console.log('PouchDB inicializado...');
      await fetchParticipants();
    }
  });

  const filteredParticipants = (): Participant[] => {
    return participants.filter(participant =>
      participant.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSelectParticipant = (participant: Participant) => {
    console.log('Participante seleccionado:', participant._id);
    goto(`/participant/${participant._id}`);
  };

  const handleAddParticipant = () => {
    console.log('Navegando para agregar nuevo participante');
    goto('/form');
  };
</script>

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

<div class="container">
  <div class="fixedTop">
    <input
      type="text"
      bind:value={searchTerm}
      placeholder="Buscar Participante"
      class="searchStyle"
    />
    <button class="add-participant" on:click={handleAddParticipant}>+</button>
  </div>

  <div class="content">
    {#if loading}
      <p>Cargando...</p>
    {:else}
      {#each filteredParticipants() as participant}
        <button
          class="cardStyle"
          on:click={() => handleSelectParticipant(participant)}
          aria-label="Seleccionar participante"
          type="button"
        >
          <img src={participant.avatarUrl || '/default-avatar.png'} alt="avatar" class="avatarStyle" />
          <div>
            {@html renderParticipantFields(participant)}
          </div>
        </button>
      {/each}
    {/if}
  </div>
</div>

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
