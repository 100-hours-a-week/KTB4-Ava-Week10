import { ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE_BYTES } from '../../constants/assets'
import { MESSAGES } from '../../constants/messages'

export const EMAIL_PATTERN = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/

export function validateEmail(value) {
  if (!value) return MESSAGES.EMAIL_REQUIRED
  return EMAIL_PATTERN.test(value) ? '' : MESSAGES.EMAIL_INVALID
}

export function validatePassword(value, requiredMessage = MESSAGES.PASSWORD_REQUIRED) {
  if (!value) return requiredMessage
  return PASSWORD_PATTERN.test(value) ? '' : MESSAGES.PASSWORD_INVALID
}

export function validateNickname(value, { optional = false } = {}) {
  if (!value) return optional ? '' : MESSAGES.NICKNAME_REQUIRED
  if (value.length > 10) return MESSAGES.NICKNAME_LENGTH
  if (/\s/.test(value)) return MESSAGES.NICKNAME_SPACE
  return ''
}

export function validateImage(file) {
  if (!file) return ''
  const extension = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) return MESSAGES.IMAGE_EXTENSION
  if (file.size > MAX_IMAGE_SIZE_BYTES) return MESSAGES.IMAGE_SIZE_LIMIT
  return ''
}
