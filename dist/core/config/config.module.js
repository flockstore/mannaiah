"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const config_service_1 = require("./config.service");
const mongo_config_1 = require("../mongo/config/mongo.config");
const validate_util_1 = require("./validate.util");
const core_env_1 = require("./core.env");
const mongo_env_1 = require("../mongo/config/mongo.env");
function validate(config) {
    const coreConfig = (0, validate_util_1.validateUtil)(core_env_1.CoreEnvironmentVariables, config);
    const mongoConfig = (0, validate_util_1.validateUtil)(mongo_env_1.MongoEnvironmentVariables, config);
    return { ...coreConfig, ...mongoConfig };
}
let ConfigModule = class ConfigModule {
};
exports.ConfigModule = ConfigModule;
exports.ConfigModule = ConfigModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                validate,
                isGlobal: true,
            }),
        ],
        providers: [config_service_1.ConfigService, mongo_config_1.MongoConfigService],
        exports: [config_service_1.ConfigService, mongo_config_1.MongoConfigService],
    })
], ConfigModule);
//# sourceMappingURL=config.module.js.map