import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { commandCache } from 'src/shared/cache/lru-cache';
import { commandTtls } from 'src/shared/cache/cache-config';

@Injectable()
export class FootballService {
  private readonly baseUrl = 'https://api.football-data.org/v4';
  private readonly logger = new Logger(FootballService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async getCurrentMatchday(): Promise<number> {
    const token = this.config.get<string>('FOOTBALL_API_TOKEN');

    const res = await firstValueFrom(
      this.http.get(`${this.baseUrl}/competitions/BSA/standings`, {
        headers: { 'X-Auth-Token': token },
      }),
    );

    return res.data.season?.currentMatchday;
  }

  async getMatchdayResults(matchday: number): Promise<string> {
    const cacheKey = `resultados-${matchday}`;
    const ttl = commandTtls['futebolbr']?.cacheTtl ?? 60_000;
    const cached = commandCache.get(cacheKey);
    if (cached) return cached as string;

    const token = this.config.get<string>('FOOTBALL_API_TOKEN');
    const res = await firstValueFrom(
      this.http.get(`${this.baseUrl}/competitions/BSA/matches`, {
        headers: { 'X-Auth-Token': token },
        params: { matchday, status: 'FINISHED' },
      }),
    );

    const jogos = res.data.matches;
    if (!jogos.length)
      return `Nenhum jogo encontrado para a rodada ${matchday}.`;

    const texto = jogos
      .map(
        (m: any) =>
          `• ${m.homeTeam.name} ${m.score.fullTime.home} x ${m.score.fullTime.away} ${m.awayTeam.name}`,
      )
      .join('\n');

    const resposta = `📣 Resultados da Rodada ${matchday}:\n\n${texto}`;
    commandCache.set(cacheKey, resposta, { ttl });
    return resposta;
  }

  async getStandings(): Promise<string> {
    const cacheKey = 'tabela';
    const ttl = commandTtls['futebolbr']?.cacheTtl ?? 60_000;
    const cached = commandCache.get(cacheKey);
    if (cached) return cached as string;

    const token = this.config.get<string>('FOOTBALL_API_TOKEN');
    const res = await firstValueFrom(
      this.http.get(`${this.baseUrl}/competitions/BSA/standings`, {
        headers: { 'X-Auth-Token': token },
      }),
    );

    const tabela = res.data.standings[0].table;
    const texto = tabela
      .map(
        (team: any) =>
          `${team.position}. ${team.team.name} - ${team.points} pts (${team.won}V, ${team.draw}E, ${team.lost}D)`,
      )
      .join('\n');

    const resposta = `🏆 Tabela do Brasileirão Série A:\n\n${texto}`;
    commandCache.set(cacheKey, resposta, { ttl });
    return resposta;
  }

  async getTopScorers(): Promise<string> {
    const cacheKey = 'artilheiros';
    const ttl = commandTtls['futebolbr']?.cacheTtl ?? 60_000;
    const cached = commandCache.get(cacheKey);
    if (cached) return cached as string;

    try {
      const token = this.config.get<string>('FOOTBALL_API_TOKEN');
      const res = await firstValueFrom(
        this.http.get(`${this.baseUrl}/competitions/BSA/scorers`, {
          headers: { 'X-Auth-Token': token },
        }),
      );

      const scorers = res.data.scorers;
      const texto = scorers
        .map(
          (s: any, i: number) =>
            `#${i + 1} - ${s.player.name} (${s.team.name}) - ${s.numberOfGoals ?? s.goals} gols`,
        )
        .join('\n');

      const resposta = `🎯 Artilheiros do Brasileirão:\n\n${texto}`;
      commandCache.set(cacheKey, resposta, { ttl });
      return resposta;
    } catch (err) {
      this.logger.error('Erro ao buscar artilheiros:', err);
      return '⚠️ Não foi possível recuperar os artilheiros no momento.';
    }
  }

  async getUpcomingMatches(): Promise<string> {
    const cacheKey = 'proximos-jogos';
    const ttl = commandTtls['futebolbr']?.cacheTtl ?? 60_000;
    const cached = commandCache.get(cacheKey);
    if (cached) return cached as string;

    const token = this.config.get<string>('FOOTBALL_API_TOKEN');
    const res = await firstValueFrom(
      this.http.get(`${this.baseUrl}/competitions/BSA/matches`, {
        headers: { 'X-Auth-Token': token },
        params: { status: 'SCHEDULED' },
      }),
    );

    const proximos = res.data.matches.slice(0, 5);
    const texto = proximos
      .map((j: any) => {
        const data = new Date(j.utcDate).toLocaleDateString('pt-BR');
        return `• ${j.homeTeam.name} vs ${j.awayTeam.name} (${data})`;
      })
      .join('\n');

    const resposta = `📅 Próximos Jogos:\n\n${texto}`;
    commandCache.set(cacheKey, resposta, { ttl });
    return resposta;
  }
}
