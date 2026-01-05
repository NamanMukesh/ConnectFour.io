import { kafka } from '../config/kafka.config.js';
import { TOPICS } from '../kafka/topics.kafka.js';
import { processAnalyticsEvent } from '../game/metrics.service.js';

const consumer = kafka.consumer({ groupId: 'analytics-group' });

export async function startAnalyticsConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.GAME_EVENTS });

  console.log('📊 Analytics consumer running');

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      processAnalyticsEvent(event);
    },
  });
}
