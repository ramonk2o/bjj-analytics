import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The app is shared and opened as one file, so the inlined index.html is renamed.
function renameOutput(name: string): Plugin {
  return {
    name: 'rename-output',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const page = bundle['index.html'];
      if (page) page.fileName = name;
    },
  };
}

export default defineConfig({
  plugins: [viteSingleFile(), renameOutput('bjj-analytics.html')],
  test: {
    // Dates are local-time; pin the zone so tests behave the same on every machine.
    env: { TZ: 'America/Sao_Paulo' },
  },
});
