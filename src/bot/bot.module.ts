import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { RedisModule } from 'src/redis/redis.module';
import { TestModule } from 'src/test/test.module'; 
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule, 
    RedisModule, 
    TestModule 
  ],
  providers: [BotUpdate],
})
export class BotModule {}