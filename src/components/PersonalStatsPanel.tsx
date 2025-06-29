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
  Accordion,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconTrendingUp,
  IconClock,
  IconStar,
  IconTrophy,
  IconTarget,
  IconBolt,
  IconChartLine,
  IconMessageCircle,
  IconCompass,
  IconUser,
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

  // Free tier component with accordion
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
        <Accordion defaultValue="current-cycle" variant="separated">
          <Accordion.Item value="current-cycle">
            <Accordion.Control icon={<IconUser size={20} />}>
              <Group justify="space-between" style={{ width: '100%', marginRight: 20 }}>
                <Text fw={600} size="lg" style={{ color: "rgba(255, 255, 255, 1)" }}>
                  Your Usage This Cycle
                </Text>
                <Badge color="blue" variant="light">
                  Free Tier
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Text size="sm" style={{ color: 'rgba(255, 255, 255, 1)' }}>
                  Cycle: {new Date(freeStats.cycleStart).toLocaleDateString()} –{" "}
                  {new Date(freeStats.cycleEnd).toLocaleDateString()}
                  <br />
                  <b style={{ color: 'rgba(255, 255, 255, 1)' }}>{freeStats.daysLeftInCycle}</b> days left in this cycle
                </Text>
                <Group justify="space-between">
                  <Text style={{ color: 'rgba(255, 255, 255, 1)' }}>Reviews Submitted</Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 1)' }}>{freeStats.reviewsSubmittedThisCycle} / 4</Text>
                </Group>
                <Progress
                  value={reviewSubmitPct}
                  color="blue"
                  radius="xl"
                  size="md"
                />
                <Group justify="space-between">
                  <Text style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Reviews Received</Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.95)' }}>{freeStats.reviewsReceivedThisCycle} / 4</Text>
                </Group>
                <Progress
                  value={reviewReceivePct}
                  color="teal"
                  radius="xl"
                  size="md"
                />
                <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  You can submit <b style={{ color: 'rgba(255, 255, 255, 1)' }}>{freeStats.reviewsLeftToSubmit}</b> more and
                  receive <b style={{ color: 'rgba(255, 255, 255, 1)' }}>{freeStats.reviewsLeftToReceive}</b> more reviews this
                  cycle.
                </Text>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="lifetime-stats">
            <Accordion.Control icon={<IconTrendingUp size={20} />}>
              Lifetime Statistics
            </Accordion.Control>
            <Accordion.Panel>
              <Group justify="space-between" mt="md">
                <Text style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                  Total Submitted: <b>{freeStats.totalReviewsSubmitted}</b>
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                  Total Received: <b>{freeStats.totalReviewsReceived}</b>
                </Text>
              </Group>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="upgrade-info">
            <Accordion.Control icon={<IconBolt size={20} />}>
              Upgrade to Fast Track
            </Accordion.Control>
            <Accordion.Panel>
              <Alert color="yellow" radius="md">
                <Stack gap="sm">
                  <Text size="sm" fw={500} style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                    Unlock Premium Features:
                  </Text>
                  <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                    • Unlimited reviews per cycle<br/>
                    • Priority queue placement<br/>
                    • Advanced analytics & trends<br/>
                    • Instant review assignments<br/>
                    • Detailed performance insights
                  </Text>
                  <Button size="sm" color="orange" onClick={onUpgradeClick}>
                    Upgrade to Fast Track
                  </Button>
                </Stack>
              </Alert>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Card>
    );
  }

  // Premium tier component with accordion
  const premiumStats = stats as PremiumPersonalStats;

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Accordion defaultValue="overview" variant="separated">
        <Accordion.Item value="overview">
          <Accordion.Control icon={<IconTrophy size={20} />}>
            <Group justify="space-between" style={{ width: '100%', marginRight: 20 }}>
              <Text fw={600} size="lg" style={{ color: "rgba(255, 255, 255, 1)" }}>
                Review Fast Track Dashboard
              </Text>
              <Group>
                <Badge color="yellow" variant="filled" leftSection="⚡">
                  PREMIUM
                </Badge>
                <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.95)" }}>{premiumStats.badgeIcon}</Text>
                <Text size="sm" fw={500} style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                  {premiumStats.badgeRank}
                </Text>
              </Group>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Cycle: {new Date(premiumStats.cycleStart).toLocaleDateString()} –{" "}
                {new Date(premiumStats.cycleEnd).toLocaleDateString()}
                <br />
                <b style={{ color: 'rgba(255, 255, 255, 1)' }}>{premiumStats.daysLeftInCycle}</b> days left in this cycle
              </Text>

              {/* Main Stats Grid */}
              <SimpleGrid cols={2} spacing="md">
                <Card shadow="sm" p="md" radius="md" withBorder className="reviews-cycle-card">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500} style={{ color: 'red !important', fontWeight: '900 !important', backgroundColor: 'yellow !important', border: '5px solid blue !important' }}>
                      Reviews This Cycle
                    </Text>
                    <IconTrendingUp size={16} />
                  </Group>
                  <Group justify="space-between">
                    <div style={{ color: '#FF0000 !important', backgroundColor: 'yellow !important', border: '3px solid red !important', fontSize: '24px', fontWeight: '700', padding: '10px' }}>
                      {premiumStats.reviewsSubmittedThisCycle}
                    </div>
                    <Text size="sm" style={{ color: '#10b981' }}>
                      Unlimited
                    </Text>
                  </Group>
                  <span style={{ color: '#FF0000 !important', backgroundColor: '#00FF00 !important', border: '5px solid #0000FF !important', fontSize: '20px !important', fontWeight: '900 !important', display: 'block !important', padding: '10px !important' }}>
                    SUBMITTED TEST
                  </span>
                </Card>

                <Card shadow="sm" p="md" radius="md" withBorder className="reviews-received-card">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500} style={{ color: "rgba(255, 255, 255, 1)" }}>
                      Reviews Received
                    </Text>
                    <IconStar size={16} />
                  </Group>
                  <Text size="xl" fw={700} style={{ color: '#8b5cf6' }}>
                    {premiumStats.reviewsReceivedThisCycle}
                  </Text>
                  <Text size="xs" style={{ color: "rgba(255, 255, 255, 1)" }}>
                    This cycle
                  </Text>
                </Card>

                <Card shadow="sm" p="md" radius="md" withBorder className="queue-position-card">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500} style={{ color: "rgba(255, 255, 255, 1)" }}>
                      Queue Position
                    </Text>
                    <IconTarget size={16} />
                  </Group>
                  <Text size="xl" fw={700} style={{ color: '#f59e0b' }}>
                    #{premiumStats.queuePosition}
                  </Text>
                  <Text size="xs" style={{ color: "rgba(255, 255, 255, 1)" }}>
                    Priority queue
                  </Text>
                </Card>

                <Card shadow="sm" p="md" radius="md" withBorder className="avg-turnaround-card">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500} style={{ color: "rgba(255, 255, 255, 1)" }}>
                      Avg. Turnaround
                    </Text>
                    <IconClock size={16} />
                  </Group>
                  <Text size="xl" fw={700} style={{ color: '#06b6d4' }}>
                    {premiumStats.avgReviewTurnaroundTime || "N/A"}
                  </Text>
                  <Text size="xs" style={{ color: "rgba(255, 255, 255, 1)" }}>
                    Your reviews
                  </Text>
                </Card>
              </SimpleGrid>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="lifetime">
          <Accordion.Control icon={<IconUser size={20} />}>
            Lifetime Performance
          </Accordion.Control>
          <Accordion.Panel>
            <Group justify="space-around">
              <Stack align="center" gap={4}>
                <Text size="2xl" fw={700} style={{ color: '#3b82f6' }}>
                  {premiumStats.totalReviewsSubmitted}
                </Text>
                <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  Total Submitted
                </Text>
              </Stack>
              <Stack align="center" gap={4}>
                <Text size="2xl" fw={700} style={{ color: '#10b981' }}>
                  {premiumStats.totalReviewsReceived}
                </Text>
                <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  Total Received
                </Text>
              </Stack>
              <Stack align="center" gap={4}>
                <Text size="2xl" fw={700} style={{ color: '#f59e0b' }}>
                  {premiumStats.nextReviewETA}
                </Text>
                <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  Next Review ETA
                </Text>
              </Stack>
            </Group>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Review Trends */}
        {premiumStats.reviewTrends && premiumStats.reviewTrends.length > 0 && (
          <Accordion.Item value="trends">
            <Accordion.Control icon={<IconChartLine size={20} />}>
              6-Month Review Trends
            </Accordion.Control>
            <Accordion.Panel>
              <SimpleGrid cols={6} spacing="xs">
                {premiumStats.reviewTrends.map((trend, index) => (
                  <Stack key={index} align="center" gap={4}>
                    <Text size="xs" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                      {trend.month}
                    </Text>
                    <Stack align="center" gap={2}>
                      <Text size="sm" fw={500} style={{ color: "#3b82f6" }}>
                        {trend.submitted}
                      </Text>
                      <Text size="sm" fw={500} style={{ color: "#10b981" }}>
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
                  <Text size="xs" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
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
                  <Text size="xs" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    Received
                  </Text>
                </Group>
              </Group>
            </Accordion.Panel>
          </Accordion.Item>
        )}

        {/* Feedback Highlights */}
        {premiumStats.reviewerFeedbackHighlights &&
          premiumStats.reviewerFeedbackHighlights.length > 0 && (
            <Accordion.Item value="feedback">
              <Accordion.Control icon={<IconMessageCircle size={20} />}>
                Recent Positive Feedback
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  {premiumStats.reviewerFeedbackHighlights.map(
                    (feedback, index) => (
                      <Alert key={index} color="green" variant="light" p="sm">
                        <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.95)" }}>{feedback}</Text>
                      </Alert>
                    ),
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          )}

        {/* Platform Comparison */}
        {premiumStats.platformAverages && (
          <Accordion.Item value="comparison">
            <Accordion.Control icon={<IconCompass size={20} />}>
              Platform Comparison
            </Accordion.Control>
            <Accordion.Panel>
              <SimpleGrid cols={3} spacing="md">
                <Stack align="center" gap={4}>
                  <Text size="lg" fw={700} style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                    {premiumStats.totalReviewsSubmitted}
                  </Text>
                  <Text size="xs" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    Your Reviews
                  </Text>
                  <Text size="xs" style={{ color: "#3b82f6" }}>
                    vs {premiumStats.platformAverages.avgSubmitted} avg
                  </Text>
                </Stack>
                <Stack align="center" gap={4}>
                  <Text size="lg" fw={700} style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                    {premiumStats.avgReviewTurnaroundTime || "N/A"}
                  </Text>
                  <Text size="xs" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    Your Speed
                  </Text>
                  <Text size="xs" style={{ color: "#3b82f6" }}>
                    vs {premiumStats.platformAverages.avgTurnaround}h avg
                  </Text>
                </Stack>
                <Stack align="center" gap={4}>
                  <Text size="lg" fw={700} style={{ color: "#fbbf24" }}>
                    Fast Track
                  </Text>
                  <Text size="xs" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    Your Status
                  </Text>
                                    <Text size="xs" style={{ color: "#10b981" }}>
                    Premium Member
                  </Text>
                </Stack>
              </SimpleGrid>
             </Accordion.Panel>
           </Accordion.Item>
         )}
       </Accordion>
     </Card>
  );
};

export default PersonalStatsPanel;
