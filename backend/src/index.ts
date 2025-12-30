import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRouter from './routes/users.js';
import addressesRouter from './routes/addresses.js';
import productsRouter from './routes/products.js';
import variantsRouter from './routes/variants.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import staffNotesRouter from './routes/staffNotes.js';
import inventoryRouter from './routes/inventory.js';
import chatRouter from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow all origins for development
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.json({ message: "PhoneCom Backend is running! 🚀", checkHealth: "/api/products" });
});

// Routes
app.use('/api/users', usersRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/products', productsRouter);
app.use('/api/variants', variantsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/staff-notes', staffNotesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/chat', chatRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
