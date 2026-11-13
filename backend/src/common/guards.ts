import { BadRequestException, NotFoundException } from '@nestjs/common'
import { isClassId } from './classes'

export const assertClass = (classId: string) => {
  if (!isClassId(classId)) throw new NotFoundException(`Class "${classId}" does not exist.`)
}

/** Answers must be { questionId: optionIndex }. */
export const cleanAnswers = (raw: unknown): Record<string, number> => {
  if (raw === undefined || raw === null) return {}
  if (typeof raw !== 'object' || Array.isArray(raw)) throw new BadRequestException('answers must be an object.')
  const out: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      throw new BadRequestException(`Answer for "${key}" must be an option index.`)
    }
    out[key] = value
  }
  return out
}

export const slug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'
