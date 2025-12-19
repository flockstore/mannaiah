/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common'
import { MongoServerError } from 'mongodb'
import { Response } from 'express'

@Catch(MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoServerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    if (exception.code === 11000) {
      const status = HttpStatus.CONFLICT
      response.status(status).json({
        statusCode: status,
        message: 'Duplicate key error',
        details: exception.keyValue,
      })
    } else {
      const status = HttpStatus.INTERNAL_SERVER_ERROR
      response.status(status).json({
        statusCode: status,
        message: 'Internal server error',
        details: null,
      })
    }
  }
}
