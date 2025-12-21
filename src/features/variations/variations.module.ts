import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { VariationsService } from './variations.service'
import { VariationsController } from './variations.controller'
import { Variation, VariationSchema } from './schemas/variation.schema'
import { VariationsRepository } from './variations.repository'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Variation.name, schema: VariationSchema },
    ]),
  ],
  controllers: [VariationsController],
  providers: [VariationsService, VariationsRepository],
  exports: [VariationsService],
})
export class VariationsModule {}
