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
import { ProductsService } from './products.service'
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { RequirePermissions } from '../../auth/permissions.decorator'
import { ApiTags } from '@nestjs/swagger'

/**
 * Controller for managing products.
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Create a new product.
   * Requires 'products:create' permission.
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:create')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto)
  }

  /**
   * Get all products.
   * Requires 'products:read' permission.
   */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:read')
  findAll() {
    return this.productsService.findAll()
  }

  /**
   * Get a single product.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:read')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id)
  }

  /**
   * Update a product.
   * Requires 'products:update' permission.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:update')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto)
  }

  /**
   * Delete a product.
   * Requires 'products:delete' permission.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:delete')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id)
  }
}
