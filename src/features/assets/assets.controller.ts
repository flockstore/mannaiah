import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Get,
  Param,
  Delete,
  Query,
} from '@nestjs/common'
import { AssetsService } from './assets.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { RequirePermissions } from '../../auth/permissions.decorator'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger'
import { map } from 'rxjs'

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * Upload a new file asset.
   * Requires 'assets:create' permission.
   *
   * @param file - The file to upload (multipart/form-data).
   * @returns The created asset record.
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('assets:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file asset' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The asset has been successfully uploaded and created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - File validation failed.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          // Allow simplified set of types for now, or all
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.assetsService.create(file)
  }

  /**
   * Get all assets with pagination.
   *
   * @param page - Page number.
   * @param limit - Page limit.
   * @param filters - Filter query.
   * @returns Paginated list of assets.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all assets' })
  @ApiResponse({ status: 200, description: 'Return paginated assets.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query() filters: Record<string, any>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page: _page, limit: _limit, ...queryFilters } = filters

    return this.assetsService
      .findAllPaginated(queryFilters, +page, +limit)
      .pipe(
        map((result) => ({
          data: result.data,
          meta: {
            page: result.page,
            total: result.total,
            limit: result.limit,
          },
        })),
      )
  }

  /**
   * Get an asset by ID.
   *
   * @param id - Asset ID.
   * @returns The asset record.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get an asset by id' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Return the asset.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Asset not found.' })
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id)
  }

  /**
   * Delete an asset by ID.
   * Requires 'assets:delete' permission.
   *
   * @param id - Asset ID.
   * @returns Void.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('assets:delete')
  @ApiOperation({ summary: 'Delete an asset' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'The asset has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @ApiResponse({ status: 404, description: 'Asset not found.' })
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id)
  }
}
