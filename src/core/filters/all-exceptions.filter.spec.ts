/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { AllExceptionsFilter } from './all-exceptions.filter'
import { ArgumentsHost, HttpStatus, BadRequestException } from '@nestjs/common'
import { MongoServerError } from 'mongodb'

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter
  let mockArgumentsHost: ArgumentsHost
  let mockResponse: any

  beforeEach(() => {
    filter = new AllExceptionsFilter()
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any
  })

  it('should catch MongoDB duplicate key error (11000) and return Conflict (409)', () => {
    const exception = new MongoServerError({
      code: 11000,
      keyValue: { email: 'test@example.com' },
      errmsg: 'E11000 duplicate key error...',
    })

    filter.catch(exception, mockArgumentsHost)

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT)
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: 'Duplicate key error',
      details: { email: 'test@example.com' },
    })
  })

  it('should catch MongoDB other errors and return Internal Server Error (500)', () => {
    const exception = new MongoServerError({
      code: 12345,
      errmsg: 'Some other error',
    })

    filter.catch(exception, mockArgumentsHost)

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error',
      details: expect.any(String),
    })
  })

  it('should catch HttpException with object response', () => {
    const exception = new BadRequestException({
      message: 'Validation failed',
      details: 'Field is required',
    })

    filter.catch(exception, mockArgumentsHost)

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      details: 'Field is required',
    })
  })

  it('should catch HttpException with array of validation errors', () => {
    const exception = new BadRequestException({
      message: ['field1 is required', 'field2 must be a string'],
      error: 'Bad Request',
    })

    filter.catch(exception, mockArgumentsHost)

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Bad Request',
      details: ['field1 is required', 'field2 must be a string'],
    })
  })

  it('should catch generic Error', () => {
    const exception = new Error('Something went wrong')

    filter.catch(exception, mockArgumentsHost)

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong',
      details: expect.any(String),
    })
  })
})
