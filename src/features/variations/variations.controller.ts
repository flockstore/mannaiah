import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common'
import { VariationsService } from './variations.service'
import {
  CreateVariationDto,
  UpdateVariationDto,
} from './dto/create-variation.dto'
import { Variation } from './schemas/variation.schema'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { RequirePermissions } from '../../auth/permissions.decorator'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger'

/**
 * Controller for managing variations.
 * Provides endpoints for CRUD operations on variations.
 */
@ApiTags('variations')
@ApiBearerAuth()
@Controller('variations')
export class VariationsController {
  constructor(private readonly variationsService: VariationsService) {}

  /**
   * Create a new variation.
   * Requires 'variations:create' permission.
   *
   * @param createVariationDto - The variation data.
   * @returns The created variation.
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('variations:create')
  @ApiOperation({ summary: 'Create a new variation' })
  @ApiResponse({
    status: 201,
    description: 'The variation has been successfully created.',
    type: Variation,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  create(@Body() createVariationDto: CreateVariationDto) {
    return this.variationsService.create(createVariationDto)
  }

  /**
   * Get all variations.
   * Requires 'variations:read' permission.
   *
   * @returns List of all variations.
   */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('variations:read')
  @ApiOperation({ summary: 'Get all variations' })
  @ApiResponse({
    status: 200,
    description: 'Return all variations.',
    type: [Variation],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  findAll() {
    return this.variationsService.findAll()
  }

  /**
   * Get a variation by ID.
   * Requires 'variations:read' permission.
   *
   * @param id - Variation ID.
   * @returns The variation.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('variations:read')
  @ApiOperation({ summary: 'Get a variation by id' })
  @ApiParam({ name: 'id', description: 'Variation ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the variation.',
    type: Variation,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @ApiResponse({ status: 404, description: 'Variation not found.' })
  findOne(@Param('id') id: string) {
    return this.variationsService.findOne(id)
  }

  /**
   * Update a variation.
   * Requires 'variations:update' permission.
   *
   * @param id - Variation ID.
   * @param updateVariationDto - The update data.
   * @returns The updated variation.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('variations:update')
  @ApiOperation({ summary: 'Update a variation' })
  @ApiParam({ name: 'id', description: 'Variation ID' })
  @ApiResponse({
    status: 200,
    description: 'The variation has been successfully updated.',
    type: Variation,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @ApiResponse({ status: 404, description: 'Variation not found.' })
  update(
    @Param('id') id: string,
    @Body() updateVariationDto: UpdateVariationDto,
  ) {
    return this.variationsService.update(id, updateVariationDto)
  }

  /**
   * Delete a variation.
   * Requires 'variations:delete' permission.
   *
   * @param id - Variation ID.
   * @returns Void.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('variations:delete')
  @ApiOperation({ summary: 'Delete a variation' })
  @ApiParam({ name: 'id', description: 'Variation ID' })
  @ApiResponse({
    status: 200,
    description: 'The variation has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @ApiResponse({ status: 404, description: 'Variation not found.' })
  remove(@Param('id') id: string) {
    return this.variationsService.remove(id)
  }
}
