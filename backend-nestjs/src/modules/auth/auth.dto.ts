import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const MSG_SENHA = 'A senha deve ter entre 8 e 128 caracteres.';

export class LoginDto {
  @Transform(aparar)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(190, { message: 'E-mail muito longo.' })
  email!: string;

  @IsString({ message: 'Informe a senha.' })
  @Length(1, 128, { message: 'Informe a senha.' })
  senha!: string;
}

export class AlterarSenhaDto {
  @IsString({ message: 'Informe a senha atual.' })
  @Length(1, 128, { message: 'Informe a senha atual.' })
  senhaAtual!: string;

  @IsString({ message: MSG_SENHA })
  @Length(8, 128, { message: MSG_SENHA })
  novaSenha!: string;
}

export class EsqueciSenhaDto {
  @Transform(aparar)
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(190, { message: 'E-mail muito longo.' })
  email!: string;
}

export class TokenSenhaDto {
  @IsString({ message: 'Link inválido.' })
  @Length(64, 64, { message: 'Link inválido ou expirado.' })
  token!: string;

  @IsString({ message: MSG_SENHA })
  @Length(8, 128, { message: MSG_SENHA })
  novaSenha!: string;
}
