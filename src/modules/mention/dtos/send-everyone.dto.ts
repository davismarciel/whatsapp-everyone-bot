import { IsNotEmpty, IsString } from 'class-validator';

export class SendEveryoneDto {
  @IsNotEmpty()
  @IsString()
  instance: string;

  @IsNotEmpty()
  @IsString()
  groupJid: string;
}
