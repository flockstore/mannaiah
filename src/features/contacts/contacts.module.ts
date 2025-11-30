import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Contact, ContactSchema } from './schemas/contact.schema'
import { ContactRepository } from './repositories/contact.repository'
import { ContactService } from './services/contact.service'

/**
 * Contacts feature module
 */
import { ContactsController } from './controllers/contacts.controller'

/**
 * Contacts feature module
 */
@Module({
    imports: [
        MongooseModule.forFeature([{ name: Contact, schema: ContactSchema }]),
    ],
    controllers: [ContactsController],
    providers: [ContactRepository, ContactService],
    exports: [ContactService, ContactRepository],
})
export class ContactsModule { }
