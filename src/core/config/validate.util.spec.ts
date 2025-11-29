import 'reflect-metadata'
import { validateUtil } from './validate.util'
import { IsString, IsNumber } from 'class-validator'

class TestConfig {
  @IsString()
  TEST_STRING: string

  @IsNumber()
  TEST_NUMBER: number
}

describe('validateUtil', () => {
  it('should validate correct configuration', () => {
    const config = {
      TEST_STRING: 'test',
      TEST_NUMBER: 123,
    }
    const validated = validateUtil(TestConfig, config)
    expect(validated).toBeInstanceOf(TestConfig)
    expect(validated.TEST_STRING).toBe('test')
    expect(validated.TEST_NUMBER).toBe(123)
  })

  it('should fail validation for incorrect types', () => {
    const config = {
      TEST_STRING: 123,
      TEST_NUMBER: 'test',
    }
    expect(() => validateUtil(TestConfig, config)).toThrow()
  })

  it('should fail validation for missing required properties', () => {
    const config = {
      TEST_STRING: 'test',
    }
    expect(() => validateUtil(TestConfig, config)).toThrow()
  })
})
