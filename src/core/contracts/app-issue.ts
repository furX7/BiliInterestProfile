/** Minimal cross-module issue shape; codes are owned by their actual boundary. */
export interface AppError {
  code: string
  message: string
}

export interface AppWarning {
  code: string
  message: string
}
