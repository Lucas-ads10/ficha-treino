import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Mesmas opções do campo "Objetivo" do painel administrativo.
export const OBJETIVOS = [
  'Emagrecimento',
  'Hipertrofia',
  'Condicionamento físico',
  'Saúde e qualidade de vida',
  'Condicionamento e resistência',
  'Outro',
] as const;

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class AtualizarAlunoDto {
  @Transform(aparar)
  @IsString({ message: 'Informe o nome.' })
  @Length(2, 120, { message: 'O nome deve ter entre 2 e 120 caracteres.' })
  nome!: string;

  @Transform(aparar)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(190, { message: 'E-mail muito longo.' })
  email!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Informe um peso válido.' })
  @Min(1, { message: 'Informe um peso válido.' })
  @Max(500, { message: 'Informe um peso válido.' })
  peso!: number;

  @IsInt({ message: 'Informe uma idade válida.' })
  @Min(1, { message: 'Informe uma idade válida.' })
  @Max(120, { message: 'Informe uma idade válida.' })
  idade!: number;

  @IsIn([...OBJETIVOS], { message: 'Selecione um objetivo válido.' })
  objetivo!: string;

  @IsOptional()
  @Transform(aparar)
  @IsString({ message: 'Observações inválidas.' })
  @MaxLength(2000, { message: 'As observações aceitam até 2000 caracteres.' })
  observacoes?: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Informe um valor de mensalidade válido.' })
  @Min(0.01, { message: 'Informe um valor de mensalidade válido.' })
  @Max(100000, { message: 'Informe um valor de mensalidade válido.' })
  mensalidade!: number;
}

export class CriarAlunoDto extends AtualizarAlunoDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Informe a data do primeiro vencimento.',
  })
  dataPrimeiroPagamento!: string;
}
