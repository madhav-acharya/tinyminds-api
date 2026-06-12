import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IsUniqueConstraint } from './validators/is-unique-validator';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'secret',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [PrismaService, IsUniqueConstraint],
  exports: [PrismaService, JwtModule, IsUniqueConstraint],
})
export class CommonModule {}
