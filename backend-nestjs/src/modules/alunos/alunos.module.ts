import { Module } from '@nestjs/common';

import { MailModule } from '../mail/mail.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AlunosController } from './alunos.controller.js';
import { AlunosService } from './alunos.service.js';

/** AlunosModule: cadastro e gerenciamento de alunos (somente administrador). */
@Module({
  imports: [UsuariosModule, MailModule],
  controllers: [AlunosController],
  providers: [AlunosService],
  exports: [AlunosService],
})
export class AlunosModule {}
