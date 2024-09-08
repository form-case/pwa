<script>
	import Header from './Header.svelte';
	import '../app.css';
  
	// Registro del Service Worker
	if ('serviceWorker' in navigator) {
    console.log('Intentando registrar el Service Worker...');
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        console.log('Service Worker registrado correctamente.');
      })
      .catch((error) => {
        console.error('Error al registrar el Service Worker', error);
      });
  	}
  </script>
  
  <svelte:head>
	<!-- Manifiesto y favicon -->
	<link rel="manifest" href="/manifest.json" />
	<link rel="icon" href="/favicon.png" />
	<!-- Aquí puedes incluir más meta tags si es necesario -->
  </svelte:head>
  
  <div class="app">
	<Header />
  
	<main>
	  <slot />
	</main>
  
	<footer>
	  <p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p>
	</footer>
  </div>
  
  <style>
	.app {
	  display: flex;
	  flex-direction: column;
	  min-height: 100vh;
	}
  
	main {
	  flex: 1;
	  display: flex;
	  flex-direction: column;
	  padding: 1rem;
	  width: 100%;
	  max-width: 64rem;
	  margin: 0 auto;
	  box-sizing: border-box;
	}
  
	footer {
	  display: flex;
	  flex-direction: column;
	  justify-content: center;
	  align-items: center;
	  padding: 12px;
	}
  
	footer a {
	  font-weight: bold;
	}
  
	@media (min-width: 480px) {
	  footer {
		padding: 12px 0;
	  }
	}
  </style>
  