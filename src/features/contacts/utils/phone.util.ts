/**
 * Utility functions for phone number formatting and sanitization
 */
export class PhoneUtil {
    /**
     * Sanitize phone number by removing spaces and + characters
     * @param phone - Phone number to sanitize
     * @returns Sanitized phone number
     */
    static sanitize(phone: string): string {
        if (!phone) return ''
        return phone.replace(/[\s+]/g, '')
    }

    /**
     * Format phone number with +57 prefix
     * Removes existing +57 if present and adds it back
     * @param phone - Phone number to format
     * @returns Formatted phone number with +57 prefix
     */
    static format(phone: string): string {
        if (!phone) return ''
        // Remove all spaces, + signs, and any existing +57 prefix
        const cleaned = phone.replace(/[\s+]/g, '').replace(/^57/, '')
        return `+57${cleaned}`
    }
}
