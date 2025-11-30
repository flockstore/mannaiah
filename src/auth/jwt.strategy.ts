import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { passportJwtSecret } from 'jwks-rsa'
import { ConfigService } from '../core/config/config.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${configService.logtoIssuer}/jwks`,
            }),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            audience: configService.logtoAudience,
            issuer: configService.logtoIssuer,
            algorithms: ['RS256', 'ES384'],
        })
    }

    validate(payload: unknown): unknown {
        return payload
    }
}
