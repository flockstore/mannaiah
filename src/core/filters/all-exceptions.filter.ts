/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'
import { MongoServerError } from 'mongodb'

/**
 * Global exception filter that homogenizes all error responses
 * to follow the pattern: { statusCode, message, details }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let details: any = null

    if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      statusCode = exception.getStatus()
      const exceptionResponse: any = exception.getResponse()

      if (typeof exceptionResponse === 'object') {
        // Handle ValidationPipe errors (array of strings)
        if (Array.isArray(exceptionResponse.message)) {
          message = exceptionResponse.error || 'Validation failed'
          details = exceptionResponse.message
        } else {
          message = exceptionResponse.message || exception.message
          details = exceptionResponse.details || exceptionResponse.error || null
        }
      } else {
        message = exceptionResponse
      }
    } else if (exception instanceof MongoServerError) {
      // Handle MongoDB errors
      if (exception.code === 11000) {
        statusCode = HttpStatus.CONFLICT
        message = 'Duplicate key error'
        details = exception.keyValue
      } else {
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR
        message = 'Database error'
        details = exception.message
      }
    } else if (exception instanceof Error) {
      // Handle generic errors
      message = exception.message || 'Internal server error'
      details = exception.stack
    }

    response.status(statusCode).json({
      statusCode,
      message,
      details,
    })
  }
}
