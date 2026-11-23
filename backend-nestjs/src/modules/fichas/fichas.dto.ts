import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CriarFichaDto {
  /** Id interno do aluno. Use este OU o e-mail. */
  @IsOptional()
  @IsInt({ message: 'Aluno inválido.' })
  @Min(1, { message: 'Aluno inválido.' })
  alunoId?: number;

  /** E-mail do aluno: serve só para LOCALIZAR o cadastro; a ficha é gravada com o id interno. */
  @IsOptional()
  @Transform(aparar)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  alunoEmail?: string;

  @IsOptional()
  @Transform(aparar)
  @IsString({ message: 'Nome inválido.' })
  @MaxLength(120, { message: 'O nome da ficha aceita até 120 caracteres.' })
  nome?: string;

  /** Substituindo uma ficha: copia os treinos e exercícios da atual para a nova. */
  @IsOptional()
  @IsBoolean({ message: 'Opção inválida.' })
  copiarAtual?: boolean;
}

export class NomeDto {
  @Transform(aparar)
  @IsString({ message: 'Informe o nome.' })
  @Length(1, 120, { message: 'O nome deve ter entre 1 e 120 caracteres.' })
  nome!: string;
}

export const TIPOS_ENTRADA = ['AUTO', 'NORMAL', 'TEMPO', 'CARDIO'] as const;

export class ExercicioDto {
  @Transform(aparar)
  @IsString({ message: 'Informe o nome do exercício.' })
  @Length(1, 150, { message: 'O nome deve ter entre 1 e 150 caracteres.' })
  nome!: string;

  @IsInt({ message: 'Informe o número de séries.' })
  @Min(1, { message: 'Informe o número de séries.' })
  @Max(30, { message: 'O máximo é 30 séries.' })
  series!: number;

  @Transform(aparar)
  @IsString({ message: 'Informe as repetições ou o tempo.' })
  @Length(1, 160, { message: 'Repetições/tempo: de 1 a 160 caracteres.' })
  repeticoes!: string;

  /** AUTO (padrão): deduzido do texto ("segundos" = tempo, "minutos" = cardio). */
  @IsOptional()
  @IsIn([...TIPOS_ENTRADA], { message: 'Tipo de exercício inválido.' })
  tipo?: (typeof TIPOS_ENTRADA)[number];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Carga inválida.' })
  @Min(0, { message: 'Carga inválida.' })
  @Max(1000, { message: 'Carga inválida.' })
  cargaSugerida?: number | null;

  @IsOptional()
  @IsInt({ message: 'Descanso inválido (segundos).' })
  @Min(0, { message: 'Descanso inválido (segundos).' })
  @Max(3600, { message: 'O descanso máximo é 3600 segundos.' })
  descansoSeg?: number | null;

  @IsOptional()
  @Transform(aparar)
  @IsString({ message: 'Observações inválidas.' })
  @MaxLength(1000, { message: 'As observações aceitam até 1000 caracteres.' })
  observacoes?: string | null;
}

export class OrdemDto {
  @IsArray({ message: 'Ordem inválida.' })
  @ArrayNotEmpty({ message: 'Ordem inválida.' })
  @ArrayMaxSize(200, { message: 'Ordem inválida.' })
  @ArrayUnique({ message: 'Ordem inválida.' })
  @IsInt({ each: true, message: 'Ordem inválida.' })
  ids!: number[];
}
