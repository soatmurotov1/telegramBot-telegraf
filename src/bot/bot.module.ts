import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BotUpdate } from './bot.update';
import { RedisModule } from 'src/redis/redis.module';
@Module({
  imports: [RedisModule],
  providers: [BotUpdate, PrismaService, RedisModule],
})
export class BotModule {}
