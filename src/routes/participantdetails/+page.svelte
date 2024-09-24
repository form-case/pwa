<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { selectedParticipantStore } from '../../stores/selectedParticipantStore';
  import TextField from '../../utils/TextField.svelte'; 
  import type { Participant, Field } from '../../types';

  let participant: Participant | null = null;
  let avatarUrl: string | null = null;
  let fields: Field[] = [];

  // Suscribirse al store para obtener el participante seleccionado
  const unsubscribe = selectedParticipantStore.subscribe((value) => {
    participant = value;
    avatarUrl = participant?.avatarUrl || null;
  });

  onMount(() => {
    if (!participant) {
      // Redirigir al usuario a la página principal si no hay participante seleccionado
      goto('/ParticipantList');
      return;
    } else {
      // Obtener los campos con HXL
      fields = getFieldsWithHXL(participant.jsonData);
    }
  });

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

  // Función para guardar los cambios
  function handleSave() {
    // Implementa la lógica para guardar los cambios del participante
    console.log('Datos guardados:', fields);
  }
</script>

<div class="participant-details-container">
  <button on:click={() => goto('/ParticipantList')} class="back-button">← Back</button>

  {#if participant}
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
            readonly
          />
        {/each}
      </div>

      <div class="action-buttons">
        <button type="submit" class="save-button">SAVE CASE MEMBER</button>
        <button type="button" class="back-action-button" on:click={() => goto('/ParticipantList')}>BACK</button>
      </div>
    </form>
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

  /* Responsive adjustments */
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
