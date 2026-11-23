import { Module } from '@nestjs/common';

import { MailService } from './mail.service.js';

/** MailModule: envio de convites e de recuperação de senha. */
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
