import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'

@ApiTags('Status')
@Controller()
export class StatusController {
  @Get('status')
  @ApiOperation({ summary: 'Get application status' })
  @ApiResponse({
    status: 200,
    description: 'The application is running successfully.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  getStatus() {
    return { status: 'ok' }
  }

  @Get('check-auth')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check authentication status' })
  @ApiResponse({
    status: 200,
    description: 'The user is authenticated.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'authenticated' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Token is missing or invalid.',
  })
  @HttpCode(HttpStatus.OK)
  checkAuth() {
    return { status: 'authenticated' }
  }
}
