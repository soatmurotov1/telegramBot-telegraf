import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis

  onModuleInit() {
    this.redis = new Redis({ host: '127.0.0.1', port: 6379 })
  }
  onModuleDestroy() {
    this.redis.disconnect()
  }

  async setSession(userId: number, data: any, expireSeconds = 3600) {
    await this.redis.set(`session:${userId}`, JSON.stringify(data), 'EX', expireSeconds)
  }

  async getSession(userId: number) {
    const data = await this.redis.get(`session:${userId}`)
    if (!data) 
        return null
    return JSON.parse(data)
  }

  async deleteSession(userId: number) {
    await this.redis.del(`session:${userId}`)
  }
}
