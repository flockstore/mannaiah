import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Contact, ContactSchema } from './schemas/contact.schema'
import { ContactRepository } from './repositories/contact.repository'
import { ContactService } from './services/contact.service'

/**
 * Contacts feature module
 */
import { ContactsController } from './controllers/contacts.controller'
import { AuthModule } from '../../auth/auth.module'

/**
 * Contacts feature module
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contact, schema: ContactSchema }]),
    AuthModule,
  ],
  controllers: [ContactsController],
  providers: [ContactRepository, ContactService],
  exports: [ContactService, ContactRepository],
})
export class ContactsModule { }
