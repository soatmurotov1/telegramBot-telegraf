import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TestService],
  exports: [TestService],
})
export class TestModule {}
