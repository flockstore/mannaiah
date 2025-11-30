import { BadRequestException } from '@nestjs/common'

export class InvalidNameCombinationError extends BadRequestException {
  constructor() {
    super('Cannot have both legalName and personal names')
  }
}

export class MissingNameError extends BadRequestException {
  constructor() {
    super('Must provide either legalName OR both firstName and lastName')
  }
}
