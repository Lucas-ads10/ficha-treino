import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

import {
  dataParaTexto,
  dataValida,
  hojeSaoPaulo,
  paraDataBanco,
} from '../../common/datas.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export class RegistrarPagamentoDto {
  /** Se omitido, usa a mensalidade cadastrada do aluno. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Informe um valor válido.' })
  @Min(0.01, { message: 'Informe um valor válido.' })
  @Max(100000, { message: 'Informe um valor válido.' })
  valor?: number;

  /** YYYY-MM-DD. Se omitido, usa a data de hoje (São Paulo). */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Informe uma data de pagamento válida.' })
  dataPagamento?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Forma de pagamento inválida.' })
  @MaxLength(40, { message: 'Forma de pagamento muito longa.' })
  forma?: string;
}

@Injectable()
export class PagamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(alunoId: number, dto: RegistrarPagamentoDto, adminId: number) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { id: alunoId, usuario: { excluidoEm: null } },
      select: { id: true, mensalidade: true },
    });

    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    const data = dto.dataPagamento ?? hojeSaoPaulo();

    if (!dataValida(data)) {
      throw new BadRequestException('Informe uma data de pagamento válida.');
    }

    if (data > hojeSaoPaulo()) {
      throw new BadRequestException('A data do pagamento não pode estar no futuro.');
    }

    await this.prisma.pagamento.create({
      data: {
        alunoId,
        valor: dto.valor ?? aluno.mensalidade,
        dataPagamento: paraDataBanco(data),
        forma: dto.forma || null,
        registradoPorId: adminId,
      },
    });

    return this.listar(alunoId);
  }

  async listar(alunoId: number) {
    const pagamentos = await this.prisma.pagamento.findMany({
      where: { alunoId },
      orderBy: [{ dataPagamento: 'desc' }, { id: 'desc' }],
    });

    return pagamentos.map((pagamento) => ({
      id: pagamento.id,
      valor: Number(pagamento.valor),
      data: dataParaTexto(pagamento.dataPagamento),
      forma: pagamento.forma,
    }));
  }
}
