import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const allowed =
        // Exact localhost ports (dev)
        /^http:\/\/localhost:\d+$/.test(origin) ||
        // Subdomain localhost (e.g. pbartacademy.localhost:3003)
        /^http:\/\/[a-z0-9-]+\.localhost(:\d+)?$/.test(origin) ||
        // Production subdomains
        /^https:\/\/[a-z0-9-]+\.karpiapp\.com$/.test(origin) ||
        // Production root domains
        /^https:\/\/(karpiapp\.com|superadmin\.karpiapp\.com|clientportal\.karpiapp\.com)$/.test(origin);

      callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
    },
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4100);
}
bootstrap();
