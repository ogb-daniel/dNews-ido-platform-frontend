export function validateEthAmount(amount: string, min: string, max: string): { isValid: boolean; error?: string } {
  // Sanitize input
  const sanitized = amount.trim()

  // Check for malicious patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /eval\(/i,
    /function\(/i,
    /\$\{/,
    /DROP\s+TABLE/i,
    /SELECT\s+\*/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+SET/i,
    /DELETE\s+FROM/i,
  ]

  for (const pattern of maliciousPatterns) {
    if (pattern.test(sanitized)) {
      return { isValid: false, error: "Invalid input detected" }
    }
  }

  // Validate as number
  const num = Number.parseFloat(sanitized)
  if (isNaN(num)) {
    return { isValid: false, error: "Please enter a valid number" }
  }

  // Check range
  const minNum = Number.parseFloat(min)
  const maxNum = Number.parseFloat(max)

  if (num < minNum) {
    return { isValid: false, error: `Minimum amount: ${min} ETH` }
  }

  if (num > maxNum) {
    return { isValid: false, error: `Maximum amount: ${max} ETH` }
  }

  return { isValid: true }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .replace(/eval\(/gi, "") // Remove eval calls
    .trim()
}

export function isValidEthereumAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false

  // Check format: 0x followed by 40 hex characters
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
  return ethAddressRegex.test(address)
}
