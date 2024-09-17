import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		rollupOptions: {
		  plugins: [commonjs()],
		},
	  },
	define: {global: "window"},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
