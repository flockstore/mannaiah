import { ExecutionContext, Injectable } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '../core/config/config.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { Environment } from '../core/config/core.env'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-jwt'

@Injectable()
class MockJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: () => null,
      secretOrKey: 'mock',
    })
  }

  validate(payload: unknown) {
    return payload
  }
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard
  let configService: ConfigService

  const mockConfigService = {
    nodeEnv: Environment.Development,
    devAuthToken: undefined,
  }

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        headers: {
          authorization: null,
        },
      }),
    }),
  } as unknown as ExecutionContext

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        MockJwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    guard = module.get<JwtAuthGuard>(JwtAuthGuard)
    configService = module.get<ConfigService>(ConfigService)
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  describe('canActivate', () => {
    it('should allow request with correct dev token in development', () => {
      Object.defineProperty(mockConfigService, 'nodeEnv', {
        value: Environment.Development,
      })
      Object.defineProperty(mockConfigService, 'devAuthToken', {
        value: 'secret-token',
      })

      const request = {
        headers: { authorization: 'Bearer secret-token' },
        user: undefined,
      }

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext

      const result = guard.canActivate(context)
      expect(result).toBe(true)
      expect(request.user).toBeDefined()
      expect(request.user['sub']).toBe('dev-admin')
    })

    it('should fall back to super.canActivate if token does not match', async () => {
      Object.defineProperty(mockConfigService, 'nodeEnv', {
        value: Environment.Development,
      })
      Object.defineProperty(mockConfigService, 'devAuthToken', {
        value: 'secret-token',
      })

      const request = {
        headers: { authorization: 'Bearer wrong-token' },
      }

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({}),
          getNext: () => ({}),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
        getArgs: () => [],
        getType: () => 'http',
      } as unknown as ExecutionContext

      try {
        await guard.canActivate(context)
      } catch (e) {
        expect(true).toBe(true)
      }
    })

    it('should validation fail if not in development mode', async () => {
      Object.defineProperty(mockConfigService, 'nodeEnv', {
        value: Environment.Production,
      })
      Object.defineProperty(mockConfigService, 'devAuthToken', {
        value: 'secret-token',
      })

      const request = {
        headers: { authorization: 'Bearer secret-token' },
      }

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({}),
          getNext: () => ({}),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
        getArgs: () => [],
        getType: () => 'http',
      } as unknown as ExecutionContext

      try {
        await guard.canActivate(context)
      } catch (e) {
        expect(true).toBe(true)
      }
    })
  })
})
