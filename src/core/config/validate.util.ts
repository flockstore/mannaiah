import { plainToInstance, ClassConstructor } from 'class-transformer'
import { validateSync } from 'class-validator'

/**
 * Validates a configuration object against a class schema.
 * @param cls - The class constructor to validate against.
 * @param config - The configuration object to validate.
 * @returns The validated configuration object instance.
 * @throws Error if validation fails.
 */
export function validateUtil<T extends object>(
  cls: ClassConstructor<T>,
  config: Record<string, unknown>,
): T {
  const validatedConfig = plainToInstance(cls, config, {
    enableImplicitConversion: true,
  })
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }
  return validatedConfig
}
