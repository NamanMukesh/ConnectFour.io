// Kafka configuration
import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'connectfour-server',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'analytics-group' });


