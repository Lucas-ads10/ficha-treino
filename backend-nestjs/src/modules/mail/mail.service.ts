import { Injectable, Logger } from '@nestjs/common';

import { urlFrontend } from '../../common/ambiente.js';

export interface MensagemEmail {
  para: string;
  assunto: string;
  texto: string;
  html: string;
}

type Provedor = 'none' | 'resend' | 'memory';

const escapar = (texto: string): string =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Envio de e-mails (convite e recuperação de senha).
 *
 * MAIL_PROVIDER:
 *   none   (padrão) não envia nada; o administrador usa a senha temporária.
 *   resend envia pela API do Resend (precisa de RESEND_API_KEY e MAIL_FROM).
 *   memory guarda as mensagens em memória. SÓ para testes automatizados.
 *
 * Os links (com token) e as senhas NUNCA vão para o log.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /** Mensagens "enviadas" quando MAIL_PROVIDER=memory (testes). */
  readonly caixaDeSaida: MensagemEmail[] = [];

  private provedor(): Provedor {
    const valor = (process.env.MAIL_PROVIDER ?? 'none').toLowerCase();
    return valor === 'resend' || valor === 'memory' ? valor : 'none';
  }

  configurado(): boolean {
    const provedor = this.provedor();

    if (provedor === 'resend') {
      return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
    }

    return provedor === 'memory';
  }

  async enviarConvite(para: string, nome: string, token: string): Promise<boolean> {
    const link = `${urlFrontend()}/#convite=${token}`;

    return this.enviar({
      para,
      assunto: 'Caverna Centro de Treinamento: crie sua senha',
      texto:
        `Olá, ${nome}!\n\nSeu acesso à Caverna Centro de Treinamento foi criado.\n` +
        `Crie sua senha pelo link abaixo (válido por 48 horas e de uso único):\n\n${link}\n`,
      html:
        `<p>Olá, ${escapar(nome)}!</p><p>Seu acesso à <strong>Caverna Centro de Treinamento</strong> foi criado.</p>` +
        `<p><a href="${link}">Criar minha senha</a></p><p>O link vale por 48 horas e só pode ser usado uma vez.</p>`,
    });
  }

  async enviarRecuperacao(para: string, nome: string, token: string): Promise<boolean> {
    const link = `${urlFrontend()}/#redefinir=${token}`;

    return this.enviar({
      para,
      assunto: 'Caverna Centro de Treinamento: redefinição de senha',
      texto:
        `Olá, ${nome}!\n\nRecebemos um pedido para redefinir sua senha.\n` +
        `Use o link abaixo (válido por 1 hora e de uso único):\n\n${link}\n\n` +
        `Se não foi você, ignore este e-mail.\n`,
      html:
        `<p>Olá, ${escapar(nome)}!</p><p>Recebemos um pedido para redefinir sua senha.</p>` +
        `<p><a href="${link}">Redefinir minha senha</a></p>` +
        `<p>O link vale por 1 hora e só pode ser usado uma vez. Se não foi você, ignore este e-mail.</p>`,
    });
  }

  /** Retorna true se a mensagem foi entregue ao provedor. Nunca lança erro. */
  private async enviar(mensagem: MensagemEmail): Promise<boolean> {
    const provedor = this.provedor();

    if (provedor === 'memory') {
      this.caixaDeSaida.push(mensagem);
      return true;
    }

    if (provedor === 'none' || !this.configurado()) {
      this.logger.warn(
        'E-mail não enviado: MAIL_PROVIDER não está configurado (use a senha temporária).',
      );
      return false;
    }

    try {
      const resposta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM,
          to: [mensagem.para],
          subject: mensagem.assunto,
          text: mensagem.texto,
          html: mensagem.html,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!resposta.ok) {
        // Só o status: o corpo/URL podem conter dados da mensagem.
        this.logger.error(`Falha ao enviar e-mail (HTTP ${resposta.status}).`);
        return false;
      }

      return true;
    } catch (erro) {
      this.logger.error(
        `Falha ao enviar e-mail: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`,
      );
      return false;
    }
  }
}
