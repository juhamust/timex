import { roundDuration } from '../scripts/lib'

it('rounds duration', () => {
  expect(roundDuration(840)).toEqual({ hours: 0, minutes: 0 }) // 14 mins
  expect(roundDuration(1500)).toEqual({ hours: 0, minutes: 30 }) // 25 mins
  expect(roundDuration(2100)).toEqual({ hours: 0, minutes: 30 }) // 36 mins
  expect(roundDuration(2760)).toEqual({ hours: 1, minutes: 0 }) // 46 mins
  expect(roundDuration(6360)).toEqual({ hours: 2, minutes: 0 }) // 1h 46 mins
})