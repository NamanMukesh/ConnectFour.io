import { getKafkaProducer } from '../config/kafka.config.js';
import { TOPICS } from './topics.kafka.js';

let producer = null;

export async function initProducer() {
  producer = await getKafkaProducer();

  if (producer) {
    console.log('Kafka Producer ready');
  } else {
    console.log('Kafka disabled — analytics will be skipped');
  }
}

export async function emitGameEvent(type, payload) {
  if (!producer) return; // Kafka disabled or unavailable

  try {
    await producer.send({
      topic: TOPICS.GAME_EVENTS,
      messages: [
        {
          key: type,
          value: JSON.stringify({
            type,
            payload,
            timestamp: Date.now(),
          }),
        },
      ],
    });
  } catch (err) {
    console.error('Failed to emit Kafka event:', err.message);
  }
}
