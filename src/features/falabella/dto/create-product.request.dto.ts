export interface FalabellaProductRequest {
  Action: 'ProductCreate'
  Format: 'JSON'
  Timestamp?: string
  UserID?: string
  Version?: string
  Signature?: string
  Request: {
    Product: FalabellaProductDTO[]
  }
}

export interface FalabellaProductDTO {
  SellerSku: string
  Name: string
  Brand: string
  Description: string
  TaxClass: string
  Variation: string
  ParentSku: string
  Quantity: number
  Price: number
  SalePrice?: number
  SaleStartDate?: string
  SaleEndDate?: string
  ProductId?: string
  PrimaryCategory: string
  Categories?: string

  // Physical Specs
  Model?: string
  ConditionType?: string
  Material?: string
  ProductHeight?: string
  ProductWidth?: string
  ProductLength?: string
  PackageHeight?: number
  PackageWidth?: number
  PackageLength?: number
  PackageWeight?: number
  NumberOfPieces?: number
  PackageContent?: string

  // Legal & Info
  ProductWarranty?: string
  SellerWarranty?: string
  ProductionCountry?: string
  CareLabel?: string
  ManufacturingMethod?: string
  RestrictionOfUse?: string

  // Images
  MainImage?: string
  Image2?: string
  Image3?: string
  Image4?: string
  Image5?: string
  Image6?: string
  Image7?: string
  Image8?: string

  [key: string]: any // Allow dynamic attributes
}
