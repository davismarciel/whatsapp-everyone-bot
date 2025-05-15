import { NestFactory } from '@nestjs/core';
import { AppModule } from './core/app.module';
import { json } from 'body-parser';
import { ExceptionFilterHandler } from './shared/filters/exception-handler.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '10mb' }));

  app.useGlobalFilters(new ExceptionFilterHandler());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
