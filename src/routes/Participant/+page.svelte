<!-- src/routes/ParticipantDetails.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { selectedParticipantStore } from '../../stores/selectedParticipantStore';
  import TextField from '../../utils/TextField.svelte';
  import type { Participant, Field } from '../../types';

  let participant: Participant | null = null;
  let avatarUrl: string | null = null;
  let fields: Field[] = [];

  // Variables para las pestañas
  let selectedTab: number = 0;

  // Variables para las notas de caso
  let caseNotes: string = '';
  let caseNotesHistory: Array<{ id: number; text: string; date: string }> = [];

  // ID del participante
  let participantId: string = '';

  let db; // Variable para PouchDB

  // Suscribirse al store del participante seleccionado
  $: participant = $selectedParticipantStore;
  $: participantId = participant?._id || participant?.id || '';
  $: console.log('Participant ID:', participantId);

  onMount(async () => {
    // Importar PouchDB solo en el cliente
    const { default: PouchDB } = await import('pouchdb-browser');
    const PouchFindModule = await import('pouchdb-find');
    const PouchFind = PouchFindModule.default || PouchFindModule;

    // Aplicar el plugin
    PouchDB.plugin(PouchFind);

    // Inicializar la base de datos
    db = new PouchDB('enketodb');

    // Ahora que db está inicializado, podemos obtener los datos del participante
    if (participantId) {
      fetchParticipantData();
    }
  });

  // Observar cambios en participantId y db
  $: if (participantId && db) {
    fetchParticipantData();
  }

  async function fetchParticipantData() {
    if (!participantId || !db) return;
    try {
      const doc = await db.get(participantId, { attachments: true, binary: true });
      participant = doc;
      avatarUrl = participant.avatarUrl || null;
      fields = getFieldsWithHXL(participant.jsonData);
      caseNotesHistory = participant.caseNotes || [];
    } catch (err) {
      console.error('Error fetching participant data:', err);
      participant = null;
      fields = [];
      caseNotesHistory = [];
    }
  }

  // Función para obtener campos con HXL
  const getFieldsWithHXL = (data: Record<string, unknown>, fields: Field[] = []): Field[] => {
    for (let key in data) {
      if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
        const field = data[key] as Record<string, unknown>;
        if ('@_hxl' in field && '#text' in field) {
          fields.push({
            label: key,
            value: field['#text'] as string,
            hxl: field['@_hxl'] as string,
          });
        } else {
          getFieldsWithHXL(field, fields);
        }
      }
    }
    return fields;
  };

  // Función para manejar el cambio de los campos
  function handleInput(event: CustomEvent<{ value: string }>, field: Field) {
    field.value = event.detail.value;
  }

  // Función para cambiar de pestaña
  function handleTabChange(index: number) {
    selectedTab = index;
  }

  // Función para guardar una nueva nota de caso
  async function handleSaveCaseNote() {
    if (caseNotes.trim() && db) {
      const newNote = {
        id: Date.now(),
        text: caseNotes,
        date: new Date().toISOString(),
      };
      try {
        // Obtener el documento actual del participante
        const doc = await db.get(participantId);
        // Asegurar que caseNotes es un array
        doc.caseNotes = doc.caseNotes || [];
        // Añadir la nueva nota al inicio del array
        doc.caseNotes.unshift(newNote);
        // Guardar el documento actualizado
        await db.put(doc);
        // Actualizar el historial local de notas de caso
        caseNotesHistory = doc.caseNotes;
        // Limpiar el campo de entrada
        caseNotes = '';
      } catch (err) {
        console.error('Error saving case note:', err);
      }
    }
  }

  // Función para eliminar una nota de caso
  async function handleDeleteCaseNote(noteId: number) {
    if (db) {
      try {
        // Obtener el documento actual del participante
        const doc = await db.get(participantId);
        // Filtrar la nota a eliminar
        doc.caseNotes = doc.caseNotes.filter(note => note.id !== noteId);
        // Guardar el documento actualizado
        await db.put(doc);
        // Actualizar el historial local de notas de caso
        caseNotesHistory = doc.caseNotes;
      } catch (err) {
        console.error('Error deleting case note:', err);
      }
    }
  }

  // Función para guardar los cambios del participante
  async function handleSave() {
    if (db) {
      try {
        // Actualizar los campos del participante con los nuevos valores
        updateParticipantFields(participant.jsonData, fields);
        // Guardar el participante actualizado en PouchDB
        await db.put(participant);
        console.log('Datos del participante guardados exitosamente.');
      } catch (err) {
        console.error('Error saving participant data:', err);
      }
    }
  }

  // Funciones auxiliares para actualizar los campos
  function updateParticipantFields(data: Record<string, unknown>, fields: Field[]) {
    for (const field of fields) {
      setFieldValue(data, field.label, field.value);
    }
  }

  function setFieldValue(data: Record<string, unknown>, label: string, value: string) {
    for (let key in data) {
      if (key === label) {
        if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
          const field = data[key] as Record<string, unknown>;
          if ('#text' in field) {
            field['#text'] = value;
          }
        }
      } else if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
        setFieldValue(data[key] as Record<string, unknown>, label, value);
      }
    }
  }
</script>

<div class="participant-details-container">
  <button on:click={() => goto('/ParticipantList')} class="back-button">← Back</button>

  {#if participant}
    <!-- Pestañas -->
    <div class="tabs">
      <button
        class="tab-button {selectedTab === 0 ? 'selected' : ''}"
        on:click={() => handleTabChange(0)}
      >
        Datos Biográficos
      </button>
      <button
        class="tab-button {selectedTab === 1 ? 'selected' : ''}"
        on:click={() => handleTabChange(1)}
      >
        Notas de Caso
      </button>
    </div>

    <!-- Contenido de las pestañas -->
    {#if selectedTab === 0}
      <!-- Pestaña de Datos Biográficos -->
      <form class="participant-form" on:submit|preventDefault={handleSave}>
        <div class="avatar-container">
          <img
            src={avatarUrl || '/default-avatar.png'}
            alt="Avatar de {participant.name}"
            class="avatar"
            loading="lazy"
          />
        </div>

        <div class="form-fields">
          {#each fields as field (field.label)}
            <TextField
              label={field.label}
              name={field.label}
              bind:value={field.value}
              on:input={(event) => handleInput(event, field)}
            />
          {/each}
        </div>

        <div class="action-buttons">
          <button type="submit" class="save-button">GUARDAR</button>
          <button type="button" class="back-action-button" on:click={() => goto('/ParticipantList')}>ATRÁS</button>
        </div>
      </form>
    {:else if selectedTab === 1}
      <!-- Pestaña de Notas de Caso -->
      <div class="case-notes-tab">
        <!-- Formulario para agregar una nueva nota de caso -->
        <textarea
          bind:value={caseNotes}
          placeholder="Añadir una nueva nota de caso..."
        ></textarea>
        <button on:click={handleSaveCaseNote}>Guardar Nota de Caso</button>

        <!-- Historial de notas de caso -->
        <h3>Historial de Notas de Caso</h3>
        {#if caseNotesHistory.length > 0}
          {#each caseNotesHistory as note (note.id)}
            <div class="case-note">
              <button class="delete-button" on:click={() => handleDeleteCaseNote(note.id)}>
                🗑️ <!-- Reemplaza con tu icono de eliminar si lo tienes -->
              </button>
              <p class="case-note-date">{new Date(note.date).toLocaleString()}</p>
              <p class="case-note-text">{note.text}</p>
            </div>
          {/each}
        {:else}
          <p>No hay notas de caso disponibles.</p>
        {/if}
      </div>
    {/if}

  {:else}
    <p class="not-found">Participante no encontrado.</p>
  {/if}
</div>

<style>
  .participant-details-container {
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .avatar-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
  }

  .tabs {
    display: flex;
    margin-bottom: 1rem;
  }

  .tab-button {
    flex: 1;
    padding: 0.5rem;
    background-color: #f0f0f0;
    border: none;
    cursor: pointer;
  }

  .tab-button.selected {
    background-color: #ccc;
  }

  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .action-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
  }

  .save-button, .back-action-button {
    padding: 0.75rem 1.5rem;
  }

  .not-found {
    text-align: center;
    color: #888888;
    font-size: 1.1rem;
  }

  /* Estilos para las notas de caso */
  .case-notes-tab {
    margin-top: 1rem;
  }

  .case-notes-tab textarea {
    width: 100%;
    min-height: 100px;
    margin-bottom: 8px;
    padding: 8px;
    font-size: 1rem;
  }

  .case-notes-tab button {
    padding: 8px 16px;
    font-size: 1rem;
    margin-bottom: 16px;
  }

  .case-note {
    position: relative;
    margin-bottom: 16px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }

  .case-note-date {
    font-size: 0.9rem;
    color: #666;
  }

  .case-note-text {
    margin-top: 8px;
    font-size: 1rem;
  }

  .delete-button {
    position: absolute;
    right: 8px;
    top: 8px;
    background: none;
    border: none;
    cursor: pointer;
  }

  .delete-button:hover {
    color: red;
  }

  /* Ajustes responsivos */
  @media (max-width: 400px) {
    .avatar {
      width: 80px;
      height: 80px;
    }

    .save-button, .back-action-button {
      font-size: 0.9rem;
      padding: 0.6rem;
    }
  }
</style>

