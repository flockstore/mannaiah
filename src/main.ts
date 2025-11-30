import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { ConfigService } from './core/config/config.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const port = configService.port

  const config = new DocumentBuilder()
    .setTitle('Mannaiah API')
    .setDescription('Mannaiah is the core of Flock inhouse ERP-like software.')
    .setVersion('0.0.1')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('spec', app, document, {
    swaggerUrl: '/spec/swagger.json',
  })

  await app.listen(port)
}
void bootstrap()
