import { PartialType } from '@nestjs/swagger'
import { ContactCreate } from './create-contact.dto'

export class ContactUpdate extends PartialType(ContactCreate) { }
