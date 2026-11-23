import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class SerieDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Carga inválida.' })
  @Min(0, { message: 'Carga inválida.' })
  @Max(1000, { message: 'Carga inválida.' })
  carga?: number;

  @IsOptional()
  @IsInt({ message: 'Repetições inválidas.' })
  @Min(1, { message: 'Repetições inválidas.' })
  @Max(1000, { message: 'Repetições inválidas.' })
  repeticoes?: number;

  /** Segundos (exercício de tempo). */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Tempo inválido.' })
  @Min(0.01, { message: 'Tempo inválido.' })
  @Max(36000, { message: 'Tempo inválido.' })
  valor?: number;
}

export class RegistrarExecucaoDto {
  /** Exercício da ficha ATUAL do aluno logado. */
  @IsInt({ message: 'Exercício inválido.' })
  @Min(1, { message: 'Exercício inválido.' })
  exercicioId!: number;

  /** Minutos (cardio). */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Tempo inválido.' })
  @Min(0.01, { message: 'Tempo inválido.' })
  @Max(1000, { message: 'Tempo inválido.' })
  valor?: number;

  @IsOptional()
  @IsArray({ message: 'Séries inválidas.' })
  @ArrayMaxSize(30, { message: 'O máximo é 30 séries.' })
  @ValidateNested({ each: true })
  @Type(() => SerieDto)
  series?: SerieDto[];
}

/** Corpo da rota antiga POST /treinos (compatibilidade). */
export class RegistrarExecucaoLegadoDto {
  @IsOptional()
  @IsString({ message: 'Treino inválido.' })
  @MaxLength(100, { message: 'Treino inválido.' })
  treino?: string;

  @IsString({ message: 'O exercício não foi informado.' })
  @MaxLength(150, { message: 'Exercício inválido.' })
  exercicio!: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Tempo inválido.' })
  valor?: number;

  @IsOptional()
  @IsArray({ message: 'Séries inválidas.' })
  @ArrayMaxSize(30, { message: 'O máximo é 30 séries.' })
  @ValidateNested({ each: true })
  @Type(() => SerieDto)
  series?: SerieDto[];
}
