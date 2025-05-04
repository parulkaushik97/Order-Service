// src/queue/orderConsumer.ts
import { connect } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'orderCreated';

export async function consumeOrderQueue() {
  try {
    const connection = await connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(`🟢 Waiting for messages in queue: ${QUEUE_NAME}`);

    channel.consume(
      QUEUE_NAME,
      (msg) => {
        if (msg !== null) {
          const content = msg.content.toString();
          console.log(`📥 Received: ${content}`);
          // TODO: Process the message (e.g., update DB, call API, etc.)

          channel.ack(msg); // Acknowledge successful processing
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error('❌ Failed to consume from queue:', error);
  }
}
