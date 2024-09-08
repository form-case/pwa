import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',  // No necesitas fallback si solo manejas rutas estáticas prerenderizadas
    }),
    prerender: {
      entries: ['*'],  // Prerender todas las rutas estáticas
    },
    serviceWorker: {
      register: true  // Para registrar el service worker automáticamente
    }
  },
};

export default config;
