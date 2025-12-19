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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { RequirePermissions } from '../../auth/permissions.decorator'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('variations')
@Controller('variations')
export class VariationsController {
  constructor(private readonly variationsService: VariationsService) {}

  /**
   * Create a new variation.
   * Requires 'variations:create' permission.
   * @param createVariationDto - The variation data.
   * @returns The created variation.
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('variations:create')
  create(@Body() createVariationDto: CreateVariationDto) {
    return this.variationsService.create(createVariationDto)
  }

  /**
   * Get all variations.
   * Requires 'variations:read' permission.
   * @returns List of variations.
   */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('variations:read')
  findAll() {
    return this.variationsService.findAll()
  }

  /**
   * Get a variation by ID.
   * Requires 'variations:read' permission.
   * @param id - Variation ID.
   * @returns The variation.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('variations:read')
  findOne(@Param('id') id: string) {
    return this.variationsService.findOne(id)
  }

  /**
   * Update a variation.
   * Requires 'variations:update' permission.
   * @param id - Variation ID.
   * @param updateVariationDto - The update data.
   * @returns The updated variation.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('variations:update')
  update(
    @Param('id') id: string,
    @Body() updateVariationDto: UpdateVariationDto,
  ) {
    return this.variationsService.update(id, updateVariationDto)
  }

  /**
   * Delete a variation.
   * Requires 'variations:delete' permission.
   * @param id - Variation ID.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('variations:delete')
  remove(@Param('id') id: string) {
    return this.variationsService.remove(id)
  }
}
