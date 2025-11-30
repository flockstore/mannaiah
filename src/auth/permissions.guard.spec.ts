import { PermissionsGuard } from './permissions.guard'
import { Reflector } from '@nestjs/core'
import { ExecutionContext } from '@nestjs/common'

describe('PermissionsGuard', () => {
    let guard: PermissionsGuard
    let reflector: Reflector

    beforeEach(() => {
        reflector = new Reflector()
        guard = new PermissionsGuard(reflector)
    })

    it('should be defined', () => {
        expect(guard).toBeDefined()
    })

    it('should return true if no permissions are required', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null)
        const context = {
            getHandler: () => { },
            getClass: () => { },
        } as any
        expect(guard.canActivate(context)).toBe(true)
    })

    it('should return false if user is not present', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read'])
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({}),
            }),
        } as any
        expect(guard.canActivate(context)).toBe(false)
    })

    it('should return false if user has no scopes', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read'])
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({ user: {} }),
            }),
        } as any
        expect(guard.canActivate(context)).toBe(false)
    })

    it('should return false if user does not have required permissions', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read'])
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({ user: { scope: 'write' } }),
            }),
        } as any
        expect(guard.canActivate(context)).toBe(false)
    })

    it('should return true if user has required permissions', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read'])
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({ user: { scope: 'read write' } }),
            }),
        } as any
        expect(guard.canActivate(context)).toBe(true)
    })

    it('should return true if user has contacts:manage wildcard for contacts:read', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['contacts:read'])
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({ user: { scope: 'contacts:manage' } }),
            }),
        } as any
        expect(guard.canActivate(context)).toBe(true)
    })

    it('should return true if user has products:manage wildcard for products:create', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['products:create'])
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({ user: { scope: 'products:manage' } }),
            }),
        } as any
        expect(guard.canActivate(context)).toBe(true)
    })

    it('should return false if user has wrong manage wildcard', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['products:create'])
        const context = {
            getHandler: () => { },
            getClass: () => { },
            switchToHttp: () => ({
                getRequest: () => ({ user: { scope: 'contacts:manage' } }),
            }),
        } as any
        expect(guard.canActivate(context)).toBe(false)
    })
})
