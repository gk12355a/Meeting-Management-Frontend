import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{host: '0.0.0.0', // Lắng nghe trên tất cả các địa chỉ IP
    port: 5173, // Chọn cổng muốn sử dụng
    strictPort: true, // Đảm bảo Vite không thay đổi cổng
    cors: true,
    
  }
})
