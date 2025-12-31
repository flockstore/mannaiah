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
 * Provides endpoints for CRUD operations on contacts.
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
   *
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
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @RequirePermissions('contacts:create')
  create(@Body() createContactDto: ContactCreate): Observable<ContactDocument> {
    return this.contactService.createContact(createContactDto)
  }

  /**
   * Get contacts with pagination and filtering.
   * Requires 'contacts:read' permission.
   *
   * @param page - Page number (default: 1).
   * @param limit - Items per page (default: 10).
   * @param excludeIds - List of IDs to exclude.
   * @param orderBy - Field to sort by.
   * @param orderDir - Sort direction ('asc' or 'desc').
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
    name: 'excludeIds',
    required: false,
    type: String,
    isArray: true,
    description: 'List of IDs to exclude',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: String,
    description: 'Field to order by (e.g., createdAt, legalName)',
  })
  @ApiQuery({
    name: 'orderDir',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Order direction (asc or desc)',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter by email',
  })
  @ApiResponse({ status: 200, description: 'Return paginated contacts.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @RequirePermissions('contacts:read')
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('excludeIds') excludeIds?: string | string[],
    @Query('orderBy') orderBy?: string,
    @Query('orderDir') orderDir: 'asc' | 'desc' = 'asc',
    @Query() query?: any,
  ): Observable<{
    data: ContactDocument[]
    total: number
    page: number
    limit: number
  }> {
    // Create a copy of query to modify for filters
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const filters = { ...query }
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    delete filters.page
    delete filters.limit
    delete filters.excludeIds
    delete filters.orderBy
    delete filters.orderDir
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */

    // Handle excludeIds
    let idsToExclude: string[] = []
    if (excludeIds) {
      if (Array.isArray(excludeIds)) {
        idsToExclude = excludeIds
      } else {
        idsToExclude = excludeIds.split(',')
      }
    }

    // Handle Sorting
    let sort: Record<string, 1 | -1> | undefined
    if (orderBy) {
      sort = { [orderBy]: orderDir === 'desc' ? -1 : 1 }
    } else {
      // Default sort by createdAt desc if not specified
      sort = { createdAt: -1 }
    }

    return this.contactService.findAllPaginated(
      filters,
      page,
      limit,
      undefined, // options
      sort,
      idsToExclude,
    )
  }

  /**
   * Get a contact by ID.
   * Requires 'contacts:read' permission.
   *
   * @param id - Contact ID.
   * @returns The contact document.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a contact by id' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Return the contact.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
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
   *
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
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
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
   *
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
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @ApiResponse({ status: 404, description: 'Contact not found.' })
  @RequirePermissions('contacts:delete')
  remove(@Param('id') id: string): Observable<ContactDocument | null> {
    return this.contactService.softDelete(id)
  }
}
