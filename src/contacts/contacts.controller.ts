import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ContactsService } from './contacts.service'
import { CreateContactDto } from './dto/create-contact.dto'
import { UpdateContactDto } from './dto/update-contact.dto'
import { PermissionsGuard } from '../auth/permissions.guard'
import { RequirePermissions } from '../auth/permissions.decorator'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) { }

  @Post()
  @RequirePermissions('contacts:create')
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto)
  }

  @Get()
  @RequirePermissions('contacts:read')
  findAll() {
    return this.contactsService.findAll()
  }

  @Get(':id')
  @RequirePermissions('contacts:read')
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(+id)
  }

  @Patch(':id')
  @RequirePermissions('contacts:update')
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(+id, updateContactDto)
  }

  @Delete(':id')
  @RequirePermissions('contacts:delete')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(+id)
  }
}
