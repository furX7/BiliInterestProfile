import { describe, expect, it } from 'vitest'
import { isValidExtensionVersion } from '../../wxt.config'

describe('Chrome/Edge extension version contract', () => {
  it.each(['1', '0.1.0', '65535', '1.2.3.4'])('accepts %s', (version) => {
    expect(isValidExtensionVersion(version)).toBe(true)
  })

  it.each(['0', '0.0.0.0', '032', '1.02', '1.70000', '65536', '1.2.3.4.5', '-1', '1a'])(
    'rejects %s',
    (version) => {
      expect(isValidExtensionVersion(version)).toBe(false)
    },
  )

  it('rejects missing or non-string versions', () => {
    expect(isValidExtensionVersion(undefined)).toBe(false)
    expect(isValidExtensionVersion(1)).toBe(false)
  })
})
