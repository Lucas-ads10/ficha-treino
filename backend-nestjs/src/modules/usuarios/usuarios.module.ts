import { Module } from '@nestjs/common';

import { UsuariosService } from './usuarios.service.js';

/** UsuariosModule: contas, tokens de acesso, sessões e criação do administrador. */
@Module({
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
