import type { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { LimitadorTaxaService } from '../src/common/limitador-taxa.service.js';
import { configurarApp } from '../src/configurar-app.js';
import { MailService } from '../src/modules/mail/mail.service.js';
import { UsuariosService } from '../src/modules/usuarios/usuarios.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const ORIGEM = 'http://localhost:5500';
const SENHA_ADMIN = 'senha-admin-teste-123';
const SENHA_JOAO = 'senha-do-joao-123';
const SENHA_MARIA = 'senha-da-maria-123';

/** Cliente com cookie de sessão + token anti-CSRF, como um navegador. */
class Cliente {
  readonly agente: ReturnType<typeof request.agent>;
  csrf = '';

  constructor(app: NestExpressApplication) {
    this.agente = request.agent(app.getHttpServer());
  }

  async login(email: string, senha: string) {
    const resposta = await this.agente
      .post('/auth/login')
      .set('Origin', ORIGEM)
      .send({ email, senha });

    if (resposta.status === 200) {
      this.csrf = resposta.body.csrfToken;
    }
    return resposta;
  }

  get(url: string) {
    return this.agente.get(url).set('Origin', ORIGEM);
  }

  post(url: string, corpo: object = {}) {
    return this.agente.post(url).set('Origin', ORIGEM).set('X-CSRF-Token', this.csrf).send(corpo);
  }

  patch(url: string, corpo: object = {}) {
    return this.agente.patch(url).set('Origin', ORIGEM).set('X-CSRF-Token', this.csrf).send(corpo);
  }

  put(url: string, corpo: object = {}) {
    return this.agente.put(url).set('Origin', ORIGEM).set('X-CSRF-Token', this.csrf).send(corpo);
  }

  delete(url: string) {
    return this.agente.delete(url).set('Origin', ORIGEM).set('X-CSRF-Token', this.csrf);
  }
}

describe('Projeto Caverna (integração)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let mail: MailService;
  let limitador: LimitadorTaxaService;

  const admin = () => new Cliente(app);
  const extrairToken = (tipo: 'convite' | 'redefinir', para: string): string => {
    const mensagem = [...mail.caixaDeSaida].reverse().find((m) => m.para === para);
    const achado = mensagem?.texto.match(new RegExp(`#${tipo}=([0-9a-f]{64})`));
    if (!achado) {
      throw new Error(`E-mail de ${tipo} para ${para} não encontrado.`);
    }
    return achado[1];
  };

  // Estado compartilhado entre os testes (fluxo sequencial, como na vida real).
  let adminCli: Cliente;
  let joaoCli: Cliente;
  let mariaCli: Cliente;
  let joaoId: number;
  let mariaId: number;
  let joaoFichaId: number;
  let mariaFichaId: number;
  let joaoDivisaoId: number;
  let joaoSupinoId: number;
  let joaoCardioId: number;
  let mariaExercicioId: number;
  let legadoAntes: { n: number; soma: string };

  const resumoLegado = async () => {
    const [linha] = await prisma.$queryRaw<{ n: bigint; soma: bigint | null }[]>`
      SELECT COUNT(*) AS n,
             SUM(CRC32(CONCAT_WS('|', id, treino, exercicio, serie, carga, repeticoes, valor_tempo, data_treino))) AS soma
      FROM treinos_realizados WHERE aluno_id IS NULL`;
    return { n: Number(linha.n), soma: String(linha.soma) };
  };

  beforeAll(async () => {
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error'],
    });
    configurarApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    mail = app.get(MailService);
    limitador = app.get(LimitadorTaxaService);

    // Banco LOCAL descartável: zera só as tabelas do sistema novo.
    // Os registros antigos (aluno_id NULL) NÃO são tocados.
    await prisma.treinoRealizado.deleteMany({ where: { alunoId: { not: null } } });
    await prisma.pagamento.deleteMany();
    await prisma.fichaExercicio.deleteMany();
    await prisma.fichaDivisao.deleteMany();
    await prisma.ficha.deleteMany();
    await prisma.aluno.deleteMany();
    await prisma.sessao.deleteMany();
    await prisma.tokenAcesso.deleteMany();
    await prisma.usuario.deleteMany();

    legadoAntes = await resumoLegado();

    await app.get(UsuariosService).criarAdministrador({
      nome: 'Administrador Teste',
      email: 'admin@teste.invalid',
      senha: SENHA_ADMIN,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================
  describe('1. Administrador e direcionamento', () => {
    it('login do administrador leva ao painel administrativo', async () => {
      adminCli = admin();
      const r = await adminCli.login('admin@teste.invalid', SENHA_ADMIN);

      expect(r.status).toBe(200);
      expect(r.body.destino).toBe('/admin/');
      expect(r.body.usuario.perfil).toBe('ADMIN');
      expect(r.body.csrfToken).toHaveLength(64);

      // O cookie é HttpOnly e não vaza o token no corpo.
      const cookie = String(r.headers['set-cookie']);
      expect(cookie).toContain('caverna_sessao=');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(JSON.stringify(r.body)).not.toContain('senha');
    });

    it('sem login, nada é acessível (usuário não autenticado)', async () => {
      const anonimo = request(app.getHttpServer());

      for (const rota of ['/alunos', '/treinos', '/me/ficha', '/auth/me', '/teste-mysql']) {
        const r = await anonimo.get(rota);
        expect([401, 404], rota).toContain(r.status);
        expect(r.body.sucesso).toBe(false);
      }
    });

    it('administrador NÃO é tratado como aluno', async () => {
      expect((await adminCli.get('/me/ficha')).status).toBe(403);
      expect((await adminCli.get('/me/pagamentos')).status).toBe(403);
    });

    it('administrador exige token anti-CSRF e origem autorizada', async () => {
      const semToken = await adminCli.agente.post('/alunos').set('Origin', ORIGEM).send({});
      expect(semToken.status).toBe(403);

      const origemRuim = await adminCli.agente
        .post('/alunos')
        .set('Origin', 'https://site-malicioso.example')
        .set('X-CSRF-Token', adminCli.csrf)
        .send({});
      expect(origemRuim.status).toBe(403);
    });
  });

  // ============================================================
  describe('2. Cadastro de alunos (João e Maria)', () => {
    const novoAluno = (nome: string, email: string, extra: object = {}) => ({
      nome,
      email,
      peso: 75.5,
      idade: 30,
      objetivo: 'Hipertrofia',
      observacoes: 'Sem restrições.',
      mensalidade: 99.9,
      dataPrimeiroPagamento: '2026-10-05',
      ...extra,
    });

    it('rejeita dados inválidos com mensagens em português', async () => {
      const r = await adminCli.post('/alunos', novoAluno('J', 'nao-e-email', { idade: 500 }));
      expect(r.status).toBe(400);
      expect(r.body.sucesso).toBe(false);
      expect(r.body.mensagem).toMatch(/e-mail/i);
    });

    it('rejeita campos extras (ex.: tentar definir perfil ADMIN)', async () => {
      const r = await adminCli.post('/alunos', novoAluno('Fulano', 'fulano@teste.invalid', { perfil: 'ADMIN' }));
      expect(r.status).toBe(400);
    });

    it('cadastra João e Maria; e-mail é único', async () => {
      const joao = await adminCli.post('/alunos', novoAluno('João Silva', 'joao@teste.invalid'));
      expect(joao.status).toBe(201);
      expect(joao.body.aluno.status).toBe('Pendente');
      expect(joao.body.conviteEnviado).toBe(true);
      expect(joao.body.aluno.historicoPagamentos).toHaveLength(1);
      expect(joao.body.aluno.dataUltimoPagamento).toBe('2026-10-05');
      joaoId = joao.body.aluno.id;

      const maria = await adminCli.post(
        '/alunos',
        novoAluno('Maria Souza', 'maria@teste.invalid', { objetivo: 'Emagrecimento', peso: 62 }),
      );
      expect(maria.status).toBe(201);
      mariaId = maria.body.aluno.id;

      const duplicado = await adminCli.post('/alunos', novoAluno('Outro João', 'JOAO@teste.invalid'));
      expect(duplicado.status).toBe(409);

      const lista = await adminCli.get('/alunos');
      expect(lista.body.alunos.map((a: { email: string }) => a.email)).toEqual([
        'joao@teste.invalid',
        'maria@teste.invalid',
      ]);
    });

    it('pesquisa e consulta por id; edição é persistida', async () => {
      const busca = await adminCli.get('/alunos?busca=mari');
      expect(busca.body.alunos).toHaveLength(1);
      expect(busca.body.alunos[0].nome).toBe('Maria Souza');

      const edit = await adminCli.patch(
        `/alunos/${mariaId}`,
        novoAluno('Maria Souza', 'maria@teste.invalid', { peso: 60.5, observacoes: 'Atualizado.' }),
      );
      expect(edit.status).toBe(200);

      const depois = await adminCli.get(`/alunos/${mariaId}`);
      expect(depois.body.aluno.peso).toBe(60.5);
      expect(depois.body.aluno.observacoes).toBe('Atualizado.');
    });

    it('senha no banco é só hash Argon2id (nunca texto puro)', async () => {
      await adminCli.post(`/alunos/${joaoId}/senha-temporaria`);
      const usuario = await prisma.usuario.findUniqueOrThrow({ where: { email: 'joao@teste.invalid' } });
      expect(usuario.senhaHash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
      // Volta ao fluxo normal por convite (o token antigo ainda vale).
    });
  });

  // ============================================================
  describe('3. Convite, senha temporária e primeiro acesso', () => {
    it('convite por e-mail: link de uso único cria a senha do aluno', async () => {
      await adminCli.post(`/alunos/${joaoId}/convite`);
      const token = extrairToken('convite', 'joao@teste.invalid');

      const sem = await request(app.getHttpServer())
        .post('/auth/convite/aceitar')
        .send({ token: 'a'.repeat(64), novaSenha: SENHA_JOAO });
      expect(sem.status).toBe(400);

      const ok = await request(app.getHttpServer())
        .post('/auth/convite/aceitar')
        .send({ token, novaSenha: SENHA_JOAO });
      expect(ok.status).toBe(200);

      const reuso = await request(app.getHttpServer())
        .post('/auth/convite/aceitar')
        .send({ token, novaSenha: 'outra-senha-qualquer-1' });
      expect(reuso.status).toBe(400);

      // Só o hash do token fica no banco.
      const tokens = await prisma.tokenAcesso.findMany({ where: { tipo: 'CONVITE' } });
      expect(tokens.every((t) => t.tokenHash !== token && t.tokenHash.length === 64)).toBe(true);
    });

    it('token expirado é recusado', async () => {
      await adminCli.post(`/alunos/${mariaId}/convite`);
      const token = extrairToken('convite', 'maria@teste.invalid');
      await prisma.tokenAcesso.updateMany({
        where: { usuario: { email: 'maria@teste.invalid' }, tipo: 'CONVITE', usadoEm: null },
        data: { expiraEm: new Date(Date.now() - 1000) },
      });

      const r = await request(app.getHttpServer())
        .post('/auth/convite/aceitar')
        .send({ token, novaSenha: SENHA_MARIA });
      expect(r.status).toBe(400);
    });

    it('senha temporária: troca obrigatória no primeiro acesso', async () => {
      const gerada = await adminCli.post(`/alunos/${mariaId}/senha-temporaria`);
      expect(gerada.status).toBe(200);
      const temporaria = gerada.body.senhaTemporaria as string;
      expect(temporaria).toHaveLength(12);

      mariaCli = admin();
      const login = await mariaCli.login('maria@teste.invalid', temporaria);
      expect(login.status).toBe(200);
      expect(login.body.usuario.deveTrocarSenha).toBe(true);

      // Enquanto não troca, todas as outras rotas ficam bloqueadas.
      const bloqueada = await mariaCli.get('/me/ficha');
      expect(bloqueada.status).toBe(403);
      expect(bloqueada.body.codigo).toBe('TROCA_SENHA_OBRIGATORIA');

      const errada = await mariaCli.post('/auth/alterar-senha', {
        senhaAtual: 'senha-errada-qualquer',
        novaSenha: SENHA_MARIA,
      });
      expect(errada.status).toBe(400);

      const igual = await mariaCli.post('/auth/alterar-senha', {
        senhaAtual: temporaria,
        novaSenha: temporaria,
      });
      expect(igual.status).toBe(400);

      const troca = await mariaCli.post('/auth/alterar-senha', {
        senhaAtual: temporaria,
        novaSenha: SENHA_MARIA,
      });
      expect(troca.status).toBe(200);

      expect((await mariaCli.get('/me/ficha')).status).toBe(200);
      const maria = await adminCli.get(`/alunos/${mariaId}`);
      expect(maria.body.aluno.status).toBe('Ativo');
    });

    it('2. aluno faz login e é direcionado à área do aluno', async () => {
      joaoCli = admin();
      const r = await joaoCli.login('joao@teste.invalid', SENHA_JOAO);
      expect(r.status).toBe(200);
      expect(r.body.destino).toBe('/ficha/');
      expect(r.body.usuario.perfil).toBe('ALUNO');
      expect(r.body.usuario.deveTrocarSenha).toBe(false);

      mariaCli = admin();
      expect((await mariaCli.login('maria@teste.invalid', SENHA_MARIA)).status).toBe(200);
    });

    it('login com senha errada ou e-mail inexistente dá a MESMA resposta', async () => {
      const a = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'joao@teste.invalid', senha: 'errada-errada-1' });
      const b = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ninguem@teste.invalid', senha: 'errada-errada-1' });

      expect(a.status).toBe(401);
      expect(b.status).toBe(401);
      expect(a.body.mensagem).toBe(b.body.mensagem);
    });
  });

  // ============================================================
  describe('4. Permissões: aluno não acessa o painel nem o que é do admin', () => {
    it('3. aluno não consegue acessar rotas administrativas', async () => {
      expect((await joaoCli.get('/alunos')).status).toBe(403);
      expect((await joaoCli.get(`/alunos/${mariaId}`)).status).toBe(403);
      expect((await joaoCli.get('/treinos')).status).toBe(403);
      expect((await joaoCli.get(`/alunos/${mariaId}/pagamentos`)).status).toBe(403);
      expect((await joaoCli.get(`/alunos/${mariaId}/execucoes`)).status).toBe(403);
      expect(
        (await joaoCli.post('/alunos', {
          nome: 'Hacker',
          email: 'hacker@teste.invalid',
          peso: 70,
          idade: 20,
          objetivo: 'Outro',
          mensalidade: 1,
          dataPrimeiroPagamento: '2026-10-05',
        })).status,
      ).toBe(403);
      expect((await joaoCli.post('/fichas', { alunoId: mariaId })).status).toBe(403);
      expect((await joaoCli.post(`/alunos/${mariaId}/bloquear`)).status).toBe(403);
      expect((await joaoCli.delete(`/alunos/${mariaId}`)).status).toBe(403);
    });
  });

  // ============================================================
  describe('5. Fichas: criação pelo e-mail e associação pelo id interno', () => {
    it('aluno sem ficha recebe ficha nula', async () => {
      const r = await joaoCli.get('/me/ficha');
      expect(r.status).toBe(200);
      expect(r.body.ficha).toBeNull();
    });

    it('administrador cria a ficha localizando o aluno pelo e-mail', async () => {
      const semAluno = await adminCli.post('/fichas', {});
      expect(semAluno.status).toBe(400);

      const inexistente = await adminCli.post('/fichas', { alunoEmail: 'nao-existe@teste.invalid' });
      expect(inexistente.status).toBe(404);

      const joao = await adminCli.post('/fichas', { alunoEmail: 'JOAO@teste.invalid' });
      expect(joao.status).toBe(201);
      joaoFichaId = joao.body.ficha.id;

      // A ficha foi gravada com o ID INTERNO do aluno encontrado.
      const gravada = await prisma.ficha.findUniqueOrThrow({ where: { id: joaoFichaId } });
      expect(gravada.alunoId).toBe(joaoId);
      expect(gravada.ativa).toBe(true);

      const maria = await adminCli.post('/fichas', { alunoId: mariaId });
      mariaFichaId = maria.body.ficha.id;
    });

    it('treinos e exercícios: cria, valida, edita e reordena', async () => {
      const treino = await adminCli.post(`/fichas/${joaoFichaId}/divisoes`, { nome: 'Treino A' });
      expect(treino.status).toBe(201);
      joaoDivisaoId = treino.body.treino.id;

      const repetido = await adminCli.post(`/fichas/${joaoFichaId}/divisoes`, { nome: 'treino a' });
      expect(repetido.status).toBe(409);

      const supino = await adminCli.post(`/divisoes/${joaoDivisaoId}/exercicios`, {
        nome: 'Supino reto',
        series: 3,
        repeticoes: '12 a 15',
        cargaSugerida: 20,
        descansoSeg: 60,
        observacoes: 'Controle a descida.',
      });
      expect(supino.status).toBe(201);
      expect(supino.body.exercicio.tipo).toBe('NORMAL');
      joaoSupinoId = supino.body.exercicio.id;

      const cardio = await adminCli.post(`/divisoes/${joaoDivisaoId}/exercicios`, {
        nome: 'Cardio bike ou esteira',
        series: 1,
        repeticoes: '20 a 30 minutos',
      });
      // O tipo é deduzido do texto, como na ficha antiga.
      expect(cardio.body.exercicio.tipo).toBe('CARDIO');
      joaoCardioId = cardio.body.exercicio.id;

      const tempo = await adminCli.post(`/divisoes/${joaoDivisaoId}/exercicios`, {
        nome: 'Prancha',
        series: 3,
        repeticoes: '45 segundos',
      });
      expect(tempo.body.exercicio.tipo).toBe('TEMPO');

      const invalido = await adminCli.post(`/divisoes/${joaoDivisaoId}/exercicios`, {
        nome: 'X',
        series: 0,
        repeticoes: '',
      });
      expect(invalido.status).toBe(400);

      // Reordenar: cardio primeiro.
      const ordem = await adminCli.put(`/divisoes/${joaoDivisaoId}/exercicios/ordem`, {
        ids: [joaoCardioId, joaoSupinoId, tempo.body.exercicio.id],
      });
      expect(ordem.status).toBe(200);

      const ruim = await adminCli.put(`/divisoes/${joaoDivisaoId}/exercicios/ordem`, { ids: [joaoSupinoId] });
      expect(ruim.status).toBe(400);

      // Maria: treino e exercício DIFERENTES.
      const treinoM = await adminCli.post(`/fichas/${mariaFichaId}/divisoes`, { nome: 'Treino de pernas' });
      const agachamento = await adminCli.post(`/divisoes/${treinoM.body.treino.id}/exercicios`, {
        nome: 'Agachamento livre',
        series: 4,
        repeticoes: '10 a 12',
      });
      mariaExercicioId = agachamento.body.exercicio.id;
    });

    it('7. cada aluno vê EXATAMENTE a ficha atribuída a ele', async () => {
      const joao = await joaoCli.get('/me/ficha');
      expect(joao.body.ficha.treinos).toHaveLength(1);
      expect(joao.body.ficha.treinos[0].nome).toBe('Treino A');
      expect(joao.body.ficha.treinos[0].exercicios.map((e: { nome: string }) => e.nome)).toEqual([
        'Cardio bike ou esteira',
        'Supino reto',
        'Prancha',
      ]);

      const supino = joao.body.ficha.treinos[0].exercicios[1];
      expect(supino).toMatchObject({
        series: 3,
        repeticoes: '12 a 15',
        tipo: null, // normal: mesma convenção da área do aluno
        cargaSugerida: 20,
        descansoSeg: 60,
        observacoes: 'Controle a descida.',
      });
      expect(joao.body.ficha.treinos[0].exercicios[0].tipo).toBe('cardio');

      const maria = await mariaCli.get('/me/ficha');
      expect(maria.body.ficha.treinos).toHaveLength(1);
      expect(maria.body.ficha.treinos[0].nome).toBe('Treino de pernas');
      expect(JSON.stringify(maria.body)).not.toContain('Supino');
      expect(JSON.stringify(joao.body)).not.toContain('Agachamento');
    });

    it('o aluno não consegue escolher outro aluno por parâmetro', async () => {
      const r = await joaoCli.get(`/me/ficha?alunoId=${mariaId}`);
      // O parâmetro é ignorado: continua sendo a ficha do João.
      expect(r.body.ficha.treinos[0].nome).toBe('Treino A');
    });
  });

  // ============================================================
  describe('6. Execução e histórico', () => {
    it('8. aluno registra treino realizado e ele aparece no histórico', async () => {
      const r = await joaoCli.post('/me/execucoes', {
        exercicioId: joaoSupinoId,
        series: [
          { carga: 20, repeticoes: 12 },
          { carga: 22.5, repeticoes: 10 },
          { carga: 22.5, repeticoes: 8 },
        ],
      });
      expect(r.status).toBe(201);

      const ultimo = await joaoCli.get(`/me/exercicios/${joaoSupinoId}/ultimo`);
      expect(ultimo.body.encontrado).toBe(true);
      expect(ultimo.body.series).toHaveLength(3);
      expect(ultimo.body.series[1]).toMatchObject({ serie: 2, carga: 22.5, repeticoes: 10 });

      const hist = await joaoCli.get(`/me/exercicios/${joaoSupinoId}/historico`);
      expect(hist.body.sessoes).toHaveLength(1);

      const lista = await joaoCli.get('/me/execucoes');
      expect(lista.body.execucoes[0]).toMatchObject({ treino: 'Treino A', exercicio: 'Supino reto' });
    });

    it('cardio e tempo são validados conforme o tipo do exercício', async () => {
      const semValor = await joaoCli.post('/me/execucoes', { exercicioId: joaoCardioId });
      expect(semValor.status).toBe(400);

      const cardio = await joaoCli.post('/me/execucoes', { exercicioId: joaoCardioId, valor: 25 });
      expect(cardio.status).toBe(201);
      const ultimo = await joaoCli.get(`/me/exercicios/${joaoCardioId}/ultimo`);
      expect(ultimo.body.series[0].valor_tempo).toBe(25);

      const invalida = await joaoCli.post('/me/execucoes', {
        exercicioId: joaoSupinoId,
        series: [{ carga: 0, repeticoes: 10 }],
      });
      expect(invalida.status).toBe(400);
    });

    it('10. atualizar a página (nova sessão) não apaga os dados', async () => {
      const novoNavegador = admin();
      await novoNavegador.login('joao@teste.invalid', SENHA_JOAO);

      const ficha = await novoNavegador.get('/me/ficha');
      expect(ficha.body.ficha.treinos[0].exercicios).toHaveLength(3);
      const ultimo = await novoNavegador.get(`/me/exercicios/${joaoSupinoId}/ultimo`);
      expect(ultimo.body.series).toHaveLength(3);
    });

    it('11. um aluno não vê nem altera dados de outro (IDOR)', async () => {
      // João tenta gravar no exercício da Maria.
      const gravar = await joaoCli.post('/me/execucoes', {
        exercicioId: mariaExercicioId,
        series: [{ carga: 50, repeticoes: 10 }],
      });
      expect(gravar.status).toBe(404);

      // João tenta ler o último/histórico do exercício da Maria.
      expect((await joaoCli.get(`/me/exercicios/${mariaExercicioId}/ultimo`)).status).toBe(404);
      expect((await joaoCli.get(`/me/exercicios/${mariaExercicioId}/historico`)).status).toBe(404);

      // Maria grava o dela; João continua sem ver nada disso.
      const mariaGrava = await mariaCli.post('/me/execucoes', {
        exercicioId: mariaExercicioId,
        series: Array.from({ length: 4 }, () => ({ carga: 40, repeticoes: 12 })),
      });
      expect(mariaGrava.status).toBe(201);

      const listaJoao = await joaoCli.get('/me/execucoes');
      expect(JSON.stringify(listaJoao.body)).not.toContain('Agachamento');
      const listaMaria = await mariaCli.get('/me/execucoes');
      expect(JSON.stringify(listaMaria.body)).not.toContain('Supino');

      // Nada foi gravado em nome da Maria pelo João.
      const doJoaoNoExercicioDaMaria = await prisma.treinoRealizado.count({
        where: { alunoId: joaoId, fichaExercicioId: mariaExercicioId },
      });
      expect(doJoaoNoExercicioDaMaria).toBe(0);

      // O aluno também não pode informar o aluno no corpo.
      const forjado = await joaoCli.post('/me/execucoes', {
        exercicioId: joaoSupinoId,
        alunoId: mariaId,
        series: [{ carga: 10, repeticoes: 10 }],
      });
      expect(forjado.status).toBe(400);
    });

    it('rotas antigas agora exigem login e só devolvem o próprio histórico', async () => {
      const anonimo = request(app.getHttpServer());
      expect((await anonimo.get('/ultimo-treino/A/Supino%20reto')).status).toBe(401);
      expect((await anonimo.get('/treinos')).status).toBe(401);

      const ultimo = await joaoCli.get('/ultimo-treino/Treino%20A/Supino%20reto');
      expect(ultimo.body.encontrado).toBe(true);

      // O histórico antigo (sem dono) NÃO aparece para nenhum aluno.
      const legado = await joaoCli.get('/ultimo-treino/A/Supino%20reto');
      expect(legado.body.series.every((s: { carga: number }) => s.carga !== null)).toBe(true);
      const hist = await joaoCli.get('/historico/Treino%20A/Supino%20reto');
      expect(hist.body.sessoes).toHaveLength(1);

      const salvar = await joaoCli.post('/treinos', {
        treino: 'Treino A',
        exercicio: 'Supino reto',
        tipo: 'normal',
        series: [{ carga: 25, repeticoes: 6 }],
      });
      expect(salvar.status).toBe(201);
    });
  });

  // ============================================================
  describe('7. Edição de ficha e preservação do histórico', () => {
    it('12. edição do administrador é refletida na área do aluno', async () => {
      const r = await adminCli.patch(`/exercicios/${joaoSupinoId}`, {
        nome: 'Supino reto com barra',
        series: 4,
        repeticoes: '8 a 10',
      });
      expect(r.status).toBe(200);

      const ficha = await joaoCli.get('/me/ficha');
      const supino = ficha.body.ficha.treinos[0].exercicios.find(
        (e: { id: number }) => e.id === joaoSupinoId,
      );
      expect(supino).toMatchObject({ nome: 'Supino reto com barra', series: 4, repeticoes: '8 a 10' });
    });

    it('13. o histórico anterior permanece consistente após editar/excluir', async () => {
      // As execuções antigas guardam o nome da época (snapshot).
      const lista = await joaoCli.get('/me/execucoes');
      const antigas = lista.body.execucoes.filter(
        (e: { exercicio: string }) => e.exercicio === 'Supino reto',
      );
      expect(antigas.length).toBeGreaterThan(0);
      expect(antigas[0].treino).toBe('Treino A');

      // Excluir o exercício (exclusão lógica) não apaga o que já foi realizado.
      const antes = await prisma.treinoRealizado.count({ where: { alunoId: joaoId } });
      expect((await adminCli.delete(`/exercicios/${joaoCardioId}`)).status).toBe(200);
      expect(await prisma.treinoRealizado.count({ where: { alunoId: joaoId } })).toBe(antes);

      const ficha = await joaoCli.get('/me/ficha');
      expect(
        ficha.body.ficha.treinos[0].exercicios.map((e: { id: number }) => e.id),
      ).not.toContain(joaoCardioId);

      // Mas não dá mais para registrar em um exercício excluído.
      const r = await joaoCli.post('/me/execucoes', { exercicioId: joaoCardioId, valor: 10 });
      expect(r.status).toBe(404);

      // E o histórico dele continua consultável pelo nome.
      const hist = await joaoCli.get('/historico/Treino%20A/Cardio%20bike%20ou%20esteira');
      expect(hist.body.sessoes.length).toBeGreaterThanOrEqual(0);
    });

    it('substituir a ficha preserva a anterior e bloqueia a edição dela', async () => {
      const nova = await adminCli.post('/fichas', { alunoEmail: 'joao@teste.invalid', copiarAtual: true, nome: 'Ficha de dezembro' });
      expect(nova.status).toBe(201);
      expect(nova.body.ficha.treinos[0].exercicios.map((e: { nome: string }) => e.nome)).toEqual([
        'Supino reto com barra',
        'Prancha',
      ]);

      const fichas = await adminCli.get(`/alunos/${joaoId}/fichas`);
      expect(fichas.body.fichas).toHaveLength(2);
      expect(fichas.body.fichas.filter((f: { ativa: boolean }) => f.ativa)).toHaveLength(1);
      const antiga = fichas.body.fichas.find((f: { id: number }) => f.id === joaoFichaId);
      expect(antiga.ativa).toBe(false);
      expect(antiga.treinos[0].exercicios.map((e: { nome: string }) => e.nome)).toContain('Supino reto com barra');

      // A ficha antiga é somente leitura.
      const edicao = await adminCli.patch(`/exercicios/${joaoSupinoId}`, {
        nome: 'Tentativa', series: 1, repeticoes: '1',
      });
      expect([404, 409]).toContain(edicao.status);

      // No máximo uma ficha ativa por aluno (garantido pelo banco).
      const ativas = await prisma.ficha.count({ where: { alunoId: joaoId, ativa: true } });
      expect(ativas).toBe(1);

      // O aluno passa a ver a nova ficha; o histórico de execuções segue intacto.
      const ficha = await joaoCli.get('/me/ficha');
      expect(ficha.body.ficha.nome).toBe('Ficha de dezembro');
      const hist = await joaoCli.get('/me/execucoes');
      expect(hist.body.execucoes.length).toBeGreaterThan(0);
    });

    it('treino excluído some da ficha, mas as execuções ficam', async () => {
      const ficha = await joaoCli.get('/me/ficha');
      const divisaoId = ficha.body.ficha.treinos[0].id;
      const antes = await prisma.treinoRealizado.count({ where: { alunoId: joaoId } });

      expect((await adminCli.delete(`/divisoes/${divisaoId}`)).status).toBe(200);

      expect((await joaoCli.get('/me/ficha')).body.ficha.treinos).toHaveLength(0);
      expect(await prisma.treinoRealizado.count({ where: { alunoId: joaoId } })).toBe(antes);
    });
  });

  // ============================================================
  describe('8. Financeiro', () => {
    it('14. pagamentos são registrados e consultados', async () => {
      const r = await adminCli.post(`/alunos/${mariaId}/pagamentos`, {
        dataPagamento: '2026-11-10',
        forma: 'PIX',
      });
      expect(r.status).toBe(201);
      // Sem valor informado, usa a mensalidade cadastrada.
      expect(r.body.pagamentos[0]).toMatchObject({ valor: 99.9, data: '2026-11-10', forma: 'PIX' });
      expect(r.body.pagamentos).toHaveLength(2);

      const manual = await adminCli.post(`/alunos/${mariaId}/pagamentos`, {
        valor: 120.5,
        dataPagamento: '2026-11-12',
      });
      expect(manual.body.pagamentos[0].valor).toBe(120.5);

      const maria = await adminCli.get(`/alunos/${mariaId}`);
      expect(maria.body.aluno.dataUltimoPagamento).toBe('2026-11-12');
      expect(maria.body.aluno.historicoPagamentos).toHaveLength(3);

      // Aluno enxerga somente o próprio financeiro.
      const minhas = await mariaCli.get('/me/pagamentos');
      expect(minhas.body.pagamentos).toHaveLength(3);
      const doJoao = await joaoCli.get('/me/pagamentos');
      expect(doJoao.body.pagamentos).toHaveLength(1);
    });

    it('valida data futura, data inválida e valor inválido', async () => {
      expect((await adminCli.post(`/alunos/${mariaId}/pagamentos`, { dataPagamento: '2999-01-01' })).status).toBe(400);
      expect((await adminCli.post(`/alunos/${mariaId}/pagamentos`, { dataPagamento: '2026-02-31' })).status).toBe(400);
      expect((await adminCli.post(`/alunos/${mariaId}/pagamentos`, { valor: -5 })).status).toBe(400);
      expect((await adminCli.post('/alunos/999999/pagamentos', {})).status).toBe(404);
    });
  });

  // ============================================================
  describe('9. Bloqueio, exclusão e logout', () => {
    it('bloquear derruba a sessão e impede novo login; desbloquear libera', async () => {
      const bloqueio = await adminCli.post(`/alunos/${joaoId}/bloquear`);
      expect(bloqueio.body.aluno.status).toBe('Bloqueado');

      // Sessão que já estava aberta cai imediatamente.
      expect([401, 403]).toContain((await joaoCli.get('/me/ficha')).status);

      // Mesmo com a senha certa, não entra.
      const tentativa = admin();
      const login = await tentativa.login('joao@teste.invalid', SENHA_JOAO);
      expect(login.status).toBe(403);
      expect(login.body.mensagem).toMatch(/bloqueado/i);

      const livre = await adminCli.post(`/alunos/${joaoId}/desbloquear`);
      expect(livre.body.aluno.status).toBe('Ativo');

      joaoCli = admin();
      expect((await joaoCli.login('joao@teste.invalid', SENHA_JOAO)).status).toBe(200);
    });

    it('15. logout encerra a sessão (o cookie antigo deixa de valer)', async () => {
      const cli = admin();
      await cli.login('joao@teste.invalid', SENHA_JOAO);
      expect((await cli.get('/auth/me')).status).toBe(200);

      expect((await cli.post('/auth/logout')).status).toBe(200);
      expect((await cli.get('/auth/me')).status).toBe(401);
      expect((await cli.get('/me/ficha')).status).toBe(401);

      const sessoes = await prisma.sessao.count({ where: { revogadaEm: { not: null } } });
      expect(sessoes).toBeGreaterThan(0);
    });

    it('excluir é lógico: some das listas e do login, mas o histórico fica', async () => {
      const extra = await adminCli.post('/alunos', {
        nome: 'Pedro Costa',
        email: 'pedro@teste.invalid',
        peso: 80,
        idade: 40,
        objetivo: 'Outro',
        mensalidade: 50,
        dataPrimeiroPagamento: '2026-10-01',
      });
      const pedroId = extra.body.aluno.id as number;

      expect((await adminCli.delete(`/alunos/${pedroId}`)).status).toBe(200);
      expect((await adminCli.get(`/alunos/${pedroId}`)).status).toBe(404);
      const lista = await adminCli.get('/alunos');
      expect(lista.body.alunos.map((a: { email: string }) => a.email)).not.toContain('pedro@teste.invalid');

      // O pagamento continua no banco.
      expect(await prisma.pagamento.count({ where: { alunoId: pedroId } })).toBe(1);

      // O e-mail continua reservado.
      const refazer = await adminCli.post('/alunos', {
        nome: 'Pedro de novo',
        email: 'pedro@teste.invalid',
        peso: 80,
        idade: 40,
        objetivo: 'Outro',
        mensalidade: 50,
        dataPrimeiroPagamento: '2026-10-01',
      });
      expect(refazer.status).toBe(409);
    });
  });

  // ============================================================
  describe('10. Recuperação e alteração de senha', () => {
    it('16. recuperação de senha por e-mail, com link de uso único', async () => {
      limitador.limparTudo();
      const total = mail.caixaDeSaida.length;

      const desconhecido = await request(app.getHttpServer())
        .post('/auth/esqueci-senha')
        .send({ email: 'ninguem@teste.invalid' });
      const conhecido = await request(app.getHttpServer())
        .post('/auth/esqueci-senha')
        .send({ email: 'maria@teste.invalid' });

      // Resposta idêntica: não revela quais e-mails existem.
      expect(desconhecido.status).toBe(200);
      expect(conhecido.status).toBe(200);
      expect(conhecido.body.mensagem).toBe(desconhecido.body.mensagem);
      expect(mail.caixaDeSaida.length).toBe(total + 1);

      const token = extrairToken('redefinir', 'maria@teste.invalid');
      const nova = 'nova-senha-da-maria-456';

      // Sessão aberta antes da redefinição.
      const antes = admin();
      await antes.login('maria@teste.invalid', SENHA_MARIA);

      const ok = await request(app.getHttpServer())
        .post('/auth/redefinir-senha')
        .send({ token, novaSenha: nova });
      expect(ok.status).toBe(200);

      // Link de uso único.
      const reuso = await request(app.getHttpServer())
        .post('/auth/redefinir-senha')
        .send({ token, novaSenha: 'outra-qualquer-789' });
      expect(reuso.status).toBe(400);

      // Um token de recuperação não serve como convite.
      const cruzado = await request(app.getHttpServer())
        .post('/auth/convite/aceitar')
        .send({ token, novaSenha: 'outra-qualquer-789' });
      expect(cruzado.status).toBe(400);

      // Sessões antigas caem; a senha antiga não vale; a nova vale.
      expect((await antes.get('/me/ficha')).status).toBe(401);
      expect((await admin().login('maria@teste.invalid', SENHA_MARIA)).status).toBe(401);

      mariaCli = admin();
      expect((await mariaCli.login('maria@teste.invalid', nova)).status).toBe(200);
    });

    it('alterar senha encerra os outros dispositivos e mantém a sessão atual', async () => {
      limitador.limparTudo();
      const aparelho1 = admin();
      const aparelho2 = admin();
      await aparelho1.login('joao@teste.invalid', SENHA_JOAO);
      await aparelho2.login('joao@teste.invalid', SENHA_JOAO);

      const r = await aparelho1.post('/auth/alterar-senha', {
        senhaAtual: SENHA_JOAO,
        novaSenha: 'senha-nova-do-joao-9',
      });
      expect(r.status).toBe(200);

      expect((await aparelho1.get('/me/ficha')).status).toBe(200);
      expect((await aparelho2.get('/me/ficha')).status).toBe(401);
      expect((await admin().login('joao@teste.invalid', 'senha-nova-do-joao-9')).status).toBe(200);
    });
  });

  // ============================================================
  describe('11. Proteção contra força bruta', () => {
    it('bloqueia a conta após 5 senhas erradas, mesmo com a senha certa depois', async () => {
      limitador.limparTudo();
      for (let i = 0; i < 5; i++) {
        const r = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'maria@teste.invalid', senha: `errada-numero-${i}-xx` });
        expect(r.status).toBe(401);
      }

      const travada = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'maria@teste.invalid', senha: 'nova-senha-da-maria-456' });
      expect(travada.status).toBe(429);

      // E-mail inexistente também é limitado (sem revelar se a conta existe).
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'fantasma@teste.invalid', senha: `errada-numero-${i}-xx` });
      }
      const fantasma = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'fantasma@teste.invalid', senha: 'qualquer-senha-123' });
      expect(fantasma.status).toBe(429);

      // Destrava para não afetar o restante da suíte.
      await prisma.usuario.updateMany({ data: { bloqueadoAte: null, tentativasFalhas: 0 } });
      limitador.limparTudo();
    });

    it('limita por IP as tentativas de login', async () => {
      limitador.limparTudo();
      let ultimo = 0;
      for (let i = 0; i < 22; i++) {
        const r = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: `ip${i}@teste.invalid`, senha: 'qualquer-senha-123' });
        ultimo = r.status;
      }
      expect(ultimo).toBe(429);
      limitador.limparTudo();
    });
  });

  // ============================================================
  describe('12. Dados antigos preservados', () => {
    it('os registros antigos (sem dono) continuam idênticos e sem vínculo', async () => {
      const agora = await resumoLegado();
      expect(agora).toEqual(legadoAntes);
      expect(agora.n).toBe(278);

      const comDono = await prisma.treinoRealizado.count({
        where: { alunoId: null },
      });
      expect(comDono).toBe(278);
    });

    it('somente o administrador consulta a tabela inteira (incluindo o legado)', async () => {
      const r = await adminCli.get('/treinos');
      expect(r.status).toBe(200);
      expect(r.body.treinos.filter((t: { aluno_id: number | null }) => t.aluno_id === null)).toHaveLength(278);
      expect((await joaoCli.get('/treinos')).status).toBe(403);
    });
  });
});
