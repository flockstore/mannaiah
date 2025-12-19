import { PhoneUtil } from './phone.util'

describe('PhoneUtil', () => {
  describe('sanitize', () => {
    it('should remove spaces', () => {
      expect(PhoneUtil.sanitize('300 123 4567')).toBe('3001234567')
    })

    it('should remove + signs', () => {
      expect(PhoneUtil.sanitize('+573001234567')).toBe('573001234567')
    })

    it('should handle empty string', () => {
      expect(PhoneUtil.sanitize('')).toBe('')
    })
  })

  describe('format', () => {
    it('should add +57 prefix', () => {
      expect(PhoneUtil.format('3001234567')).toBe('+573001234567')
    })

    it('should remove existing +57 and add it back', () => {
      expect(PhoneUtil.format('+573001234567')).toBe('+573001234567')
      expect(PhoneUtil.format('573001234567')).toBe('+573001234567')
    })

    it('should remove spaces', () => {
      expect(PhoneUtil.format('300 123 4567')).toBe('+573001234567')
    })

    it('should handle empty string', () => {
      expect(PhoneUtil.format('')).toBe('')
    })
  })
})
