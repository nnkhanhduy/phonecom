# PhoneCom Backend API

Backend server cho hệ thống E-commerce PhoneCom sử dụng PostgreSQL, Prisma ORM, và Express.js.

## Cấu trúc Database

1. **users** - Thông tin người dùng với vai trò (GUEST, CUSTOMER, STAFF, ADMIN)
2. **addresses** - Địa chỉ giao hàng của người dùng
3. **products** - Thông tin sản phẩm (tên, thương hiệu, mô tả)
4. **variants** - Biến thể sản phẩm (màu sắc, dung lượng, giá, tồn kho)
5. **cart_items** - Giỏ hàng của người dùng
6. **orders** - Đơn hàng với trạng thái (PENDING, CONFIRMED, COMPLETED, CANCELLED)
7. **order_items** - Chi tiết sản phẩm trong đơn hàng
8. **staff_notes** - Ghi chú nội bộ của nhân viên về đơn hàng
9. **inventory_transactions** - Lịch sử giao dịch kho hàng

## Cài đặt

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env từ template
cp .env.example .env
# Chỉnh sửa DATABASE_URL trong .env theo cấu hình PostgreSQL của bạn

# Generate Prisma Client
npm run db:generate

# Đẩy schema lên database
npm run db:push

# Tạo dữ liệu mẫu
npm run db:seed
```

## Chạy Server

```bash
# Development mode với hot reload
npm run dev

# Production build
npm run build
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## API Endpoints

### Users
- `POST /api/users` - Tạo user mới
- `GET /api/users/:id` - Lấy thông tin user
- `GET /api/users/:userId/cart` - Lấy giỏ hàng
- `GET /api/users/:userId/orders` - Lấy đơn hàng của user
- `GET /api/users/:userId/addresses` - Lấy địa chỉ của user

### Addresses
- `POST /api/addresses` - Thêm địa chỉ
- `PUT /api/addresses/:id` - Cập nhật địa chỉ
- `PUT /api/addresses/:id/default` - Đặt làm địa chỉ mặc định
- `DELETE /api/addresses/:id` - Xóa địa chỉ

### Products & Variants
- `POST /api/products` - Tạo sản phẩm mới
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `POST /api/products/:productId/variants` - Thêm biến thể
- `PUT /api/variants/:id` - Cập nhật biến thể

### Cart
- `POST /api/cart` - Thêm vào giỏ hàng
- `PUT /api/cart/:id` - Cập nhật số lượng
- `DELETE /api/cart/:id` - Xóa sản phẩm khỏi giỏ
- `DELETE /api/cart/user/:userId` - Xóa toàn bộ giỏ hàng

### Orders
- `POST /api/orders` - Tạo đơn hàng từ giỏ hàng
- `GET /api/orders` - Lấy tất cả đơn hàng (staff/admin)
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `PUT /api/orders/:id/status` - Cập nhật trạng thái (tự động quản lý tồn kho)

### Staff Notes
- `POST /api/staff-notes` - Thêm ghi chú nội bộ
- `GET /api/staff-notes/order/:orderId` - Lấy ghi chú của đơn hàng

### Inventory
- `POST /api/inventory/transactions` - Ghi nhận giao dịch kho (nhập hàng)
- `GET /api/inventory/transactions` - Lịch sử giao dịch
- `GET /api/inventory/summary` - Tổng quan tồn kho

## Prisma Studio

Để xem và quản lý database trực quan:

```bash
npm run db:studio
```

## Tính năng nổi bật

- ✅ Tự động quản lý tồn kho khi đơn hàng được xác nhận/hủy
- ✅ Ghi nhận lịch sử giao dịch kho hàng
- ✅ Snapshot dữ liệu sản phẩm trong OrderItem
- ✅ Quản lý địa chỉ mặc định tự động
- ✅ Kiểm tra tồn kho trước khi tạo đơn
- ✅ Transaction database đảm bảo tính toàn vẹn dữ liệu
