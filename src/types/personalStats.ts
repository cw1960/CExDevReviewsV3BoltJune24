// PersonalStats interface for user dashboard usage stats

export interface PersonalStats {
  cycleStart: string;
  cycleEnd: string;
  daysLeftInCycle: number;
  reviewsSubmittedThisCycle: number;
  reviewsReceivedThisCycle: number;
  reviewsLeftToSubmit: number;
  reviewsLeftToReceive: number;
  totalReviewsSubmitted: number;
  totalReviewsReceived: number;
  avgWaitTimeDays?: number;
  queuePosition?: number;
} 