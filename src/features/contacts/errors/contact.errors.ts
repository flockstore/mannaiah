import { BadRequestException } from '@nestjs/common'

/**
 * Error thrown when a contact has both a legal name and personal names (firstName/lastName).
 * Business rule: A contact must be either a legal entity (with legalName) OR
 * a natural person (with firstName and lastName), but not both.
 */
export class InvalidNameCombinationError extends BadRequestException {
  constructor() {
    super('Cannot have both legalName and personal names')
  }
}

/**
 * Error thrown when a contact is missing required name information.
 * Business rule: A contact must have either a legalName OR both firstName and lastName.
 */
export class MissingNameError extends BadRequestException {
  constructor() {
    super('Must provide either legalName OR both firstName and lastName')
  }
}
