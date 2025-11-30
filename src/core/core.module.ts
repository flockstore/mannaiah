import { Module, Global } from '@nestjs/common'
import { ConfigModule } from './config/config.module'
import { MongoModule } from './mongo/mongo.module'

@Global()
@Module({
  imports: [ConfigModule, MongoModule],
  exports: [ConfigModule, MongoModule],
})
export class CoreModule { }
