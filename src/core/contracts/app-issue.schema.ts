import { z } from 'zod'
const issueShape = {
  code: z.string().regex(/^[a-z][a-z0-9_]*$/),
  message: z.string().trim().min(1),
}
export const appErrorSchema = z.strictObject(issueShape)
export const appWarningSchema = z.strictObject(issueShape)
