
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool } from 'mysql2/promise';

@Module({
  providers: [
    {
      provide: 'MYSQL_POOL',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return createPool({
          host: configService.get<string>('DB_HOST'),
          user: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          port: Number(configService.get<string>('DB_PORT')) || 3306,
          ssl: { rejectUnauthorized: false },
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
      },
    },
  ],
  exports: ['MYSQL_POOL'],
})
export class DatabaseModule {}
