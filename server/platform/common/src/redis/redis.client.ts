// packages/shared/redis-client.ts

import Redis from 'ioredis';

type RedisConfig = {
  host: string;
  port: number;
  password?: string;
  serviceName?: string;
};

export const createRedisClient = (config: RedisConfig) => {
  const client = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
  });

  client.on('connect', () => {
    console.log(`✅ Redis connected [${config.serviceName || 'unknown'}]`);
  });

  client.on('error', (err) => {
    console.error(`❌ Redis error [${config.serviceName}]:`, err);
  });

  return client;
};