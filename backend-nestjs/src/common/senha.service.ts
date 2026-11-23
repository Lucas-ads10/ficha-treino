
import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';

// Parâmetros Argon2id recomendados pela OWASP.
const MEMORIA_KIB = 19456;
const PASSES = 2;
const PARALELISMO = 1;
const TAMANHO_HASH = 32;

const b64 = (buffer: Buffer): string =>
  buffer.toString('base64').replace(/=+$/, '');

@Injectable()
export class SenhaService {
  async gerarHash(senha: string): Promise<string> {
    return argon2.hash(senha, {
      type: argon2.argon2id,
      memoryCost: MEMORIA_KIB,
      timeCost: PASSES,
      parallelism: PARALELISMO,
      hashLength: TAMANHO_HASH,
      salt: randomBytes(16),
    });
  }

  async verificar(
    senha: string,
    phc: string | null,
  ): Promise<boolean> {
    // Mesmo quando não existe senha cadastrada, executa uma
    // verificação Argon2 para reduzir diferenças de tempo.
    const hash = phc ?? HASH_FALSO;

    try {
      const confere = await argon2.verify(hash, senha);
      return phc !== null && confere;
    } catch {
      // Hash inválido ou malformado.
      return false;
    }
  }
}

// Hash descartável para verificações de contas sem senha.
const HASH_FALSO =
  `$argon2id$v=19$m=${MEMORIA_KIB},t=${PASSES},p=${PARALELISMO}` +
  `$${b64(Buffer.alloc(16, 7))}` +
  `$${b64(Buffer.alloc(TAMANHO_HASH, 9))}`;

// ------------------------------------------------------------
// Tokens aleatórios
// ------------------------------------------------------------

/** Token aleatório de 256 bits (hex). */
export function gerarToken(): string {
  return randomBytes(32).toString('hex');
}

/** Armazena somente o SHA-256 do token. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Comparação de strings em tempo constante. */
export function iguaisSeguro(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  return (
    bufA.length === bufB.length &&
    timingSafeEqual(bufA, bufB)
  );
}

// Sem caracteres ambíguos (0/O, 1/l/I).
const ALFABETO =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export function gerarSenhaTemporaria(tamanho = 12): string {
  let senha = '';

  for (let i = 0; i < tamanho; i++) {
    senha += ALFABETO[randomInt(ALFABETO.length)];
  }

  return senha;
}
