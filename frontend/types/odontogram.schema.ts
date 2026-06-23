import { z } from 'zod'

export const SurfaceSchema = z.enum(['M', 'D', 'O', 'I', 'B', 'L', 'P', 'full'])
export type Surface = z.infer<typeof SurfaceSchema>

export const ConditionTypeSchema = z.enum([
  'karies',
  'karies_sekunder',
  'tambalan',
  'missing',
  'sisa_akar',
  'crown',
  'bridge',
  'implan',
  'normal'
])
export type ConditionType = z.infer<typeof ConditionTypeSchema>

export const OdontogramConditionSchema = z.object({
  type: ConditionTypeSchema,
  surface: z.array(SurfaceSchema),
  material: z.string().optional(),
  recordedAt: z.string(),
  doctorId: z.string(),
})
export type OdontogramCondition = z.infer<typeof OdontogramConditionSchema>

export const ToothStateSchema = z.object({
  existing: z.array(OdontogramConditionSchema),
  planned: z.array(OdontogramConditionSchema),
})
export type ToothState = z.infer<typeof ToothStateSchema>

export const OdontogramStateSchema = z.object({
  teeth: z.record(z.string(), ToothStateSchema)
})
export type OdontogramStateData = z.infer<typeof OdontogramStateSchema>

export const UpdateOdontogramPayloadSchema = z.object({
  state: OdontogramStateSchema,
  expectedVersion: z.number().int().min(1)
})
export type UpdateOdontogramPayload = z.infer<typeof UpdateOdontogramPayloadSchema>
