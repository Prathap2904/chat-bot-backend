import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    // UsersModule is imported so AuthService can call UsersService.findByEmail()
    UsersModule,

    PassportModule,

    // JwtModule reads JWT_SECRET and JWT_EXPIRATION from environment variables.
    // Using registerAsync ensures ConfigModule is ready before this runs.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'MISSING_JWT_SECRET_SET_ENV'),
        signOptions: {
          // Cast needed: @nestjs/jwt expects StringValue from the `ms` package,
          // not a plain string. The value is still read correctly at runtime.
          expiresIn: configService.get<string>('JWT_EXPIRATION', '8h') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  // JwtStrategy must be a provider so Passport registers the 'jwt' strategy.
  // JwtAuthGuard (in other modules) references this strategy by name 'jwt'.
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
