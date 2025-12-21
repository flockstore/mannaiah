import { ApiProperty } from '@nestjs/swagger'
import { Asset } from '../schemas/asset.schema'

export class AssetPaginationMeta {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total: number

  @ApiProperty({ description: 'Items per page limit', example: 10 })
  limit: number
}

export class PaginatedAssetResponse {
  @ApiProperty({ description: 'List of assets', type: [Asset] })
  data: Asset[]

  @ApiProperty({
    description: 'Pagination metadata',
    type: AssetPaginationMeta,
  })
  meta: AssetPaginationMeta
}
