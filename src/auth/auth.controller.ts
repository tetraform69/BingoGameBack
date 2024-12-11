import { Controller, Post, Body, Get, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  signIn(@Body() AuthDto: AuthDto) {
    return this.authService.signIn(AuthDto);
  }

  @UseGuards(AuthGuard)
  @Get('guard')
  test(@Request() req) {
    return "Autorizado"
  }
}
