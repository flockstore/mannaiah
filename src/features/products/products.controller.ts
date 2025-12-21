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
import { Product } from './schemas/product.schema'
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
 * Controller for managing products.
 * Provides endpoints for CRUD operations on products.
 */
@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Create a new product.
   * Requires 'products:create' permission.
   *
   * @param createProductDto - The product data to create.
   * @returns The created product.
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:create')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @ApiResponse({ status: 409, description: 'Conflict - SKU already exists.' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto)
  }

  /**
   * Get all products.
   * Requires 'products:read' permission.
   *
   * @returns List of all products.
   */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:read')
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'Return all products.',
    type: [Product],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  findAll() {
    return this.productsService.findAll()
  }

  /**
   * Get a single product.
   * Requires 'products:read' permission.
   *
   * @param id - Product ID.
   * @returns The product.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:read')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the product.',
    type: Product,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id)
  }

  /**
   * Update a product.
   * Requires 'products:update' permission.
   *
   * @param id - Product ID.
   * @param updateProductDto - The data to update.
   * @returns The updated product.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:update')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto)
  }

  /**
   * Delete a product.
   * Requires 'products:delete' permission.
   *
   * @param id - Product ID.
   * @returns Void.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:delete')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id)
  }
}
