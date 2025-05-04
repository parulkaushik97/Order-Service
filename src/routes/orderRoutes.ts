// routes/orderRoutes.ts
import { Router, Request, Response } from 'express';
import axios from 'axios';
import pool from '../db';
import { publishToQueue } from '../rabbitmq/rabbitmq';


const router = Router();
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3000/products';
const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3000/customers';

// Fetch all orders
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Fetch an order by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if ((rows as any[]).length === 0) 
       res.status(404).json({ message: 'Order not found' });
    res.json((rows as any[])[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Create an order
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { productId, quantity, customerId } = req.body;

  try {
    const productRes = await axios.get(`${PRODUCT_SERVICE_URL}/${productId}`);
    const customerRes = await axios.get(`${CUSTOMER_SERVICE_URL}/${customerId}`);

    if (productRes.status === 200 && customerRes.status === 200) {
      const [result] = await pool.query(
        'INSERT INTO orders (productId, quantity, customerId, order_Date, status) VALUES (?, ?, ?, NOW(), ?)',
        [productId, quantity, customerId, 'Pending']
      );

      await publishToQueue('orderCreated', JSON.stringify({
        productId,
        quantity,
        customerId,
        order_Date: new Date(),
        status: 'Pending'
      }));

      res.status(201).json({ message: 'Order created successfully' });
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      const message = error.config?.url?.includes(PRODUCT_SERVICE_URL)
        ? 'Product not found'
        : 'Customer not found';
      res.status(404).json({ message });
    } else {
      console.error('Error checking product/customer or creating order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});



// Update an order
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { quantity, status } = req.body;
  const id = req.params.id;

  try {
    const [result] = await pool.query(
      'UPDATE orders SET quantity = ?, status = ? WHERE id = ?',
      [quantity, status, id]
    );

    if ((result as any).affectedRows === 0)  
      res.status(404).json({ message: 'Order not found' });

    const [updatedOrder] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    res.json((updatedOrder as any[])[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order' });
  }
});

// Delete an order
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;

  try {
    const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [id]);
    if ((result as any).affectedRows === 0)  
      res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order' });
  }
});

export default router;