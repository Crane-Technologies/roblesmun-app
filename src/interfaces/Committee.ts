export interface Committee {
  name: string;
  topic: string;
  img: string;
  seats: number;
  seatsList: Array<{
    name: string;
    available: boolean;
  }>;
  description?: string;
  video?: string;
  studyGuide?: string;
  legalFramework?: string[];
  president?: string;
  maxSeatsPerSmallDelegation?: number; // Máximo de cupos para delegación pequeña (< 13)
  maxSeatsPerLargeDelegation?: number; // Máximo de cupos para delegación grande (>= 13)
}
