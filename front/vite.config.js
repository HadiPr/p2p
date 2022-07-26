import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    https: true,
    proxy: {
      '/socket.io': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
});
