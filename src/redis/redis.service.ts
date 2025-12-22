import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis
  constructor(private readonly configService: ConfigService) {}
  onModuleInit() {
    const redisUrl = this.configService.get('REDIS_URL')
    if (!redisUrl) {
      throw new Error('REDIS_URL env variable is not set')
    }
    this.redis = new Redis(redisUrl)
  }
  onModuleDestroy() {
    this.redis.disconnect()
  }

  async setSession(userId: number, data: any, expireSeconds = 3600) {
    await this.redis.set(`session:${userId}`, JSON.stringify(data), 'EX', expireSeconds)
  }

  async getSession(userId: number) {
    const data = await this.redis.get(`session:${userId}`)
    if (!data) {
      return null
    }
    return JSON.parse(data)
  }

  async deleteSession(userId: number) {
    await this.redis.del(`session:${userId}`)
  }
}
