
import { Injectable, Logger } from '@nestjs/common'
import { ProductsService } from '../products/products.service'
import { FalabellaService } from './falabella.service'
import { AssetsService } from '../assets/assets.service'
import { Product } from '../products/schemas/product.schema'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class FalabellaSyncService {
    private readonly logger = new Logger(FalabellaSyncService.name)

    constructor(
        private readonly productsService: ProductsService,
        private readonly falabellaService: FalabellaService,
        private readonly assetsService: AssetsService,
    ) { }

    async syncProducts(): Promise<void> {
        this.logger.log('Starting Falabella product sync...')
        const products = await this.productsService.findAll()

        let successCount = 0
        let errorCount = 0

        for (const product of products) {
            try {
                await this.syncProduct(product)
                successCount++
            } catch (error) {
                this.logger.error(
                    `Failed to sync product ${product.sku}: ${(error as Error).message}`,
                )
                errorCount++
            }
        }

        this.logger.log(
            `Falabella sync completed. Success: ${successCount}, Errors: ${errorCount}`,
        )
    }

    private async syncProduct(product: Product): Promise<void> {
        // 1. Determine if product has variations
        const hasVariations = product.variants && product.variants.length > 0

        if (hasVariations) {
            await this.syncProductWithVariations(product)
        } else {
            await this.syncSimpleProduct(product)
        }

        // 3. Sync Images (Common for both types, associated with main product usually or per variant)
        // Basic strategy: Sync images for the main product SKU. 
        // If variations need specific images, logic would be more complex.
        await this.syncImages(product)
    }

    private async syncSimpleProduct(product: Product): Promise<void> {
        const payload = this.mapProductToFalabella(product)
        await this.falabellaService.createProduct(payload)
    }

    private async syncProductWithVariations(product: Product): Promise<void> {
        // 1. Sync Parent
        const parentPayload = this.mapProductToFalabella(product, true)
        await this.falabellaService.createProduct(parentPayload)

        // 2. Sync Children
        for (const variant of product.variants) {
            const childPayload = this.mapVariantToFalabella(product, variant)
            await this.falabellaService.createProduct(childPayload)
        }
    }

    private async syncImages(product: Product): Promise<void> {
        if (!product.gallery || product.gallery.length === 0) {
            return
        }

        const imageUrls: string[] = []

        for (const item of product.gallery) {
            try {
                // Resolves public URL using StorageService configuration (supports Minio/S3)
                const url = await this.assetsService.getPublicUrl(item.assetId)
                imageUrls.push(url)
            } catch (error) {
                this.logger.warn(`Asset ${item.assetId} not found or URL generation failed for product ${product.sku}, skipping`)
            }
        }

        if (imageUrls.length > 0) {
            // Syncing images to the main product SKU. 
            // If variants have specific images, we should iterate them too.
            // For now, attaching all gallery images to the seller SKU.
            await this.falabellaService.uploadImage({
                SellerSku: product.sku,
                Images: imageUrls
            })
        }
    }

    private mapProductToFalabella(product: Product, isParent = false): any {
        const falabellaData =
            product.datasheets.find((d) => d.realm === 'falabella') ||
            product.datasheets[0]

        if (!falabellaData) {
            throw new Error(`No datasheet found for product ${product.sku}`)
        }

        const { brand, category, ...otherAttributes } = falabellaData.attributes || {}

        return {
            SellerSku: product.sku,
            Name: falabellaData.name,
            Description: falabellaData.description,
            Brand: brand || 'Generic',
            PrimaryCategory: category,
            ...otherAttributes,
            ParentSku: isParent ? undefined : undefined,
        }
    }

    private mapVariantToFalabella(parent: Product, variant: any): any {
        const falabellaData =
            parent.datasheets.find((d) => d.realm === 'falabella') ||
            parent.datasheets[0]

        const { brand, category, ...otherAttributes } = falabellaData.attributes || {}

        return {
            SellerSku: variant.sku || parent.sku,
            ParentSku: parent.sku,
            Name: `${falabellaData.name} - ${variant.sku}`,
            Description: falabellaData.description,
            Brand: brand || 'Generic',
            PrimaryCategory: category,
            ...otherAttributes,
        }
    }
}
