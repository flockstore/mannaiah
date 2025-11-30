import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ContactService } from '../services/contact.service'
import { ContactCreate } from '../dtos/create-contact.dto'
import { ContactUpdate } from '../dtos/update-contact.dto'
import { ContactDocument } from '../interfaces/contact.interface'
import { AuthGuard } from '@nestjs/passport'
import { PermissionsGuard } from '../../../auth/permissions.guard'
import { RequirePermissions } from '../../../auth/permissions.decorator'

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactService: ContactService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({
    status: 201,
    description: 'The contact has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @RequirePermissions('contacts:create')
  create(@Body() createContactDto: ContactCreate): Observable<ContactDocument> {
    return this.contactService.createContact(createContactDto)
  }

  @Get()
  @ApiOperation({ summary: 'Get contacts by email' })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Return all contacts.' })
  @RequirePermissions('contacts:read')
  findAll(@Query('email') email: string): Observable<ContactDocument[]> {
    return this.contactService.findByEmail(email)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact by id' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Return the contact.' })
  @ApiResponse({ status: 404, description: 'Contact not found.' })
  @RequirePermissions('contacts:read')
  findOne(@Param('id') id: string): Observable<ContactDocument> {
    return this.contactService.findById(id).pipe(
      map((contact) => {
        if (!contact) {
          throw new NotFoundException(`Contact with ID ${id} not found`)
        }
        return contact
      }),
    )
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({
    status: 200,
    description: 'The contact has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Contact not found.' })
  @RequirePermissions('contacts:update')
  update(
    @Param('id') id: string,
    @Body() updateContactDto: ContactUpdate,
  ): Observable<ContactDocument> {
    return this.contactService.updateContact(id, updateContactDto).pipe(
      map((contact) => {
        if (!contact) {
          throw new NotFoundException(`Contact with ID ${id} not found`)
        }
        return contact
      }),
    )
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({
    status: 200,
    description: 'The contact has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Contact not found.' })
  @RequirePermissions('contacts:delete')
  remove(@Param('id') id: string): Observable<ContactDocument | null> {
    return this.contactService.softDelete(id)
  }
}
