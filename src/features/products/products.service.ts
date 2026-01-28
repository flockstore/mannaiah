import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { lastValueFrom } from 'rxjs'
import { Product } from './schemas/product.schema'
import { ProductsRepository } from './products.repository'
import {
  CreateProductDto,
  UpdateProductDto,
  GalleryItemDto,
} from './dto/create-product.dto'
import { AssetsService } from '../assets/assets.service'
import { VariationsService } from '../variations/variations.service'

/**
 * Service to manage products.
 */
@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private assetsService: AssetsService,
    private variationsService: VariationsService,
  ) {}

  /**
   * Validates the product gallery.
   * Checks that:
   * 1. There is at most one main image.
   * 2. All referenced assets exist.
   * 3. All referenced variations (if any) exist.
   *
   * @param gallery - The gallery items to validate.
   * @throws BadRequestException if multiple main images are found or if any asset/variation is not found.
   */
  private async validateGallery(gallery: GalleryItemDto[]) {
    const mainImages = gallery.filter((item) => item.isMain)
    if (mainImages.length > 1) {
      throw new BadRequestException('A product can only have one main image')
    }

    for (const item of gallery) {
      try {
        await this.assetsService.findOne(item.assetId)
      } catch {
        throw new BadRequestException(`Asset with ID ${item.assetId} not found`)
      }

      if (item.variationIds && item.variationIds.length > 0) {
        for (const variationId of item.variationIds) {
          try {
            await this.variationsService.findOne(variationId)
          } catch {
            throw new BadRequestException(
              `Variation with ID ${variationId} not found`,
            )
          }
        }
      }
    }
  }

  /**
   * Validates that all referenced variations exist.
   *
   * @param variationIds - Array of variation IDs to check.
   * @throws BadRequestException if any variation is not found.
   */
  private async validateVariations(variationIds: string[]) {
    for (const id of variationIds) {
      try {
        await this.variationsService.findOne(id)
      } catch {
        throw new BadRequestException(`Variation with ID ${id} not found`)
      }
    }
  }

  /**
   * Creates a new product.
   * Validates gallery and variations before creation.
   * If variants are provided, defaults their SKU to the main product SKU if missing.
   *
   * @param createProductDto - The product data.
   * @returns The created product.
   * @throws ConflictException if SKU already exists.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    if (createProductDto.gallery) {
      await this.validateGallery(createProductDto.gallery)
    }
    if (createProductDto.variations) {
      await this.validateVariations(createProductDto.variations)
    }
    if (createProductDto.variants) {
      const variantIds = createProductDto.variants.flatMap(
        (v) => v.variationIds,
      )
      await this.validateVariations(variantIds)

      createProductDto.variants.forEach((v) => {
        if (!v.sku) {
          v.sku = createProductDto.sku
        }
      })
    }

    try {
      return await lastValueFrom(
        this.productsRepository.create(createProductDto as any),
      )
    } catch (error) {
      if ((error as { code: number }).code === 11000) {
        throw new ConflictException('Product with this SKU already exists')
      }
      throw error
    }
  }

  /**
   * Finds all products.
   *
   * @returns List of products.
   */
  async findAll(): Promise<Product[]> {
    return lastValueFrom(this.productsRepository.findAll())
  }

  /**
   * Finds a product by ID.
   *
   * @param id - Product ID.
   * @returns The product.
   * @throws NotFoundException if not found.
   */
  async findOne(id: string): Promise<Product> {
    const product = await lastValueFrom(this.productsRepository.findById(id))
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }
    return product
  }

  /**
   * Updates a product.
   * Validates gallery and variations if they are being updated.
   * If variants are provided, defaults their SKU to the main product SKU if missing (requires fetching current product).
   *
   * @param id - Product ID.
   * @param updateProductDto - Data to update.
   * @returns The updated product.
   * @throws NotFoundException if product not found.
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    if (updateProductDto.gallery) {
      await this.validateGallery(updateProductDto.gallery)
    }
    if (updateProductDto.variations) {
      await this.validateVariations(updateProductDto.variations)
    }

    if (updateProductDto.variants) {
      const variantIds = updateProductDto.variants.flatMap(
        (v) => v.variationIds,
      )
      await this.validateVariations(variantIds)

      const currentProduct = await this.findOne(id)

      updateProductDto.variants.forEach((v) => {
        if (!v.sku) {
          v.sku = currentProduct.sku
        }
      })
    }

    const updatedProduct = await lastValueFrom(
      this.productsRepository.update(id, updateProductDto),
    )

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }
    return updatedProduct
  }

  /**
   * Deletes a product.
   *
   * @param id - Product ID.
   * @throws NotFoundException if product not found.
   */
  async remove(id: string): Promise<void> {
    const result = await lastValueFrom(this.productsRepository.softDelete(id))
    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }
  }

  // Removed legacy addImage method as image upload is now handled via Assets module
}
