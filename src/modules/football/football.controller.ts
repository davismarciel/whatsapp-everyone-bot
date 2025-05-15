import { Controller, Get, Query } from '@nestjs/common';
import { FootballService } from './football.service';

@Controller('football')
export class FootballController {
  constructor(private readonly footballService: FootballService) {}

  @Get('current-matchday')
  async getCurrentMatchday() {
    return this.footballService.getCurrentMatchday();
  }

  @Get('matchday-results')
  async getMatchdayResults(@Query('matchday') matchday: string) {
    return this.footballService.getMatchdayResults(Number(matchday));
  }

  @Get('standings')
  async getStandings() {
    return this.footballService.getStandings();
  }

  @Get('top-scorers')
  async getTopScorers() {
    return this.footballService.getTopScorers();
  }

  @Get('upcoming-matches')
  async getUpcomingMatches() {
    return this.footballService.getUpcomingMatches();
  }
}
