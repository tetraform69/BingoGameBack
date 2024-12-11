import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private UsersService: UsersService,
    private jwtService: JwtService
  ) { }

  async signIn(
    AuthDto: AuthDto
  ): Promise<{ access_token: string }> {
    const { username, password } = AuthDto

    const user = await this.UsersService.findOne({ "username": username });
    if (user === null) {
      throw new HttpException(
        { message: 'User not found' },
        HttpStatus.NOT_FOUND
      );
    }

    let isAuth = await bcrypt.compare(password, user.password);
    if (!isAuth) {
      throw new HttpException(
        { message: 'User or password is incorrect!' },
        HttpStatus.UNAUTHORIZED
      );
    }

    const payload = {
      userId: (user as any)._id,
      username: user.username
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
