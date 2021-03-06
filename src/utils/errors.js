import { STATUS_500_INTERNAL_SERVER_ERROR } from "./http"
import { logError } from "./logger"
import { redirectIfUnauthorized } from "./auth"

class MedleError extends Error {
  constructor({ message, detail }) {
    super(message)
    this.name = this.constructor.name
    this.detail = detail
  }
}

export class APIError extends MedleError {
  constructor({ message, detail, status }) {
    super({ message, detail })
    this.name = this.constructor.name
    this.status = status
  }
}
export class InternalError extends MedleError {
  constructor({ detail }) {
    super({ message: "Internal server error", detail })
    this.name = this.constructor.name
    this.status = STATUS_500_INTERNAL_SERVER_ERROR
  }
}

export class ValidationError extends MedleError {
  constructor(message, detail) {
    super({ message, detail })
    this.name = this.constructor.name
  }
}

export const handleAPIResponse = async (response) => {
  if (!response.ok) {
    const json = await response.json()

    const error = new APIError(json)
    logError(error)
    redirectIfUnauthorized(error)
    return
  }
  return response.json()
}

export const stringifyError = (error) => {
  // eslint-disable-next-line no-unused-vars
  const [stack, ...keys] = Object.getOwnPropertyNames(error)
  return JSON.stringify(error, keys, " ")
}
