"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let MongoConfigService = class MongoConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    get uri() {
        const uri = this.configService.get('MANNAIAH_MONGO_URI', { infer: true });
        if (uri === undefined) {
            throw new Error('MANNAIAH_MONGO_URI is not defined');
        }
        return uri;
    }
    get dbName() {
        const dbName = this.configService.get('MANNAIAH_MONGO_DB_NAME', {
            infer: true,
        });
        if (dbName === undefined) {
            throw new Error('MANNAIAH_MONGO_DB_NAME is not defined');
        }
        return dbName;
    }
};
exports.MongoConfigService = MongoConfigService;
exports.MongoConfigService = MongoConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MongoConfigService);
//# sourceMappingURL=mongo.config.js.map