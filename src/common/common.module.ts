import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IsUniqueConstraint } from './validators/is-unique-validator';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'secret',
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [IsUniqueConstraint],
  exports: [JwtModule, IsUniqueConstraint],
})
export class CommonModule {}
