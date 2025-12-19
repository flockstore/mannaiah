import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Contact, ContactSchema } from './schemas/contact.schema'
import { ContactRepository } from './repositories/contact.repository'
import { ContactService } from './services/contact.service'

/**
 * Contacts feature module
 */
import { ContactsController } from './controllers/contacts.controller'
import { WooCommerceSyncController } from './controllers/woocommerce-sync.controller'
import { AuthModule } from '../../auth/auth.module'
import { WooCommerceModule } from '../woocommerce/woocommerce.module'
import { WooCommerceSyncService } from './woocommerce/woocommerce-sync.service'
import { WooCommerceCustomerSyncCron } from './woocommerce/woocommerce-customer-sync.cron'

/**
 * Contacts feature module
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contact, schema: ContactSchema }]),
    AuthModule,
    WooCommerceModule,
  ],
  controllers: [ContactsController, WooCommerceSyncController],
  providers: [
    ContactRepository,
    ContactService,
    WooCommerceSyncService,
    WooCommerceCustomerSyncCron,
  ],
  exports: [ContactService, ContactRepository],
})
export class ContactsModule {}
