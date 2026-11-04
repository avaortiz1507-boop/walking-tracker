

export type SavedWalk = {
  id: string;
  dateTime: string;
  startLatitude: number;
  startLongitude: number;
  status: string;
};

export const sampleWalks: SavedWalk[] = [
  {
    id: "1",
    dateTime: "October 1, 2026 at 10:00 AM",
    startLatitude: 47.6062,
    startLongitude: -122.3321,
    status: "Completed",
  },
  {
    id: "2",
    dateTime: "October 17, 2026 at 5:45 PM",
    startLatitude: 47.6205,
    startLongitude: -122.3493,
    status: "Completed",
  },
  {
    id: "3",
    dateTime: "October 28, 2026 at 7:15 AM",
    startLatitude: 47.6097,
    startLongitude: -122.3331,
    status: "Completed",
  },
];
