# AlgoVenture Web Portal

Frontend React cho Admin và Instructor, kết nối Spring Boot API. Xem [hướng dẫn chạy ở thư mục gốc](../README.md).

```sh
npm install
npm run dev
```

Backend phải chạy ở `127.0.0.1:8081`. Vite proxy `/api` tới backend. Khi deploy, dùng reverse proxy cùng origin cho web và `/api`; cấu hình SPA fallback cho các route frontend.

Kiểm tra: `npm test`, `npm run lint`, `npm run build`.
