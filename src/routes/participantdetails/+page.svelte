<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { selectedParticipantStore } from '../../stores/selectedParticipantStore';
  import type { Participant, Field } from '../../types';
  import { goto } from '$app/navigation';

  // Definiciones específicas para este componente
  interface JsonDataImage {
    '#text': string;
  }

  interface JsonDataWithImage {
    image?: JsonDataImage;
    // Añade otras propiedades según sea necesario
  }

  let participant: Participant | null = null;
  let avatarUrl: string | null = null;

  // Suscribirse al store para obtener el participante seleccionado
  const unsubscribe = selectedParticipantStore.subscribe(value => {
    participant = value;
  });

  // Type Guard para verificar si jsonData tiene una imagen válida
  function isJsonDataWithImage(data: unknown): data is JsonDataWithImage {
    return (
      typeof data === 'object' &&
      data !== null &&
      'image' in data &&
      typeof (data as any).image === 'object' &&
      typeof (data as any).image['#text'] === 'string'
    );
  }

  onMount(() => {
    if (!participant) {
      // Redirigir al usuario a la página principal si no hay participante seleccionado
      goto('/');
      return;
    }

    const jsonDataKey = Object.keys(participant.jsonData)[0];
    const jsonData = participant.jsonData[jsonDataKey];

    if (isJsonDataWithImage(jsonData)) {
      const avatarFileName = jsonData.image?.['#text'];
      if (avatarFileName && participant._attachments && participant._attachments[avatarFileName]) {
        const avatarAttachment = participant._attachments[avatarFileName];
        const blob = avatarAttachment.data;

        if (blob instanceof Blob) {
          avatarUrl = URL.createObjectURL(blob);
        }
      }
    }
  });

  onDestroy(() => {
    if (avatarUrl) {
      URL.revokeObjectURL(avatarUrl);
    }
    unsubscribe();
    // Limpiar el store al salir de la página de detalles
    selectedParticipantStore.set(null);
  });

  // Función para obtener campos con HXL
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
</script>

<div class="participant-details-container">
  <button on:click={() => goto('/')} class="back-button">← Volver</button>

  {#if participant}
    <div class="participant-details">
      <h2>Detalles del Participante</h2>
      <img src={avatarUrl || '/default-avatar.png'} alt="avatar" class="avatarStyle" loading="lazy" />

      {#each getFieldsWithHXL(participant.jsonData) as field (field.label)}
        <span class="field"><strong>{field.label}:</strong> {field.value || 'No disponible'}</span>
        <hr class="divider" />
      {/each}

      <!-- Mostrar todos los datos en una tabla -->
      <div class="all-data">
        <h3>Todos los Datos del Participante</h3>
        <table>
          <thead>
            <tr>
              <th>Propiedad</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {#each Object.entries(participant) as [key, value]}
              <tr>
                <td>{key}</td>
                <td>
                  {#if typeof value === 'object' && value !== null}
                    <pre>{JSON.stringify(value, null, 2)}</pre>
                  {:else}
                    {value}
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <p>Participante no encontrado.</p>
  {/if}
</div>

<style>
  .participant-details-container {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .back-button {
    background: none;
    border: none;
    color: #1976D2;
    font-size: 1rem;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  .participant-details {
    padding: 2rem;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .avatarStyle {
    width: 150px;
    height: 150px;
    object-fit: cover;
    border-radius: 50%;
    margin-bottom: 1rem;
  }

  .field {
    display: block;
    margin-bottom: 0.5rem;
  }

  .divider {
    margin: 0.5rem 0;
    border: none;
    border-top: 1px solid #ddd;
  }

  .all-data {
    margin-top: 2rem;
    padding: 1rem;
    background-color: #f3f3f3;
    border-radius: 8px;
    overflow-x: auto;
  }

  .all-data table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  .all-data th, .all-data td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  .all-data th {
    background-color: #f2f2f2;
  }

  .all-data pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
  }
</style>
