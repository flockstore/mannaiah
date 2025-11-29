import { ConfigService } from '@nestjs/config';
import { MongoEnvironmentVariables } from './mongo.env';
export declare class MongoConfigService {
    private readonly configService;
    constructor(configService: ConfigService<MongoEnvironmentVariables>);
    get uri(): string;
    get dbName(): string;
}
