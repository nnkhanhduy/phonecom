import { Product, User, Role, CartItem, Order, OrderStatus, Address, Variant } from './types';

const API_URL = 'http://localhost:3001/api';

// Helper to handle response
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || response.statusText);
    }
    if (response.status === 204) {
        return {} as T;
    }
    return response.json();
}

export const api = {
    // --- USERS ---
    users: {
        create: (data: any) =>
            fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(res => handleResponse<User>(res)),

        getAll: () =>
            fetch(`${API_URL}/users`).then(res => handleResponse<User[]>(res)),

        getById: (id: string) =>
            fetch(`${API_URL}/users/${id}`).then(res => handleResponse<User>(res)),

        getCart: (userId: string) =>
            fetch(`${API_URL}/users/${userId}/cart`).then(res => handleResponse<CartItem[]>(res)),

        getOrders: (userId: string) =>
            fetch(`${API_URL}/users/${userId}/orders`).then(res => handleResponse<Order[]>(res)),

        getAddresses: (userId: string) =>
            fetch(`${API_URL}/users/${userId}/addresses`).then(res => handleResponse<Address[]>(res)),

        update: (id: string, data: any) =>
            fetch(`${API_URL}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(res => handleResponse<User>(res)),
    },

    // --- PRODUCTS & VARIANTS ---
    products: {
        getAll: () =>
            fetch(`${API_URL}/products`).then(res => handleResponse<Product[]>(res)),

        getById: (id: string) =>
            fetch(`${API_URL}/products/${id}`).then(res => handleResponse<Product>(res)),

        create: (data: any) =>
            fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(res => handleResponse<Product>(res)),

        update: (id: string, data: any) =>
            fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(res => handleResponse<Product>(res)),
    },

    variants: {
        update: (id: string, data: any) =>
            fetch(`${API_URL}/variants/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(res => handleResponse<Variant>(res)),
    },

    // --- CART ---
    cart: {
        add: (userId: string, variantId: string, quantity: number = 1) =>
            fetch(`${API_URL}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, variantId, quantity }),
            }).then(res => handleResponse<CartItem>(res)),

        updateQty: (id: string, quantity: number) =>
            fetch(`${API_URL}/cart/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity }),
            }).then(res => handleResponse<CartItem>(res)),

        remove: (id: string) =>
            fetch(`${API_URL}/cart/${id}`, {
                method: 'DELETE',
            }).then(res => handleResponse<void>(res)),

        clearParams: (userId: string) =>
            fetch(`${API_URL}/cart/user/${userId}`, {
                method: 'DELETE',
            }).then(res => handleResponse<void>(res)),
    },

    // --- ORDERS ---
    orders: {
        create: (userId: string, shippingAddress: string) =>
            fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, shippingAddress }),
            }).then(res => handleResponse<Order>(res)),

        getAll: (status?: OrderStatus) => {
            const url = status ? `${API_URL}/orders?status=${status}` : `${API_URL}/orders`;
            return fetch(url).then(res => handleResponse<Order[]>(res));
        },

        updateStatus: (id: string, status: OrderStatus) =>
            fetch(`${API_URL}/orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            }).then(res => handleResponse<Order>(res)),
    },

    // --- ADDRESSES ---
    addresses: {
        create: (data: Partial<Address>) =>
            fetch(`${API_URL}/addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(res => handleResponse<Address>(res)),
    },

    // --- STAFF NOTES ---
    staffNotes: {
        create: (orderId: string, authorId: string, content: string) =>
            fetch(`${API_URL}/staff-notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, authorId, content }),
            }).then(res => handleResponse<any>(res)),

        update: (id: string, content: string) =>
            fetch(`${API_URL}/staff-notes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            }).then(res => handleResponse<any>(res)),

        delete: (id: string) =>
            fetch(`${API_URL}/staff-notes/${id}`, {
                method: 'DELETE',
            }).then(res => handleResponse<void>(res)),
    },

    // --- INVENTORY ---
    inventory: {
        getTransactions: () =>
            fetch(`${API_URL}/inventory/transactions`).then(res => handleResponse<any[]>(res)),
    }
};
