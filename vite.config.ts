import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // ⚠️ 关键：GitHub Pages 仓库名路径
  base: '/ProjTime/',

  plugins: [react()],

  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});
