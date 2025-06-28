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

// Premium PersonalStats interface for Review Fast Track users
export interface PremiumPersonalStats {
  cycleStart: string;
  cycleEnd: string;
  daysLeftInCycle: number;
  reviewsSubmittedThisCycle: number;
  reviewsReceivedThisCycle: number;
  totalReviewsSubmitted: number;
  totalReviewsReceived: number;
  queuePosition?: number;
  avgWaitTimeDays?: number;
  avgReviewTurnaroundTime?: number;
  reviewTrends?: Array<{ month: string; submitted: number; received: number }>;
  reviewerFeedbackHighlights?: string[];
  extensionPerformance?: Array<{
    extensionId: string;
    downloads: number;
    rating: number;
  }>;
  priorityQueueStatus?: string;
  nextReviewETA?: string;
  platformAverages?: {
    avgSubmitted: number;
    avgReceived: number;
    avgTurnaround: number;
  };
  badgeRank?: string;
  badgeIcon?: string;
}
