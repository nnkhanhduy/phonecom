import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed process...');

    // Clean up existing data (Order matters due to foreign keys)
    await prisma.staffNote.deleteMany();
    await prisma.inventoryTx.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    console.log('Database cleared.');

    // 0. Create Roles
    const customerRole = await prisma.role.create({ data: { name: 'CUSTOMER', permissions: ['buy_products'], description: 'Standard user' } });
    const staffRole = await prisma.role.create({ data: { name: 'STAFF', permissions: ['manage_orders'], description: 'Staff member' } });
    const adminRole = await prisma.role.create({ data: { name: 'ADMIN', permissions: ['manage_all'], description: 'Administrator' } });
    const guestRole = await prisma.role.create({ data: { name: 'GUEST', permissions: ['view_products'], description: 'Guest visitor' } });

    console.log('Roles created.');

    // 1. Create Users
    const admin = await prisma.user.create({
        data: {
            fullName: 'Admin User',
            email: 'admin@demo.com',
            roleId: adminRole.id,
        },
    });

    const staff = await prisma.user.create({
        data: {
            fullName: 'Le Thi Staff',
            email: 'staff@demo.com',
            roleId: staffRole.id,
        },
    });

    const customers = [];
    const customerNames = ['Hao Sao', 'Ko Pin Duy', 'Manh Gay', 'Trinh Gia Man', 'OOOAD'];
    const customerEmails = ['hs@demo.com', 'kpd@demo.com', 'mg@demo.com', 'tgm@demo.com', 'oo@demo.com'];

    for (let i = 0; i < customerNames.length; i++) {
        const c = await prisma.user.create({
            data: {
                fullName: customerNames[i],
                email: customerEmails[i],
                roleId: customerRole.id,
                addresses: {
                    create: [
                        {
                            recipientName: customerNames[i],
                            phoneNumber: `090${Math.floor(1000000 + Math.random() * 9000000)}`,
                            line1: `${Math.floor(1 + Math.random() * 500)} Main St`,
                            ward: `Ward ${Math.floor(1 + Math.random() * 10)}`,
                            district: `District ${Math.floor(1 + Math.random() * 5)}`,
                            province: 'Ho Chi Minh',
                            isDefault: true,
                        },
                        {
                            recipientName: customerNames[i],
                            phoneNumber: `090${Math.floor(1000000 + Math.random() * 9000000)}`,
                            line1: `${Math.floor(1 + Math.random() * 500)} Second St`,
                            ward: `Ward ${Math.floor(1 + Math.random() * 10)}`,
                            district: `District ${Math.floor(1 + Math.random() * 5)}`,
                            province: 'Ha Noi',
                            isDefault: false,
                        }
                    ]
                }
            }
        });
        customers.push(c);
    }

    console.log('Users and Addresses created.');

    // 2. Create Products & Variants
    const productsData = [
        {
            name: 'iPhone 15 Pro',
            brand: 'Apple',
            description: 'The ultimate iPhone. Titanium design. A17 Pro chip.',
            status: 'ACTIVE',
            imageUrl: 'https://tse1.explicit.bing.net/th/id/OIP.c-v5bJuEnmpdHFvJScQRjQHaJH?w=2162&h=2660&rs=1&pid=ImgDetMain&o=7&rm=3',
            variants: [
                { name: '128GB - Natural Titanium', color: 'Natural Titanium', capacity: '128GB', price: 999, stockQuantity: 25, imageUrl: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=800' },
                { name: '256GB - Blue Titanium', color: 'Blue Titanium', capacity: '256GB', price: 1099, stockQuantity: 15, imageUrl: 'https://images.unsplash.com/photo-1696448377225-b6ffaf3194a2?auto=format&fit=crop&q=80&w=800' },
                { name: '512GB - Black Titanium', color: 'Black Titanium', capacity: '512GB', price: 1299, stockQuantity: 10, imageUrl: 'https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?auto=format&fit=crop&q=80&w=800' }
            ]
        },
        {
            name: 'Samsung Galaxy S24 Ultra',
            brand: 'Samsung',
            description: 'Galaxy AI is here. Epic surfing, searching, and translation.',
            status: 'ACTIVE',
            imageUrl: 'https://tse4.mm.bing.net/th/id/OIP.hQVUtnziJeAuUtTx-BKDHQHaFj?rs=1&pid=ImgDetMain&o=7&rm=3',
            variants: [
                { name: '256GB - Titanium Black', color: 'Titanium Black', capacity: '256GB', price: 1299, stockQuantity: 30, imageUrl: 'https://images.unsplash.com/photo-1707133935823-380d603a1197?auto=format&fit=crop&q=80&w=800' },
                { name: '512GB - Titanium Violet', color: 'Titanium Violet', capacity: '512GB', price: 1419, stockQuantity: 12, imageUrl: 'https://images.unsplash.com/photo-1707133935397-26f56e6d16ff?auto=format&fit=crop&q=80&w=800' },
                { name: '1TB - Titanium Gray', color: 'Titanium Gray', capacity: '1TB', price: 1599, stockQuantity: 5, imageUrl: 'https://images.unsplash.com/photo-1707133936665-680786576628?auto=format&fit=crop&q=80&w=800' }
            ]
        },
        {
            name: 'Xiaomi 14 Ultra',
            brand: 'Xiaomi',
            description: 'Lens to Legend. Leica Summilux optical lens.',
            status: 'ACTIVE',
            imageUrl: 'https://i02.appmifile.com/334_operator_sg/22/02/2024/d36105f6de5a716a1c0737352c2827be.png',
            variants: [
                { name: '512GB - Black', color: 'Black', capacity: '512GB', price: 1199, stockQuantity: 20, imageUrl: 'https://images.unsplash.com/photo-1712495636007-4e6628670783?auto=format&fit=crop&q=80&w=800' },
                { name: '512GB - White', color: 'White', capacity: '512GB', price: 1199, stockQuantity: 15, imageUrl: 'https://images.unsplash.com/photo-1712499694503-6a56e6d16ff1?auto=format&fit=crop&q=80&w=800' }
            ]
        },
        {
            name: 'Sony Xperia 1 VI',
            brand: 'Sony',
            description: 'The master of photography and entertainment.',
            status: 'ACTIVE',
            imageUrl: 'https://cdn.mos.cms.futurecdn.net/cWG2kiVg3uSeHQKzHuY8wK.jpg',
            variants: [
                { name: '256GB - Platinum Silver', color: 'Platinum Silver', capacity: '256GB', price: 1399, stockQuantity: 8, imageUrl: 'https://images.unsplash.com/photo-1610433562743-3467f6314c46?auto=format&fit=crop&q=80&w=800' },
                { name: '512GB - Khaki Green', color: 'Khaki Green', capacity: '512GB', price: 1499, stockQuantity: 4, imageUrl: 'https://images.unsplash.com/photo-1544244015-0cd4b3ffc6b0?auto=format&fit=crop&q=80&w=800' }
            ]
        },
        {
            name: 'Oppo Find X7 Ultra',
            brand: 'Oppo',
            description: 'The first quad-camera system with dual periscope lenses.',
            status: 'ACTIVE',
            imageUrl: 'https://tse1.mm.bing.net/th/id/OIP.yNKzB4x0hpn16LV9UhjPfAHaGl?rs=1&pid=ImgDetMain&o=7&rm=3',
            variants: [
                { name: '256GB - Ocean Blue', color: 'Ocean Blue', capacity: '256GB', price: 999, stockQuantity: 15, imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800' },
                { name: '512GB - Sepia Brown', color: 'Sepia Brown', capacity: '512GB', price: 1099, stockQuantity: 8, imageUrl: 'https://images.unsplash.com/photo-1574852859542-1b41217a7805?auto=format&fit=crop&q=80&w=800' }
            ]
        }
    ];

    const createdVariants: any[] = [];

    for (const p of productsData) {
        const product = await prisma.product.create({
            data: {
                name: p.name,
                brand: p.brand,
                description: p.description,
                status: p.status,
                imageUrl: p.imageUrl,
                variants: {
                    create: p.variants.map(v => ({
                        ...v,
                        status: v.stockQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'
                    }))
                }
            },
            include: { variants: true }
        });
        createdVariants.push(...product.variants);
    }

    console.log('Products and variants created.');

    // 3. Inventory Transactions
    for (const variant of createdVariants) {
        await prisma.inventoryTx.create({
            data: {
                variantId: variant.id,
                type: 'RESTOCK',
                quantity: variant.stockQuantity,
                reason: 'Initial stock load',
                createdBy: admin.id,
                createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) // 31 days ago
            }
        });
    }

    console.log('Inventory Transactions created.');

    // 4. Create historical orders
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const now = new Date();

    for (let i = 0; i < 60; i++) {
        const orderDate = new Date();
        orderDate.setDate(now.getDate() - Math.floor(Math.random() * 30));

        const customerObj = customers[Math.floor(Math.random() * customers.length)];
        const orderStatus = statuses[Math.floor(Math.random() * statuses.length)];

        // Random 1-3 items per order
        const numItems = Math.floor(Math.random() * 3) + 1;
        const itemsToCreate = [];
        let totalVal = 0;

        for (let j = 0; j < numItems; j++) {
            const v = createdVariants[Math.floor(Math.random() * createdVariants.length)];
            const q = Math.floor(Math.random() * 2) + 1;
            const lineVal = Number(v.price) * q;
            totalVal += lineVal;

            itemsToCreate.push({
                variantId: v.id,
                variantNameSnapshot: v.name,
                quantity: q,
                unitPrice: v.price,
                lineTotal: lineVal
            });
        }

        const order = await prisma.order.create({
            data: {
                userId: customerObj.id,
                status: orderStatus,
                totalAmount: totalVal,
                subtotal: totalVal,
                shippingFee: 0,
                paymentMethod: i % 2 === 0 ? 'COD' : 'BANK_TRANSFER',
                shippingAddress: `${customerObj.fullName}, 0901234567, 123 Delivery St, Ward 5, District 3, Ho Chi Minh`,
                createdAt: orderDate,
                items: { create: itemsToCreate },
                // Log audit for completed orders
                ...(orderStatus === 'COMPLETED' ? {
                    completedAt: orderDate,
                    completedBy: staff.id
                } : {}),
                ...(orderStatus === 'CONFIRMED' ? {
                    confirmedAt: orderDate,
                    confirmedBy: staff.id
                } : {}),
                ...(orderStatus === 'CANCELLED' ? {
                    cancelledAt: orderDate,
                    cancelledBy: staff.id,
                    cancelReason: 'User changed mind'
                } : {})
            }
        });

        // Add some staff notes
        if (i % 3 === 0) {
            await prisma.staffNote.create({
                data: {
                    orderId: order.id,
                    staffId: i % 2 === 0 ? staff.id : admin.id,
                    content: `Order looks good. Customer requested urgent delivery. #${i}`,
                    createdAt: orderDate
                }
            });
        }
    }

    console.log('Orders and Staff Notes created.');

    // 5. Carts
    for (const customerObj of customers) {
        if (Math.random() > 0.5) {
            const cart = await prisma.cart.create({
                data: {
                    userId: customerObj.id,
                    totalItems: 1,
                    totalAmount: 0
                }
            });

            const v = createdVariants[Math.floor(Math.random() * createdVariants.length)];
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    variantId: v.id,
                    qty: 1,
                    unitPrice: v.price,
                    lineAmount: v.price
                }
            });

            await prisma.cart.update({
                where: { id: cart.id },
                data: { totalAmount: v.price }
            });
        }
    }

    console.log('Carts created.');
    console.log('Seed process completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
