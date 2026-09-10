import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { storyForgeApiPlugin } from './server/api-plugin';

export default defineConfig({
  plugins: [react(), storyForgeApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
