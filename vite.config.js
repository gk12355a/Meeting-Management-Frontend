import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // 👈 thêm dòng này — rất quan trọng khi deploy qua Nginx
  server: {
    host: '0.0.0.0', // Cho phép truy cập từ ngoài VM
    port: 5173,
    strictPort: true,
    cors: true,
  },
})
