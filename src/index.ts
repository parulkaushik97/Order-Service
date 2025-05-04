import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import orderRoutes from './routes/orderRoutes';
import { connectRabbitMQ } from './rabbitmq/rabbitmq';  // ✅ Import RabbitMQ connection
import { consumeOrderQueue } from './rabbitmq/orderConsumer';

consumeOrderQueue();


dotenv.config();

const app = express();
const port: number = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(express.json());

// Static file serving
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/orders', orderRoutes);

// Default route
app.get('/', (_req: Request, res: Response) => {
  res.send('Welcome to the Order Service API');
});

// Start server after RabbitMQ is connected
(async () => {
  try {
    await connectRabbitMQ(); // ✅ Connect to RabbitMQ before starting the server
    app.listen(port, () => {
      console.log(`✅ Order Service is running on port ${port}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to RabbitMQ:', err);
    process.exit(1);
  }
})();
