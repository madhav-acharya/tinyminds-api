import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async register(registerDto: RegisterDto) {
    try {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const user = await this.userService.create({
        ...registerDto,
        password: hashedPassword,
      });
      const { password, ...result } = user;
      return result;
    } catch (error) {
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

    const { password: _, ...userData } = user;

    return {
      message: 'Logged in successfully',
      user: userData,
      token: 'dummy-jwt-token-replace-me'
    };
  }

  async logout() {
    return { message: 'Logged out successfully' };
  }
}
