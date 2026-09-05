import { describe, expect, it } from 'vitest'
import { encodingJobsRefetchInterval } from './dashboard'
import type { EncodingJobItem } from './types'

function query(data: EncodingJobItem[] | undefined) {
  return { state: { data } }
}

describe('encodingJobsRefetchInterval (régression F-02)', () => {
  it('stops polling when the job list is empty', () => {
    expect(encodingJobsRefetchInterval(query([]))).toBe(false)
  })

  it('stops polling when there is no data yet', () => {
    expect(encodingJobsRefetchInterval(query(undefined))).toBe(false)
  })

  it('stops polling once every job is in a terminal state', () => {
    expect(
      encodingJobsRefetchInterval(
        query([
          { prayerId: '1', state: 'READY' },
          { prayerId: '2', state: 'FAILED' },
        ]),
      ),
    ).toBe(false)
  })

  it('keeps polling at 5000ms while at least one job is not terminal', () => {
    expect(
      encodingJobsRefetchInterval(
        query([
          { prayerId: '1', state: 'READY' },
          { prayerId: '2', state: 'TRANSCODING' },
        ]),
      ),
    ).toBe(5000)
  })

  it('treats a job with a null/undefined state as non-terminal', () => {
    expect(encodingJobsRefetchInterval(query([{ prayerId: '1', state: undefined }]))).toBe(5000)
  })
})
