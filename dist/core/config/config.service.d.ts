import { ConfigService as NestConfigService } from '@nestjs/config';
import { CoreEnvironmentVariables } from './core.env';
export declare class ConfigService extends NestConfigService<CoreEnvironmentVariables> {
    get port(): number;
    get nodeEnv(): string;
}
