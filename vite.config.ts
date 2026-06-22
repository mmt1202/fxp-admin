import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { adminUserProfileMockPlugin } from './src/mocks/adminUserProfilePlugin';

export default defineConfig({
  plugins: [react(), adminUserProfileMockPlugin()],
  server: {
    port: 5173,
  },
});
