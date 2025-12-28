# PhoneCom - E-commerce MVP 

Hệ thống quản lý cửa hàng điện thoại (Minimum Viable Product) với đầy đủ tính năng mua hàng, quản lý đơn hàng và tồn kho.

## Công nghệ sử dụng

- **Frontend**: React 19, Vite, Lucide React.
- **Backend**: Node.js (Express), Prisma ORM.
- **Database**: PostgreSQL.
- **Lập trình**: TypeScript.

## Yêu cầu hệ thống

- **Node.js**: v18 trở lên.
- **PostgreSQL**: Đã được cài đặt và đang chạy.

## Hướng dẫn cài đặt

### 1. Clone Project
```bash
git clone https://github.com/nnkhanhduy/phonecom.git
cd phonecom
```

### 2. Cấu hình Backend
Di chuyển vào thư mục backend và cài đặt dependencies:
```bash
cd backend
npm install
```

Tạo file `.env` từ file mẫu:
```bash
cp .env.example .env
```
Mở file `.env` và cập nhật `DATABASE_URL` theo cấu hình PostgreSQL của bạn:
`DATABASE_URL="postgresql://username:password@localhost:5432/phonecom_db?schema=public"`

Khởi tạo Database và dữ liệu mẫu:
```bash
# Tạo client Prisma
npm run db:generate

# Đẩy cấu hình schema lên Database
npm run db:push

# Nạp dữ liệu mẫu (Users, Products, Orders...)
npm run db:seed
```

### 3. Cấu hình Frontend
Quay lại thư mục gốc và cài đặt dependencies:
```bash
cd ..
npm install
```

## Chạy ứng dụng

Bạn cần chạy đồng thời cả Backend và Frontend.

### Chạy Backend
Mở một terminal mới:
```bash
cd backend
npm run dev
```
Server backend sẽ chạy tại: http://localhost:3001 dựa trên cấu hình trong `api.ts`.

### Chạy Frontend
Mở một terminal khác:
```bash
npm run dev
```

## Tài khoản Demo (Dữ liệu Seed)

Sau khi chạy lệnh `npm run db:seed`, bạn có thể sử dụng các tài khoản sau để test:

| Vai trò | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@demo.com` | (Trống) |
| **Staff** | `staff@demo.com` | (Trống) |
| **Customer** | `oo@demo.com` | (Trống) |

## Cấu trúc thư mục chính

- `/backend`: Mã nguồn server, database schema, và seed data.
- `/components`: Các React components (Admin UI, Shop UI).
- `/context`: Quản lý state ứng dụng.
- `/types.ts`: Định nghĩa kiểu dữ liệu TypeScript.
- `api.ts`: Các hàm gọi API kết nối frontend-backend.
- `App.tsx`: File điều hướng chính của ứng dụng.

## Công cụ hỗ trợ
Để xem dữ liệu trực quan trong Database, bạn có thể sử dụng Prisma Studio:
```bash
cd backend
npm run db:studio
```
