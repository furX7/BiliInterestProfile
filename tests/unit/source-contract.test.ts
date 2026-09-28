import { describe, expect, it } from 'vitest'
import {
  evidenceItemSchema,
  profileContextSchema,
  sourceResultSchema,
} from '../../src/core/contracts/source.schema'

const profile = {
  userId: '123',
  displayName: 'Sample User',
  description: null,
  sourceUrl: 'https://space.bilibili.com/123',
}

const evidence = {
  source: 'dynamic',
  userId: '123',
  title: null,
  text: 'Current user description',
  timestamp: null,
  sourceUrl: 'https://space.bilibili.com/123/dynamic',
  traceGranularity: 'page',
}

describe('source contract', () => {
  it('accepts profile context without treating it as evidence', () => {
    expect(profileContextSchema.parse(profile)).toEqual(profile)
    expect(evidenceItemSchema.safeParse({ ...profile, source: 'profile' }).success).toBe(false)
  })

  it('accepts dynamic evidence with page-level trace and missing exact time', () => {
    expect(evidenceItemSchema.parse(evidence)).toEqual(evidence)
    expect(sourceResultSchema(evidenceItemSchema).parse({
      status: 'partial', data: evidence, warnings: [],
    }).data).toEqual(evidence)
  })

  it('rejects other evidence sources, missing identity and empty text', () => {
    expect(evidenceItemSchema.safeParse({ ...evidence, source: 'profile' }).success).toBe(false)
    expect(evidenceItemSchema.safeParse({ ...evidence, userId: '' }).success).toBe(false)
    expect(evidenceItemSchema.safeParse({ ...evidence, text: '  ' }).success).toBe(false)
  })

  it('keeps unknown and unavailable without evidence, and empty only with an empty collection', () => {
    const listSchema = sourceResultSchema(evidenceItemSchema.array())
    for (const status of ['unknown', 'unavailable']) {
      expect(listSchema.safeParse({ status, data: null, warnings: [] }).success).toBe(true)
      expect(listSchema.safeParse({ status, data: [evidence], warnings: [] }).success).toBe(false)
    }
    expect(listSchema.safeParse({ status: 'empty', data: [], warnings: [] }).success).toBe(true)
    expect(listSchema.safeParse({ status: 'empty', data: null, warnings: [] }).success).toBe(false)
    expect(listSchema.safeParse({ status: 'empty', data: [evidence], warnings: [] }).success).toBe(false)
    expect(listSchema.safeParse({ status: 'available', data: null, warnings: [] }).success).toBe(false)
  })
})
