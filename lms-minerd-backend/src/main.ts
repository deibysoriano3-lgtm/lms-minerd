import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Permite solicitudes HTTP del Frontend React


  await app.listen(3000);
  console.log('✅ LMS MINERD API Server running on http://localhost:3000');
}
bootstrap();
