import React from "react";
import {
  Card,
  Group,
  Text,
  Progress,
  Tooltip,
  Button,
  Stack,
  Loader,
  Alert,
  Grid,
  Badge,
  Title,
  ThemeIcon,
  SimpleGrid,
  Divider,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconTrendingUp,
  IconClock,
  IconStar,
  IconTrophy,
  IconTarget,
  IconBolt,
} from "@tabler/icons-react";
import { PersonalStats, PremiumPersonalStats } from "../types/personalStats";

interface PersonalStatsPanelProps {
  stats?: PersonalStats | PremiumPersonalStats;
  loading: boolean;
  error?: string;
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}

// Type guard to check if stats are premium
function isPremiumStats(
  stats: PersonalStats | PremiumPersonalStats,
): stats is PremiumPersonalStats {
  return "badgeRank" in stats;
}

export const PersonalStatsPanel: React.FC<PersonalStatsPanelProps> = ({
  stats,
  loading,
  error,
  isPremium = false,
  onUpgradeClick,
}) => {
  if (loading) {
    return (
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Group justify="center">
          <Loader size="md" />
        </Group>
      </Card>
    );
  }

  if (error) {
    return (
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Alert color="red">{error}</Alert>
      </Card>
    );
  }

  if (!stats) return null;

  // Free tier component
  if (!isPremium || !isPremiumStats(stats)) {
    const freeStats = stats as PersonalStats;
    const reviewSubmitPct = Math.min(
      100,
      (freeStats.reviewsSubmittedThisCycle / 4) * 100,
    );
    const reviewReceivePct = Math.min(
      100,
      (freeStats.reviewsReceivedThisCycle / 4) * 100,
    );

    return (
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="lg">
              Your Usage This Cycle
            </Text>
            <Tooltip
              label="Your 28-day review cycle usage. Upgrade for unlimited reviews!"
              withArrow
            >
              <IconInfoCircle size={18} />
            </Tooltip>
          </Group>
          <Text size="sm" c="dimmed">
            Cycle: {new Date(freeStats.cycleStart).toLocaleDateString()} –{" "}
            {new Date(freeStats.cycleEnd).toLocaleDateString()}
            <br />
            <b>{freeStats.daysLeftInCycle}</b> days left in this cycle
          </Text>
          <Group justify="space-between">
            <Text>Reviews Submitted</Text>
            <Text>{freeStats.reviewsSubmittedThisCycle} / 4</Text>
          </Group>
          <Progress
            value={reviewSubmitPct}
            color="blue"
            radius="xl"
            size="md"
          />
          <Group justify="space-between">
            <Text>Reviews Received</Text>
            <Text>{freeStats.reviewsReceivedThisCycle} / 4</Text>
          </Group>
          <Progress
            value={reviewReceivePct}
            color="teal"
            radius="xl"
            size="md"
          />
          <Text size="sm" c="dimmed">
            You can submit <b>{freeStats.reviewsLeftToSubmit}</b> more and
            receive <b>{freeStats.reviewsLeftToReceive}</b> more reviews this
            cycle.
          </Text>
          <Group justify="space-between" mt="md">
            <Text>
              Total Submitted: <b>{freeStats.totalReviewsSubmitted}</b>
            </Text>
            <Text>
              Total Received: <b>{freeStats.totalReviewsReceived}</b>
            </Text>
          </Group>
          {/* Motivator/teaser section */}
          <Alert color="yellow" mt="md" radius="md">
            <Group justify="space-between">
              <Text size="sm">
                Want unlimited reviews, instant assignments, and priority queue?
              </Text>
              <Button size="xs" color="orange" onClick={onUpgradeClick}>
                Upgrade to Fast Track
              </Button>
            </Group>
          </Alert>
        </Stack>
      </Card>
    );
  }

  // Premium tier component
  const premiumStats = stats as PremiumPersonalStats;

  return (
    <Stack gap="md">
      {/* Header Card with Badge */}
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <Text fw={600} size="lg">
              Review Fast Track Dashboard
            </Text>
            <Badge color="yellow" variant="filled" leftSection="⚡">
              PREMIUM
            </Badge>
          </Group>
          <Group>
            <Text size="sm">{premiumStats.badgeIcon}</Text>
            <Text size="sm" fw={500}>
              {premiumStats.badgeRank}
            </Text>
          </Group>
        </Group>

        <Text size="sm" c="dimmed">
          Cycle: {new Date(premiumStats.cycleStart).toLocaleDateString()} –{" "}
          {new Date(premiumStats.cycleEnd).toLocaleDateString()}
          <br />
          <b>{premiumStats.daysLeftInCycle}</b> days left in this cycle
        </Text>
      </Card>

      {/* Main Stats Grid */}
      <SimpleGrid cols={2} spacing="md">
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">
              Reviews This Cycle
            </Text>
            <IconTrendingUp size={16} />
          </Group>
          <Group justify="space-between">
            <Text size="xl" fw={700}>
              {premiumStats.reviewsSubmittedThisCycle}
            </Text>
            <Text size="sm" c="green">
              Unlimited
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Submitted
          </Text>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">
              Reviews Received
            </Text>
            <IconStar size={16} />
          </Group>
          <Text size="xl" fw={700}>
            {premiumStats.reviewsReceivedThisCycle}
          </Text>
          <Text size="xs" c="dimmed">
            This cycle
          </Text>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">
              Queue Position
            </Text>
            <IconTarget size={16} />
          </Group>
          <Text size="xl" fw={700} c="yellow">
            #{premiumStats.queuePosition}
          </Text>
          <Text size="xs" c="dimmed">
            Priority queue
          </Text>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">
              Avg. Turnaround
            </Text>
            <IconClock size={16} />
          </Group>
          <Text size="xl" fw={700}>
            {premiumStats.avgReviewTurnaroundTime || "N/A"}
          </Text>
          <Text size="xs" c="dimmed">
            Your reviews
          </Text>
        </Card>
      </SimpleGrid>

      {/* Lifetime Stats */}
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Title order={4} mb="md">
          Lifetime Performance
        </Title>
        <Group justify="space-around">
          <Stack align="center" gap={4}>
            <Text size="2xl" fw={700} c="blue">
              {premiumStats.totalReviewsSubmitted}
            </Text>
            <Text size="sm" c="dimmed">
              Total Submitted
            </Text>
          </Stack>
          <Stack align="center" gap={4}>
            <Text size="2xl" fw={700} c="teal">
              {premiumStats.totalReviewsReceived}
            </Text>
            <Text size="sm" c="dimmed">
              Total Received
            </Text>
          </Stack>
          <Stack align="center" gap={4}>
            <Text size="2xl" fw={700} c="yellow">
              {premiumStats.nextReviewETA}
            </Text>
            <Text size="sm" c="dimmed">
              Next Review ETA
            </Text>
          </Stack>
        </Group>
      </Card>

      {/* Review Trends */}
      {premiumStats.reviewTrends && premiumStats.reviewTrends.length > 0 && (
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Title order={4} mb="md">
            6-Month Review Trends
          </Title>
          <SimpleGrid cols={6} spacing="xs">
            {premiumStats.reviewTrends.map((trend, index) => (
              <Stack key={index} align="center" gap={4}>
                <Text size="xs" c="dimmed">
                  {trend.month}
                </Text>
                <Stack align="center" gap={2}>
                  <Text size="sm" fw={500} c="blue">
                    {trend.submitted}
                  </Text>
                  <Text size="sm" fw={500} c="teal">
                    {trend.received}
                  </Text>
                </Stack>
              </Stack>
            ))}
          </SimpleGrid>
          <Group mt="sm" gap="md">
            <Group gap={4}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: "var(--mantine-color-blue-6)",
                  borderRadius: "50%",
                }}
              />
              <Text size="xs" c="dimmed">
                Submitted
              </Text>
            </Group>
            <Group gap={4}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: "var(--mantine-color-teal-6)",
                  borderRadius: "50%",
                }}
              />
              <Text size="xs" c="dimmed">
                Received
              </Text>
            </Group>
          </Group>
        </Card>
      )}

      {/* Feedback Highlights */}
      {premiumStats.reviewerFeedbackHighlights &&
        premiumStats.reviewerFeedbackHighlights.length > 0 && (
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={4} mb="md">
              Recent Positive Feedback
            </Title>
            <Stack gap="xs">
              {premiumStats.reviewerFeedbackHighlights.map(
                (feedback, index) => (
                  <Alert key={index} color="green" variant="light" p="sm">
                    <Text size="sm">{feedback}</Text>
                  </Alert>
                ),
              )}
            </Stack>
          </Card>
        )}

      {/* Platform Comparison */}
      {premiumStats.platformAverages && (
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Title order={4} mb="md">
            Platform Comparison
          </Title>
          <SimpleGrid cols={3} spacing="md">
            <Stack align="center" gap={4}>
              <Text size="lg" fw={700}>
                {premiumStats.totalReviewsSubmitted}
              </Text>
              <Text size="xs" c="dimmed">
                Your Reviews
              </Text>
              <Text size="xs" c="blue">
                vs {premiumStats.platformAverages.avgSubmitted} avg
              </Text>
            </Stack>
            <Stack align="center" gap={4}>
              <Text size="lg" fw={700}>
                {premiumStats.avgReviewTurnaroundTime || "N/A"}
              </Text>
              <Text size="xs" c="dimmed">
                Your Speed
              </Text>
              <Text size="xs" c="blue">
                vs {premiumStats.platformAverages.avgTurnaround}h avg
              </Text>
            </Stack>
            <Stack align="center" gap={4}>
              <Text size="lg" fw={700} c="yellow">
                Fast Track
              </Text>
              <Text size="xs" c="dimmed">
                Your Status
              </Text>
              <Text size="xs" c="green">
                Premium Member
              </Text>
            </Stack>
          </SimpleGrid>
        </Card>
      )}
    </Stack>
  );
};

export default PersonalStatsPanel;
