import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Product, ProductDocument } from './schemas/product.schema'
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
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private assetsService: AssetsService,
    private variationsService: VariationsService,
  ) {}

  private async validateGallery(gallery: GalleryItemDto[]) {
    // Check for duplicate main images
    const mainImages = gallery.filter((item) => item.isMain)
    if (mainImages.length > 1) {
      throw new BadRequestException('A product can only have one main image')
    }

    // Verify assets exist
    for (const item of gallery) {
      try {
        await this.assetsService.findOne(item.assetId)
      } catch {
        throw new BadRequestException(`Asset with ID ${item.assetId} not found`)
      }

      if (item.variationId) {
        try {
          await this.variationsService.findOne(item.variationId)
        } catch {
          throw new BadRequestException(
            `Variation with ID ${item.variationId} not found`,
          )
        }
      }
    }
  }

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

    try {
      const createdProduct = new this.productModel(createProductDto)
      return await createdProduct.save()
    } catch (error) {
      if ((error as { code: number }).code === 11000) {
        throw new ConflictException('Product with this SKU already exists')
      }
      throw error
    }
  }

  /**
   * Finds all products.
   * @returns List of products.
   */
  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec()
  }

  /**
   * Finds a product by ID.
   * @param id - Product ID.
   * @returns The product.
   * @throws NotFoundException if not found.
   */
  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec()
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }
    return product
  }

  /**
   * Updates a product.
   * @param id - Product ID.
   * @param updateProductDto - Data to update.
   * @returns The updated product.
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

    const existingProduct = await this.productModel
      .findByIdAndUpdate(id, { $set: updateProductDto }, { new: true })
      .exec()

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }
    return existingProduct
  }

  /**
   * Deletes a product.
   * @param id - Product ID.
   */
  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec()
    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }
  }

  // Removed legacy addImage method as image upload is now handled via Assets module
}
