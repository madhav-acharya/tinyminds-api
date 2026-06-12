import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { ActiveUserData } from '../common/interfaces/active-user.interface';

@Injectable()
export class AuthService {
  private readonly jwtBlacklist = new Set<string>();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    if (registerDto.role !== UserRole.TEACHER && registerDto.role !== UserRole.PARENT) {
      throw new BadRequestException('Role not allowed for self-registration');
    }

    try {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const user = await this.userService.create({
        ...registerDto,
        password: hashedPassword,
      });
      const { password, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('User registration failed.');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userService.findByUsernameOrEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return await this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const { sub } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'>
      >(refreshToken, {
        secret: this.configService.get('JWT_SECRET') || 'secret',
      });
      const user = await this.userService.findOne(sub);
      return await this.generateTokens(user);
    } catch {
      throw new UnauthorizedException();
    }
  }

  async logout(token: string) {
    this.jwtBlacklist.add(token);
    return { success: true, message: 'Logged out successfully' };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.jwtBlacklist.has(token);
  }

  private async generateTokens(user: any) {
    const payload: ActiveUserData = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(
        { sub: user.id },
        {
          expiresIn: '7d',
        },
      ),
    ]);

    const { password, ...userData } = user;

    return {
      accessToken,
      refreshToken,
      user: userData,
    };
  }
}
