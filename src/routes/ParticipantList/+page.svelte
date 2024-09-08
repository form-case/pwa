<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation'; // Navigation in SvelteKit
  let PouchDB;  // Declare PouchDB without importing at the top to avoid SSR issues

  interface Participant {
    _id: string;
    name?: string;
    jsonData: Record<string, any>;
    avatarUrl?: string;
  }

  let participants: Participant[] = [];
  let searchTerm = '';
  let loading = true;
  let db: any;

  // Define the type of row and its doc structure
  interface Row {
    doc: {
      _id: string;
      jsonData: Record<string, any>;
      files?: Array<{ name: string; blob: Blob }>;
    };
  }

  // Function to fetch participants from PouchDB
  const fetchParticipants = async () => {
    try {
      loading = true;
      const allDocs = await db.allDocs({ include_docs: true });

      const participantData = await Promise.all(
        allDocs.rows.map(async (row: any) => {
          const doc = row.doc;

          if (!doc || !doc.jsonData || Object.keys(doc.jsonData).length === 0) {
            return null;
          }

          const jsonDataKey = Object.keys(doc.jsonData)[0];
          const jsonData = doc.jsonData[jsonDataKey];

          let avatarUrl = null;
          const avatarFileName = jsonData?.image?.['#text'];

          if (avatarFileName && Array.isArray(doc.files)) {
            const avatarBlobEntry = doc.files.find((file: any) => file.name === avatarFileName);
            if (avatarBlobEntry && avatarBlobEntry.blob instanceof Blob) {
              avatarUrl = URL.createObjectURL(avatarBlobEntry.blob);
            }
          }

          return { ...doc, jsonData, avatarUrl };
        })
      );

      participants = participantData.filter((p) => p !== null) as Participant[];
    } catch (err) {
      console.error('Error fetching participants from PouchDB:', err);
    } finally {
      loading = false;
    }
  };

  // Load PouchDB and fetch data when the component is mounted
  onMount(async () => {
    if (typeof window !== 'undefined') {
      // Ensure PouchDB is only loaded on the client side
      const { default: PouchDBLib } = await import('pouchdb-browser');
      PouchDB = PouchDBLib;
      db = new PouchDB('enketodb');
      fetchParticipants();
    }
  });

  // Filter participants based on search term
  const filteredParticipants = () => {
    return participants.filter(participant =>
      participant.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Handle participant selection
  const handleSelectParticipant = (participant: Participant) => {
    goto(`/participant/${participant._id}`);
  };

  const handleAddParticipant = () => {
    goto('/formulario');
  };
</script>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    position: fixed;
  }

  .fixedTop {
    width: 100%;
    margin-top: 15px;
    z-index: 100;
    background-color: white;
    padding: 1rem;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .avatarStyle {
    width: 90px;
    height: 90px;
  }

  .cardStyle {
    margin-bottom: 16px;
    border-radius: 12px;
    background-color: #f3f3f3;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 1rem;
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
    <button on:click={handleAddParticipant}>Agregar Participante</button>
  </div>

  <div class="content">
    {#if loading}
      <p>Cargando...</p>
    {:else}
      {#each filteredParticipants() as participant}
        <!-- Replace div with button for accessibility -->
        <button
          class="cardStyle"
          on:click={() => handleSelectParticipant(participant)}
          aria-label="Seleccionar participante"
          type="button"
        >
          <img src={participant.avatarUrl} alt="avatar" class="avatarStyle" />
          <p>{participant.name || 'No disponible'}</p>
        </button>
      {/each}
    {/if}
  </div>
</div>
