import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Clean up existing data (Order matters due to foreign keys)
    await prisma.staffNote.deleteMany();
    await prisma.inventoryTx.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();

    console.log('Database cleared.');

    // 1. Create Users
    const customer = await prisma.user.create({
        data: {
            fullName: 'Nguyen Van Customer',
            email: 'customer@demo.com',
            role: 'CUSTOMER',
            addresses: {
                create: {
                    recipientName: 'Nguyen Van A',
                    phone: '0901234567',
                    addressLine: '123 Le Loi',
                    city: 'Ho Chi Minh',
                    isDefault: true,
                },
            },
        },
    });

    const staff = await prisma.user.create({
        data: {
            fullName: 'Le Thi Staff',
            email: 'staff@demo.com',
            role: 'STAFF',
        },
    });

    const admin = await prisma.user.create({
        data: {
            fullName: 'Admin User',
            email: 'admin@demo.com',
            role: 'ADMIN',
        },
    });

    console.log('Created users:', { customer, staff, admin });

    // 2. Create Products
    const iphone = await prisma.product.create({
        data: {
            name: 'iPhone 15 Pro',
            brand: 'Apple',
            description: 'The ultimate iPhone. Titanium design. A17 Pro chip.',
            variants: {
                create: [
                    {
                        name: '128GB - Natural Titanium',
                        color: 'Natural Titanium',
                        capacity: '128GB',
                        price: 999,
                        stockQuantity: 10,
                        imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800',
                    },
                    {
                        name: '256GB - Blue Titanium',
                        color: 'Blue Titanium',
                        capacity: '256GB',
                        price: 1099,
                        stockQuantity: 5,
                        imageUrl: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=800',
                    },
                ],
            },
        },
    });

    const samsung = await prisma.product.create({
        data: {
            name: 'Samsung Galaxy S24',
            brand: 'Samsung',
            description: 'Galaxy AI is here. Epic surfing, searching, and translation.',
            variants: {
                create: [
                    {
                        name: '256GB - Onyx Black',
                        color: 'Onyx Black',
                        capacity: '256GB',
                        price: 899,
                        stockQuantity: 20,
                        imageUrl: 'https://images.unsplash.com/photo-1706606991536-e3204279b907?auto=format&fit=crop&q=80&w=800',
                    },
                    {
                        name: '512GB - Marble Gray',
                        color: 'Marble Gray',
                        capacity: '512GB',
                        price: 999,
                        stockQuantity: 2,
                        imageUrl: 'https://images.unsplash.com/photo-1706606991536-e3204279b907?auto=format&fit=crop&q=80&w=800',
                    },
                ],
            },
        },
    });

    const pixel = await prisma.product.create({
        data: {
            name: 'Pixel 8 Pro',
            brand: 'Google',
            description: 'The AI phone built by Google.',
            variants: {
                create: [
                    {
                        name: '128GB - Obsidian',
                        color: 'Obsidian',
                        capacity: '128GB',
                        price: 899,
                        stockQuantity: 0,
                        imageUrl: 'https://images.unsplash.com/photo-1696355941655-b467da34fb6c?auto=format&fit=crop&q=80&w=800',
                    },
                ],
            },
        },
    });

    console.log('Created products:', { iphone, samsung, pixel });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
