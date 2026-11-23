
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';

import { CommonModule } from './common/common.module.js';
import { AlunosModule } from './modules/alunos/alunos.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { FichasModule } from './modules/fichas/fichas.module.js';
import { MailModule } from './modules/mail/mail.module.js';
import { PagamentosModule } from './modules/pagamentos/pagamentos.module.js';
import { TreinosModule } from './modules/treinos/treinos.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'backend-nestjs',
    }),

    // Infraestrutura compartilhada
    PrismaModule,
    CommonModule,

    // Módulos de negócio
    AuthModule,
    UsuariosModule,
    AlunosModule,
    FichasModule,
    TreinosModule,
    PagamentosModule,
    MailModule,
  ],
})
export class AppModule {}
