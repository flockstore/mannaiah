import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
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
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../../auth/permissions.guard'
import { RequirePermissions } from '../../../auth/permissions.decorator'

/**
 * Controller for managing contacts.
 */
@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * Create a new contact.
   * Requires 'contacts:create' permission.
   * @param createContactDto - The contact data to create.
   * @returns The created contact.
   */
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

  /**
   * Get contacts with pagination and filtering.
   * Requires 'contacts:read' permission.
   * @param page - Page number (default: 1).
   * @param limit - Items per page (default: 10).
   * @param query - Additional filter query parameters.
   * @returns Paginated list of contacts.
   */
  @Get()
  @ApiOperation({ summary: 'Get contacts with pagination and filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter by email',
  })
  @ApiResponse({ status: 200, description: 'Return paginated contacts.' })
  @RequirePermissions('contacts:read')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query() query: any,
  ): Observable<{
    data: ContactDocument[]
    total: number
    page: number
    limit: number
  }> {
    // Remove page and limit from query object as they are handled separately
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
    const { page: _, limit: __, ...filters } = query
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.contactService.findAllPaginated(filters, page, limit)
  }

  /**
   * Get a contact by ID.
   * Requires 'contacts:read' permission.
   * @param id - Contact ID.
   * @returns The contact document.
   */
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

  /**
   * Update a contact.
   * Requires 'contacts:update' permission.
   * @param id - Contact ID.
   * @param updateContactDto - The data to update.
   * @returns The updated contact document.
   */
  @Patch(':id')
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

  /**
   * Soft delete a contact.
   * Requires 'contacts:delete' permission.
   * @param id - Contact ID.
   * @returns The deleted contact (or null if already deleted/not found depending on logic).
   */
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
