import { MongoExceptionFilter } from './mongo-exception.filter'
import { ArgumentsHost, HttpStatus } from '@nestjs/common'
import { MongoServerError } from 'mongodb'

describe('MongoExceptionFilter', () => {
    let filter: MongoExceptionFilter
    let mockArgumentsHost: ArgumentsHost
    let mockResponse: any

    beforeEach(() => {
        filter = new MongoExceptionFilter()
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

    it('should catch duplicate key error (11000) and return Conflict (409)', () => {
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
            error: 'Conflict',
            details: { email: 'test@example.com' },
        })
    })

    it('should return Internal Server Error (500) for other errors', () => {
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
            message: 'Internal server error',
        })
    })
})
