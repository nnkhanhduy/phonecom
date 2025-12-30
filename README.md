# PhoneCom - E-commerce MVP

PhoneCom là một hệ thống quản lý cửa hàng điện thoại (Minimum Viable Product) hiện đại, tích hợp Trợ lý AI thông minh để nâng cao trải nghiệm mua sắm. Hệ thống bao gồm đầy đủ tính năng từ phía khách hàng (duyệt sản phẩm, giỏ hàng, đặt hàng) đến phía quản lý (tồn kho, đơn hàng, nhân viên).

## Tính năng nổi bật

- **AI Shopping Assistant**: Tích hợp Google Gemini AI để tư vấn sản phẩm, so sánh thông số kĩ thuật và trả lời thắc mắc của khách hàng dựa trên dữ liệu thực tế của cửa hàng.
- **Trải nghiệm mua sắm mượt mà**: Giỏ hàng realtime, quy trình thanh toán nhanh chóng.
- **Quản lý toàn diện**: Dashboard dành cho Admin và Staff để theo dõi doanh thu, quản lý tồn kho và trạng thái đơn hàng.
- **Bảo mật & Phân quyền**: Hệ thống đăng nhập, đăng ký với phân quyền Admin/Staff/Customer rõ ràng.

## Công nghệ sử dụng

- **Frontend**: React 19, Vite, Tailwind CSS (đối với một số thành phần), Lucide React.
- **Backend**: Node.js (Express), cấu trúc theo mô hình MVC.
- **Database**: PostgreSQL với Prisma ORM.
- **AI Service**: Google Generative AI (Gemini Flash).
- **Lập trình**: TypeScript (Full-stack).

## Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
- **Node.js**: v18 trở lên.
- **PostgreSQL**: Đang chạy trên máy local hoặc server.

### 2. Thiết lập Backend
Di chuyển vào thư mục backend và cài đặt:
```bash
cd backend
npm install
```

Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Cập nhật các biến môi trường trong `.env`:
- `DATABASE_URL`: Đường dẫn kết nối PostgreSQL.
- `GEMINI_API_KEY`: API Key từ Google AI Studio.

Khởi tạo Database:
```bash
npm run db:generate  # Tạo Prisma Client
npm run db:push      # Đẩy schema lên DB
npm run db:seed      # Nạp dữ liệu mẫu
```

### 3. Thiết lập Frontend
Quay lại thư mục gốc và cài đặt dependencies:
```bash
cd ..
npm install
```

## 💻 Chạy ứng dụng

Bạn cần chạy đồng thời cả Backend và Frontend:

**Chạy Backend:**
```bash
cd backend
npm run dev
```

**Chạy Frontend:**
```bash
npm run dev
```

Ứng dụng sẽ khả dụng tại: `http://localhost:5173`

## 👥 Tài khoản Demo (Dữ liệu Seed)

| Vai trò | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@demo.com` | (Trống) |
| **Staff** | `staff@demo.com` | (Trống) |
| **Customer** | `oo@demo.com` | (Trống) |

## 📂 Cấu trúc dự án

- `/backend`: 
    - `/src/controllers`: Xử lý logic nghiệp vụ.
    - `/src/routes`: Định nghĩa các API endpoints.
    - `/src/services`: Tích hợp dịch vụ ngoài (AI, Database).
    - `/prisma`: Schema database và seed data.
- `/components`: Các React components được modul hóa.
- `/context`: Quản lý state toàn cục (Giỏ hàng, User).
- `App.tsx`: Routing và quản lý view chính.
- `api.ts`: Cấu hình Axios gọi API backend.

## 🛠️ Công cụ hỗ trợ
Sử dụng Prisma Studio để xem dữ liệu:
```bash
cd backend
npx prisma studio
```

