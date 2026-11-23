import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';

/**
 * Conexão compartilhada com o banco (Prisma).
 * Global: os demais módulos injetam PrismaService sem precisar importar este módulo.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
