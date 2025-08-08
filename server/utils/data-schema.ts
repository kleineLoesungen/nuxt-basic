import { z } from 'zod'

export const dataSchemas = {
  app: z.any(),
  config: z.any(),
  users: z.array(z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().optional().default(''),
    password_hash: z.string(),
    bearer_tokens: z.array(
      z.object({
        name: z.string(),
        hash: z.string()
      })
    ).optional().default([]),
    content: z.any()
  }))

} as const

export type DataSchemaKey = keyof typeof dataSchemas

export type DataStoreTypes = {
  [K in DataSchemaKey]: z.infer<typeof dataSchemas[K]>
}
