import React, { useEffect, useState } from 'react';
import { Container, Card, Title, Grid, Stack, Text, Center, Loader } from '@mantine/core';

// Utility to auto-detect Netlify vs Supabase Edge Functions
function getStatsFunctionUrl() {
  // If running on Netlify (production or preview), use Netlify Functions path
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('netlify.app') ||
     window.location.hostname.includes('chromeexdev.reviews') ||
     window.location.hostname.includes('chromexdev.reviews'))
  ) {
    return '/.netlify/functions/fetch-platform-stats';
  }
  // Default to Supabase Edge Functions path (local dev or Supabase hosting)
  return '/functions/v1/fetch-platform-stats';
}

export function PlatformStatsPanel() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(getStatsFunctionUrl());
        const json = await res.json();
        if (json.success) {
          setStats(json.stats);
        } else {
          setError(json.error || 'Failed to load stats');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <Center my="xl"><Loader /></Center>;
  if (error) return <Center my="xl"><Text c="red">{error}</Text></Center>;
  if (!stats) return null;

  return (
    <Container size="lg" my="xl">
      <Card withBorder radius="md" p="xl" shadow="sm">
        <Title order={2} size="h2" mb="md" ta="center">Platform Stats</Title>
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Total Users" value={stats.totalUsers} /></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Free Tier Users" value={stats.totalFreeUsers} /></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Review Fast Track Users" value={stats.totalPremiumUsers} /></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Extensions in Libraries" value={stats.totalExtensions} /></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Extensions in Queue" value={stats.totalExtensionsInQueue} /></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Reviews Assigned" value={stats.totalReviewsAssigned} /></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Reviews Completed" value={stats.totalReviewsCompleted} /></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Reviews In Progress" value={stats.reviewsInProgress} /></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Credits Earned" value={stats.creditsEarned} /></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Active Reviewers (30d)" value={stats.activeReviewers} /></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Reviews Completed (7d)" value={stats.reviewsCompletedLast7Days} /></Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}><StatItem label="Avg. Review Completion Time" value={stats.avgReviewCompletionTime} /></Grid.Col>
        </Grid>
      </Card>
    </Container>
  );
}

function StatItem({ label, value }: { label: string, value: any }) {
  return (
    <Stack align="center" gap={2}>
      <Text fw={700} size="2rem">{value}</Text>
      <Text c="dimmed" size="sm" ta="center">{label}</Text>
    </Stack>
  );
} t>
        </Stack>
        <Grid gutter="xl">
          {statConfig.map(({ key, label, icon: Icon, color }) => (
            <Grid.Col key={key} span={{ base: 12, sm: 6, md: 4 }}>
              <StatItem
                label={label}
                value={stats[key]}
                Icon={Icon}
                color={color}
                theme={theme}
              />
            </Grid.Col>
          ))}
        </Grid>
      </Card>
    </Container>
  );
}

function StatItem({
  label,
  value,
  Icon,
  color,
  theme,
}: {
  label: string;
  value: any;
  Icon: React.FC<any>;
  color: string;
  theme: any;
}) {
  // Fallback color for Mantine v5
  const bgColor =
    theme.colorScheme === 'dark'
      ? theme.colors.dark[5]
      : (theme.colors[color] && theme.colors[color][0]) || '#f3f4f6';

  const textColor =
    (theme.colors[color] && theme.colors[color][7]) || theme.colors.dark[0];

  return (
    <Box
      p="md"
      style={{
        background: bgColor,
        borderRadius: theme.radius.md,
        boxShadow: theme.shadows.xs,
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'box-shadow 0.2s',
      }}
    >
      <Group mb={8} justify="center">
        <Icon size={32} color={textColor} />
      </Group>
      <Text fw={800} size="2.2rem" c={textColor} lh={1}>
        {value}
      </Text>
      <Text c="dimmed" size="sm" ta="center" mt={2}>
        {label}
      </Text>
    </Box>
  );
}
