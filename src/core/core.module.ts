import { Module, Global } from '@nestjs/common'
import { ConfigModule } from './config/config.module'

@Global()
@Module({
  imports: [ConfigModule],
  exports: [ConfigModule],
})
export class CoreModule {}
