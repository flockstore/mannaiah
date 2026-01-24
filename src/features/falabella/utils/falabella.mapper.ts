
import { Product, ProductDatasheet, ProductVariant } from '../../products/schemas/product.schema';
import { FalabellaProductDTO } from '../dto/create-product.request.dto';

export class FalabellaMapper {
    static toProductDTOs(product: Product): FalabellaProductDTO[] {
        const realm = 'falabella';
        // Find the datasheet for the realm, or fallback to default
        const datasheet =
            product.datasheets.find((d) => d.realm === realm) ||
            product.datasheets.find((d) => d.realm === 'default');

        if (!datasheet) {
            throw new Error(`No datasheet found for product ${product.sku} (realm: ${realm} or default)`);
        }

        // Determine basic attributes from the registry (datasheet attributes)

        const baseAttributes = datasheet.attributes || {};

        // Core Mapping
        const brand = baseAttributes['brand'] || 'Generic';
        const primaryCategory = baseAttributes['primary_category'] || '1638'; // Defaulting to Backpacks as per docs
        const taxClass = baseAttributes['tax_percentage'] || baseAttributes['tax_class'] || 'Standard';
        const description = datasheet.description;
        const name = datasheet.name;
        const price = Number(baseAttributes['price_falabella'] || baseAttributes['price'] || 0);
        const quantity = Number(baseAttributes['quantity'] || 0);

        // Physical Specs Mapping
        const physicalSpecs = {
            Model: baseAttributes['model'],
            ConditionType: baseAttributes['condition_type'],
            Material: baseAttributes['material'],
            ProductHeight: baseAttributes['alto'],
            ProductWidth: baseAttributes['ancho'],
            ProductLength: baseAttributes['largo'],
            PackageHeight: Number(baseAttributes['package_height'] || 0),
            PackageWidth: Number(baseAttributes['package_width'] || 0),
            PackageLength: Number(baseAttributes['package_length'] || 0),
            PackageWeight: Number(baseAttributes['package_weight'] || 0),
            NumberOfPieces: Number(baseAttributes['package_pieces'] || 1),
            PackageContent: baseAttributes['package_content'],
        };

        // Legal & Info Mapping
        const legalInfo = {
            ProductWarranty: baseAttributes['product_warranty'],
            SellerWarranty: baseAttributes['seller_warranty'],
            ProductionCountry: baseAttributes['production_country'],
            CareLabel: baseAttributes['cuidado_del_producto'],
            ManufacturingMethod: baseAttributes['modo_de_fabricacion'],
            RestrictionOfUse: baseAttributes['restricciones_de_uso'],
        };

        // Sales Mapping
        const salesInfo: any = {};
        if (baseAttributes['sale_price_falabella']) {
            salesInfo.SalePrice = Number(baseAttributes['sale_price_falabella']);
        }
        if (baseAttributes['sale_start_date_falabella']) {
            salesInfo.SaleStartDate = baseAttributes['sale_start_date_falabella'];
        }
        if (baseAttributes['sale_end_date_falabella']) {
            salesInfo.SaleEndDate = baseAttributes['sale_end_date_falabella'];
        }

        // Map Images
        // Sort items by isMain true first, then others.
        // Ideally we assume gallery contains S3 asset IDs, which need to be converted to URLs.
        // For now, we will assume the assetId is the URL or we prepend a base URL if needed.
        // Adjust logic if assetId is just a UUID.
        const sortedImages = [...product.gallery].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));
        const imageMap: Record<string, string> = {};

        // Simplistic mapping: MainImage, Image2, Image3...
        if (sortedImages.length > 0) imageMap['MainImage'] = sortedImages[0].assetId;
        sortedImages.slice(1, 8).forEach((img, index) => {
            imageMap[`Image${index + 2}`] = img.assetId;
        });

        // Check if we have variations
        if (!product.variants || product.variants.length === 0) {
            // Single Product (Simple)
            const dto: FalabellaProductDTO = {
                SellerSku: product.sku,
                Name: name,
                Brand: brand,
                Description: description,
                TaxClass: taxClass,
                Variation: '...', // Use '...' or unique value for simple products if required, or empty
                ParentSku: product.sku, // For simple products, ParentSku can be same as SellerSku or empty
                PrimaryCategory: primaryCategory,
                Price: price,
                Quantity: quantity,
                ...physicalSpecs,
                ...legalInfo,
                ...salesInfo,
                ...imageMap,
                ...baseAttributes, // Spread other dynamic attributes
            };

            // Remove known keys from spread attributes to avoid overwriting typed fields if needed, 
            // but overwrite is fine if intentional.
            return [dto];
        } else {
            // Variations
            // We map each variant to a ProductDTO
            return product.variants.map((variant) => {

                return {
                    SellerSku: variant.sku || `${product.sku}-${variant.variationIds.join('-')}`,
                    ParentSku: product.sku,
                    Name: name, // Variants often share the same Name
                    Brand: brand,
                    Description: description,
                    TaxClass: taxClass,
                    Variation: '...',
                    PrimaryCategory: primaryCategory,
                    Price: price,
                    Quantity: quantity,
                    ...physicalSpecs,
                    ...legalInfo,
                    ...salesInfo,
                    ...imageMap,
                    ...baseAttributes,
                };
            });
        }
    }
}
