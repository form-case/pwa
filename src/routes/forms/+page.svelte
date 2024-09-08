<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { enketoIdStore } from '../../stores/enketoStore'; // Para almacenar el enketoId en la tienda global
  import { goto } from '$app/navigation'; // Para la navegación entre páginas

  // Estados
  let formFile: File | null = null;
  let modelFile: File | null = null;
  let formTitle: string | null = null;
  let loadedForms = writable<Array<{ title: string, enketoId: string }>>([]);

  // Leer contenido de archivo
  function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = (event.target as FileReader).result;
        if (result) {
          resolve(result as string);
        } else {
          reject(new Error('Error al leer el archivo.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  // Extraer título del formulario del contenido XML
  function extractFormTitle(xmlContent: string): string | null {
    const titleMatch = xmlContent.match(/id="form-title">([^<]+)</);
    return titleMatch ? titleMatch[1] : null;
  }

  // Almacenar formulario y modelo en IndexedDB
  function storeInIndexedDB(formString: string, modelString: string, enketoId: string) {
    const request = indexedDB.open('enketo', 4);

    request.onupgradeneeded = (event: any) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('surveys')) {
        const store = db.createObjectStore('surveys', { keyPath: 'enketoId' });
        store.createIndex('enketoId', 'enketoId', { unique: true });
      }
    };

    request.onsuccess = (event: any) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction('surveys', 'readwrite');
      const store = transaction.objectStore('surveys');

      const survey = {
        form: formString,
        enketoId: `${enketoId}`,
        model: modelString,
        hash: 'md5:hashcode',
        languageMap: {},
        maxSize: 10000000,
        media: {}
      };
      
      store.put(survey);

      console.log('Formulario y modelo almacenados en IndexedDB:', survey);
      loadedForms.update((forms) => [...forms, { title: formTitle ?? 'Sin título', enketoId }]);
    };

    request.onerror = (event: any) => {
      console.error('Error al abrir IndexedDB:', (event.target as IDBOpenDBRequest).error);
    };
  }

  // Cargar formularios almacenados desde IndexedDB
  function loadFormsFromIndexedDB() {
    const request = indexedDB.open('enketo', 4);

    request.onsuccess = (event: any) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction('surveys', 'readonly');
      const store = transaction.objectStore('surveys');
      const requestAll = store.getAll();

      requestAll.onsuccess = () => {
        const surveys = requestAll.result;
        loadedForms.set(
          surveys.map((survey: any) => ({
            title: extractFormTitle(survey.form) ?? 'Sin título',
            enketoId: survey.enketoId
          }))
        );
      };
    };

    request.onerror = (event: any) => {
      console.error('Error al cargar formularios de IndexedDB:', (event.target as IDBOpenDBRequest).error);
    };
  }

  // Iniciar al montar el componente
  onMount(() => {
    loadFormsFromIndexedDB();
  });

  // Manejo de cambios en los archivos
  function handleFormChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      formFile = target.files[0];
      console.log('Archivo de formulario seleccionado:', formFile.name);
    }
  }

  function handleModelChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      modelFile = target.files[0];
      console.log('Archivo de modelo seleccionado:', modelFile.name);
    }
  }

  // Subir archivos a IndexedDB
  async function handleUpload() {
    if (!formFile || !modelFile) {
      alert('Por favor selecciona ambos archivos');
      return;
    }

    try {
      const [formContent, modelContent] = await Promise.all([
        readFileContent(formFile),
        readFileContent(modelFile)
      ]);

      const cleanFormString = cleanString(formContent);
      const cleanModelString = cleanString(modelContent);

      formTitle = extractFormTitle(cleanFormString);
      const enketoId = formFile.name.split('.')[0];

      storeInIndexedDB(cleanFormString, cleanModelString, enketoId);
    } catch (error) {
      console.error('Error al cargar archivos:', error);
    }
  }

  function cleanString(input: string): string {
    return input.replace(/\\\\/g, '\\').replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  }

  // Función para navegar y actualizar el enketoId en la tienda global
  function handleNavigation(formId: string) {
    enketoIdStore.set(formId); // Almacena el ID en la tienda
    goto('/form'); // Navega a la página de /form
  }
</script>

<style>
  .uploader {
    margin-top: 20px;
  }
  input {
    margin-bottom: 10px;
  }
  .form-list {
    margin-top: 20px;
  }
  .form-list {
    margin-right: 10px;
    padding: 10px;
    background-color: #08c;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }
</style>

<main>
  <div class="uploader">
    <input type="file" accept=".xml" on:change={handleFormChange}>
    <input type="file" accept=".xml" on:change={handleModelChange}>
    <button on:click={handleUpload}>Subir Form y Model a IndexDB</button>
  </div>

  {#if formTitle}
    <p>Formulario cargado: {formTitle}</p>
  {/if}

  <h3>Formularios cargados:</h3>
  <ul>
    {#each $loadedForms as form}
      <li>
        <button class="form-list" on:click={() => {
          enketoIdStore.set(form.enketoId);
          goto('/form');
        }}>
          Ir a {form.title} (ID: {form.enketoId})
        </button>                    
      </li>
    {/each}
  </ul>
</main>
