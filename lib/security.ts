/**
 * Client-Safe Security Utilities Module
 * Provides functions for input validation, sanitization, and security checks
 * These utilities can be safely used in both Client and Server Components
 */

/**
 * Input validation and sanitization utilities
 */
export class SecurityValidator {
  /**
   * Validates and sanitizes poll title
   * @param title - The poll title to validate
   * @returns Sanitized title or throws error
   */
  static validatePollTitle(title: string): string {
    if (!title || typeof title !== 'string') {
      throw new Error('Poll title is required and must be a string');
    }
    
    const sanitized = title.trim();
    
    if (sanitized.length < 3) {
      throw new Error('Poll title must be at least 3 characters long');
    }
    
    if (sanitized.length > 200) {
      throw new Error('Poll title must be less than 200 characters');
    }
    
    // Remove potentially dangerous characters
    const cleaned = sanitized.replace(/[<>\"'&]/g, '');
    
    if (cleaned !== sanitized) {
      throw new Error('Poll title contains invalid characters');
    }
    
    return cleaned;
  }

  /**
   * Validates and sanitizes poll description
   * @param description - The poll description to validate
   * @returns Sanitized description or throws error
   */
  static validatePollDescription(description: string): string {
    if (!description || typeof description !== 'string') {
      throw new Error('Poll description is required and must be a string');
    }
    
    const sanitized = description.trim();
    
    if (sanitized.length < 10) {
      throw new Error('Poll description must be at least 10 characters long');
    }
    
    if (sanitized.length > 1000) {
      throw new Error('Poll description must be less than 1000 characters');
    }
    
    // Remove potentially dangerous characters
    const cleaned = sanitized.replace(/[<>\"'&]/g, '');
    
    return cleaned;
  }

  /**
   * Validates poll options
   * @param options - Array of poll options to validate
   * @returns Sanitized options array or throws error
   */
  static validatePollOptions(options: string[]): string[] {
    if (!Array.isArray(options)) {
      throw new Error('Poll options must be an array');
    }
    
    if (options.length < 2) {
      throw new Error('Poll must have at least 2 options');
    }
    
    if (options.length > 10) {
      throw new Error('Poll cannot have more than 10 options');
    }
    
    const sanitizedOptions = options.map((option, index) => {
      if (!option || typeof option !== 'string') {
        throw new Error(`Option ${index + 1} is required and must be a string`);
      }
      
      const sanitized = option.trim();
      
      if (sanitized.length < 1) {
        throw new Error(`Option ${index + 1} cannot be empty`);
      }
      
      if (sanitized.length > 100) {
        throw new Error(`Option ${index + 1} must be less than 100 characters`);
      }
      
      // Remove potentially dangerous characters
      const cleaned = sanitized.replace(/[<>\"'&]/g, '');
      
      return cleaned;
    });
    
    // Check for duplicate options
    const uniqueOptions = new Set(sanitizedOptions);
    if (uniqueOptions.size !== sanitizedOptions.length) {
      throw new Error('Poll options must be unique');
    }
    
    return sanitizedOptions;
  }

  /**
   * Validates expiration date
   * @param expiresAt - The expiration date to validate
   * @returns Valid date or throws error
   */
  static validateExpirationDate(expiresAt?: string): Date | null {
    if (!expiresAt) {
      return null;
    }
    
    const date = new Date(expiresAt);
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid expiration date format');
    }
    
    const now = new Date();
    const minDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    
    if (date < minDate) {
      throw new Error('Expiration date must be at least 1 hour in the future');
    }
    
    if (date > maxDate) {
      throw new Error('Expiration date cannot be more than 1 year in the future');
    }
    
    return date;
  }

  /**
   * Validates UUID format
   * @param id - The UUID to validate
   * @returns True if valid UUID
   */
  static isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}



/**
 * Rate limiting utilities (basic implementation)
 */
export class RateLimiter {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Checks if an IP/user is rate limited
   * @param identifier - IP address or user ID
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   * @returns True if rate limited
   */
  static isRateLimited(identifier: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return false;
    }
    
    if (record.count >= maxAttempts) {
      return true;
    }
    
    record.count++;
    return false;
  }

  /**
   * Clears rate limit for an identifier
   * @param identifier - IP address or user ID
   */
  static clearRateLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }
}