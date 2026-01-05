import { Kafka, Partitioners } from 'kafkajs';

let producer = null;
let kafkaEnabled = process.env.KAFKA_ENABLED === 'true';

export async function getKafkaProducer() {
  if (!kafkaEnabled) return null;

  if (producer) return producer;

  try {
    const kafka = new Kafka({
      clientId: 'connectfour-server',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      retry: {
        retries: 2
      }
    });

    producer = kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner
    });

    await producer.connect();
    console.log('✅ Kafka producer connected');
    return producer;
  } catch (error) {
    console.error('⚠️ Kafka not available, disabling analytics');
    kafkaEnabled = false;
    producer = null;
    return null;
  }
}
