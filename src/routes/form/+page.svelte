<script lang="ts">
    import { enketoIdStore } from '../../stores/enketoStore'; // Tienda global para obtener el enketoId
    
    // Usamos la reactividad automática con el prefijo $
    let formId = $enketoIdStore;  // El valor de la tienda será automáticamente reactivo
  </script>
  
  <svelte:head>
    <title>Formulario Dinámico</title>
  </svelte:head>
  
  <main>
    <h2>Formulario Dinámico</h2>
    <p>Formulario con ID: {formId || 'ID no encontrado'}</p>
  
    {#if formId}
      <!-- Cargar el formulario en un iframe utilizando una URL dinámica -->
      <iframe src={`/x/${formId}`} width="100%" height="600px" title="Formulario dinámico"></iframe>
    {:else}
      <p>Error: Formulario no encontrado</p>
    {/if}
  </main>
  
  <style>
    main {
      padding: rem;
    }
    h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    iframe {
      border: none;
    }
  </style>
  