import { ZodError } from 'zod'

export default defineEventHandler(async (event) => {
  const key = event.context.params?.key

  if (!key || !(key in dataSchemas)) {
    throw createError({ statusCode: 400, message: 'Ungültiger Key' })
  }

  const schema = dataSchemas[key as keyof typeof dataSchemas]

  const body = await readBody(event)

  let validated
  try {
    validated = schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validierungsfehler',
        data: error.errors,
      })
    }
    throw error
  }

  await db.setItem(key, validated)
  return { success: true }
})
