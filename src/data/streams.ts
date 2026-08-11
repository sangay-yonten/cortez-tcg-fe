export type StreamStatus = 'live' | 'tonight' | 'upcoming'

export type StreamEvent = {
  id: string
  title: string
  day: string
  time: string
  focus: string
  status: StreamStatus
}

export const streams: StreamEvent[] = [
  {
    id: 'stream-tue',
    title: 'OP-05 Loose Pack Night',
    day: 'Tue',
    time: '7:00 PM ET',
    focus: 'Awakening of the New Era singles & slots',
    status: 'tonight',
  },
  {
    id: 'stream-wed',
    title: 'Hit or Miss Mystery Slots',
    day: 'Wed',
    time: '8:00 PM ET',
    focus: 'Community picks · chase alt arts',
    status: 'upcoming',
  },
  {
    id: 'stream-thu',
    title: 'OP-06 Case Break',
    day: 'Thu',
    time: '8:00 PM ET',
    focus: 'Wings of the Captain full case',
    status: 'upcoming',
  },
  {
    id: 'stream-fri',
    title: 'Friday Night Emperors',
    day: 'Fri',
    time: '7:30 PM ET',
    focus: 'OP-09 rip night with giveaways',
    status: 'upcoming',
  },
  {
    id: 'stream-sat',
    title: 'Weekend Pull Party',
    day: 'Sat',
    time: '6:00 PM ET',
    focus: 'Mixed set openings · nakama chat',
    status: 'upcoming',
  },
  {
    id: 'stream-sun',
    title: 'Sunday Special Arts',
    day: 'Sun',
    time: '5:00 PM ET',
    focus: 'Premium booster spotlight',
    status: 'upcoming',
  },
]
