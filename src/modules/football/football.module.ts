import { Module } from '@nestjs/common';
import { FootballService } from './football.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [HttpModule],
  providers: [FootballService, ConfigService],
  exports: [FootballService],
})
export class FootballModule {}
