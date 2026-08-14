// src/redis/queue.ts
import { Queue } from 'bullmq';

export const createQueue = (name: string, connection: any) => {
  return new Queue(name, { connection });
};