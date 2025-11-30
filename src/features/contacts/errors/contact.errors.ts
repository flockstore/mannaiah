import { BadRequestException } from '@nestjs/common'

/**
 * Error thrown when a contact has both a legal name and personal names (firstName/lastName).
 * Business rule: A contact must be either a legal entity (with legalName) OR
 * a natural person (with firstName and lastName), but not both.
 */
export class InvalidNameCombinationError extends BadRequestException {
  constructor() {
    super({
      message: 'Cannot have both legalName and personal names',
      details: 'A contact must be either a legal entity (with legalName) OR a natural person (with firstName and lastName), but not both',
    })
  }
}

/**
 * Error thrown when a contact is missing required name information.
 * Business rule: A contact must have either a legalName OR both firstName and lastName.
 */
export class MissingNameError extends BadRequestException {
  constructor() {
    super({
      message: 'Must provide either legalName OR both firstName and lastName',
      details: 'A contact requires either a legalName field OR both firstName and lastName fields',
    })
  }
}
