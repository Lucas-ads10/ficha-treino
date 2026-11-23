/**
 * Procedimento de inicialização do administrador principal.
 *
 * Executado MANUALMENTE, uma única vez, por quem tem acesso ao servidor
 * (terminal local ou "Shell" do Render):
 *
 *   npm run admin:criar
 *
 * - Não existe senha padrão no código nem rota pública para criar admins.
 * - Recusa rodar se já existir um administrador.
 * - A senha é digitada sem eco (ou vem de ADMIN_SENHA, para ambientes sem terminal).
 * - Nada disso é gravado em log.
 *
 * Variáveis opcionais: ADMIN_NOME, ADMIN_EMAIL, ADMIN_SENHA.
 */
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';

import { SenhaService } from '../common/senha.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsuariosModule } from '../modules/usuarios/usuarios.module.js';
import { UsuariosService } from '../modules/usuarios/usuarios.service.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, UsuariosModule],
  providers: [SenhaService],
  exports: [SenhaService],
})
class CliModule {}

function perguntar(texto: string, oculto = false): Promise<string> {
  return new Promise((resolver) => {
    let mudo = false;
    const saida = new Writable({
      write(chunk, _codificacao, proximo) {
        if (!mudo) {
          process.stdout.write(chunk);
        }
        proximo();
      },
    });

    const leitor = createInterface({
      input: process.stdin,
      output: saida,
      terminal: true,
    });

    process.stdout.write(texto);
    mudo = oculto;

    leitor.question('', (resposta) => {
      leitor.close();
      if (oculto) {
        process.stdout.write('\n');
      }
      resolver(resposta);
    });
  });
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(CliModule, {
    logger: ['error'],
  });

  try {
    const usuarios = app.get(UsuariosService);

    if ((await usuarios.contarAdministradores()) > 0) {
      console.error(
        'Já existe um administrador cadastrado. Este procedimento só roda uma vez.\n' +
          'Para trocar a senha, use "Esqueci minha senha" na tela de login.',
      );
      process.exitCode = 1;
      return;
    }

    const interativo = Boolean(process.stdin.isTTY);

    const nome =
      process.env.ADMIN_NOME?.trim() ||
      (interativo ? (await perguntar('Nome do administrador [Administrador]: ')).trim() : '') ||
      'Administrador';

    const email =
      process.env.ADMIN_EMAIL?.trim() ||
      (interativo ? (await perguntar('E-mail do administrador: ')).trim() : '');

    if (!email || !email.includes('@')) {
      console.error('Informe um e-mail válido (ADMIN_EMAIL ou digitando quando solicitado).');
      process.exitCode = 1;
      return;
    }

    let senha = process.env.ADMIN_SENHA ?? '';

    if (!senha) {
      if (!interativo) {
        console.error('Defina ADMIN_SENHA ou execute em um terminal interativo.');
        process.exitCode = 1;
        return;
      }

      senha = await perguntar('Senha (mínimo 12 caracteres): ', true);
      const confirmacao = await perguntar('Repita a senha: ', true);

      if (senha !== confirmacao) {
        console.error('As senhas não coincidem. Nada foi criado.');
        process.exitCode = 1;
        return;
      }
    }

    if (senha.length < 12 || senha.length > 128) {
      console.error('A senha do administrador deve ter entre 12 e 128 caracteres.');
      process.exitCode = 1;
      return;
    }

    const admin = await usuarios.criarAdministrador({ nome, email, senha });
    console.log(`Administrador criado: ${admin.nome} <${admin.email}>`);
  } finally {
    await app.close();
  }
}

await main();
