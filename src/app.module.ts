import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaService } from './prisma/prisma.service';
import { BotModule } from './bot/bot.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    BotModule,
    RedisModule,
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN!,
    }),
  ],
  providers: [PrismaService],
})
export class AppModule {}
