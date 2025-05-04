// src/rabbitmq.ts
import amqp from 'amqplib';
import dotenv from 'dotenv';
dotenv.config();


let channel: amqp.Channel;

export async function connectRabbitMQ() {
  try {
    const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
    const connection = await amqp.connect(RABBITMQ_URL); // or your RabbitMQ host
    channel = await connection.createChannel();
    console.log('✅ Connected to RabbitMQ');
  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ', error);
  }
}

export async function publishToQueue(queue: string, message: string) {
  if (!channel) {
    console.error('Channel not initialized. Call connectRabbitMQ first.');
    return;
  }
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(message));
  console.log(`📤 Sent message to ${queue}: ${message}`);
}

export async function consumeFromQueue(queue: string, handler: (msg: amqp.ConsumeMessage | null) => void) {
  if (!channel) {
    console.error('Channel not initialized. Call connectRabbitMQ first.');
    return;
  }
  await channel.assertQueue(queue, { durable: true });
  await channel.consume(queue, handler, { noAck: true });
  console.log(`📥 Listening on queue: ${queue}`);
}
