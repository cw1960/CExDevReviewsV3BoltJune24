import React from 'react';
import { Card, Group, Text, Progress, Tooltip, Button, Stack, Loader, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { PersonalStats } from '../types/personalStats';

interface PersonalStatsPanelProps {
  stats?: PersonalStats;
  loading: boolean;
  error?: string;
  onUpgradeClick?: () => void;
}

export const PersonalStatsPanel: React.FC<PersonalStatsPanelProps> = ({ stats, loading, error, onUpgradeClick }) => {
  if (loading) {
    return (
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Group position="center"><Loader size="md" /></Group>
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

  const reviewSubmitPct = Math.min(100, (stats.reviewsSubmittedThisCycle / 4) * 100);
  const reviewReceivePct = Math.min(100, (stats.reviewsReceivedThisCycle / 4) * 100);

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Stack spacing="md">
        <Group position="apart">
          <Text weight={600} size="lg">Your Usage This Cycle</Text>
          <Tooltip label="Your 28-day review cycle usage. Upgrade for unlimited reviews!" withArrow>
            <IconInfoCircle size={18} />
          </Tooltip>
        </Group>
        <Text size="sm" color="dimmed">
          Cycle: {new Date(stats.cycleStart).toLocaleDateString()} – {new Date(stats.cycleEnd).toLocaleDateString()}<br />
          <b>{stats.daysLeftInCycle}</b> days left in this cycle
        </Text>
        <Group position="apart">
          <Text>Reviews Submitted</Text>
          <Text>{stats.reviewsSubmittedThisCycle} / 4</Text>
        </Group>
        <Progress value={reviewSubmitPct} color="blue" radius="xl" size="md" />
        <Group position="apart">
          <Text>Reviews Received</Text>
          <Text>{stats.reviewsReceivedThisCycle} / 4</Text>
        </Group>
        <Progress value={reviewReceivePct} color="teal" radius="xl" size="md" />
        <Text size="sm" color="dimmed">
          You can submit <b>{stats.reviewsLeftToSubmit}</b> more and receive <b>{stats.reviewsLeftToReceive}</b> more reviews this cycle.
        </Text>
        <Group position="apart" mt="md">
          <Text>Total Submitted: <b>{stats.totalReviewsSubmitted}</b></Text>
          <Text>Total Received: <b>{stats.totalReviewsReceived}</b></Text>
        </Group>
        {/* Motivator/teaser section */}
        <Alert color="yellow" mt="md" radius="md">
          <Group position="apart">
            <Text size="sm">Want unlimited reviews, instant assignments, and priority queue?</Text>
            <Button size="xs" color="orange" onClick={onUpgradeClick}>Upgrade to Fast Track</Button>
          </Group>
        </Alert>
      </Stack>
    </Card>
  );
};

export default PersonalStatsPanel; 