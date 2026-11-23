import { Module } from '@nestjs/common';

import { MailModule } from '../mail/mail.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

/**
 * AuthModule: login, logout, sessões (cookie HttpOnly + token anti-CSRF),
 * alteração e recuperação de senha, aceite de convite.
 */
@Module({
  imports: [UsuariosModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
