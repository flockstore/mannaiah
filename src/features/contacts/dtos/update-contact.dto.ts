import { PartialType } from '@nestjs/swagger'
import { ContactCreate } from './create-contact.dto'

/**
 * DTO for updating an existing contact.
 * All fields from ContactCreate are optional when updating.
 * Inherits validation and Swagger documentation from ContactCreate via PartialType.
 */
export class ContactUpdate extends PartialType(ContactCreate) {}
