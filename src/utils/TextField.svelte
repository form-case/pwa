<!-- src/utils/TextField.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
  
    export let label: string = '';
    export let value: string = '';
    export let type: string = 'text';
    export let name: string = '';
    export let readonly: boolean = false;
    export let disabled: boolean = false;
  
    const dispatch = createEventDispatcher();
  
    // Generar un id único para el input
    const inputId = name || `input-${Math.random().toString(36).substr(2, 9)}`;
  
    function handleInput(event: Event) {
      const input = event.target as HTMLInputElement;
      value = input.value;
      dispatch('input', { value: input.value });
    }
  </script>
  
  <div class="text-field-outlined">
    <div class="input-container">
      <input
        id={inputId}
        type={type}
        value={value}
        name={name}
        {readonly}
        {disabled}
        placeholder=" "
        on:input={handleInput}
        class:disabled={disabled}
        required
      />
      <fieldset aria-hidden="true">
        <legend>
          <!-- El texto del label se muestra aquí -->
          <span>{label}&nbsp;</span>
        </legend>
      </fieldset>
      <!-- Asociamos el label con el input y lo ocultamos visualmente -->
      <label for={inputId} class="visually-hidden">{label}</label>
    </div>
  </div>
  
  <style>
    /* Variables de colores */
    :root {
      --primary-color: #0078d4; /* Tu color primario */
      --text-color: rgba(0, 0, 0, 0.87);
      --disabled-color: rgba(0, 0, 0, 0.38);
      --border-color: rgba(0, 0, 0, 0.23);
      --label-color: rgba(0, 0, 0, 0.6);
      --hover-border-color: #2196f3; /* Color primario aclarado al 10% */
      --hover-box-shadow-color: #66b8ff; /* Color primario aclarado al 30% */
    }
  
    .visually-hidden {
      position: absolute;
      clip: rect(1px, 1px, 1px, 1px);
      padding: 0;
      border: 0;
      height: 1px;
      width: 1px;
      overflow: hidden;
      white-space: nowrap;
    }
  
    .text-field-outlined {
      display: inline-flex;
      flex-direction: column;
      position: relative;
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
    }
  
    .input-container {
      position: relative;
      padding-top: 4px;
      font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
    }
  
    input {
      width: 100%;
      padding: 16.5px 14px;
      font-size: 12px;
      color: var(--text-color);
      background-color: transparent;
      border: none;
      border-radius: 4px;
      outline: none;
      box-sizing: border-box;
    }
  
    input::placeholder {
      color: transparent;
    }
  
    input:focus ~ label,
    input:not(:placeholder-shown) ~ label {
      transform: translate(12px, -20px) scale(0.75);
    }
  
    input:hover ~ fieldset,
    input:focus ~ fieldset {
      border-color: var(--hover-border-color);
      border-width: 0.5px;
    }
  
    input:focus ~ fieldset {
      border-width: 0.5px;
    }
  
    input:disabled {
      color: var(--disabled-color);
    }
  
    input:disabled ~ label {
      color: var(--disabled-color);
    }
  
    input:disabled ~ fieldset {
      border-color: var(--border-color);
    }
  
    label {
      position: absolute;
      left: 12px;
      top: 18px;
      transform-origin: top left;
      color: var(--label-color); /* Gris claro para el label */
      pointer-events: none;
      transition: transform 0.2s ease-out, color 0.2s ease-out;
      padding: 0 4px;
    }
  
    fieldset {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0;
      padding: 0 8px;
      pointer-events: none;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      transition: border-color 0.2s ease-out, border-width 0.2s ease-out, box-shadow 0.2s ease-out;
      min-width: 0;
    }
  
    legend {
      width: auto;
      height: 11px;
      display: block;
      padding: 0;
      font-size: 0.75em;
      max-width: 0.01px;
      text-align: left;
      transition: max-width 50ms cubic-bezier(0.0, 0, 0.2, 1) 0ms;
      visibility: hidden;
      white-space: nowrap;
      top: -10px;
    }
  
    input:focus ~ fieldset legend,
    input:not(:placeholder-shown) ~ fieldset legend {
      max-width: 1000px;
      transition: max-width 100ms cubic-bezier(0.0, 0, 0.2, 1) 0ms;
      visibility: visible;
    }
  
    fieldset span {
      padding-left: 5px;
      padding-right: 5px;
    }
  </style>
  