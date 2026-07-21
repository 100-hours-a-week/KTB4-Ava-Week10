export class ApiError extends Error {
  constructor(message, { status = 0, code = '', data = null, cause } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
  }
}
