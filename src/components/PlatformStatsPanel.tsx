import React, { useEffect, useState } from 'react';
import {
  Container,
  Card,
  Title,
  Grid,
  Stack,
  Text,
  Center,
  Loader,
  Group,
  Box,
  useMantineTheme,
} from '@mantine/core';
import {
  Users,
  UserCheck,
  UserPlus,
  Package,
  Clock,
  Star,
  TrendingUp,
  BadgeDollarSign,
  Activity,
  CheckCircle,
  Timer,
  Award,
  ListChecks,
} from 'lucide-react';

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

const statConfig = [
  {
    key: 'totalUsers',
    label: 'Total Users',
    icon: Users,
    color: 'indigo',
  },
  {
    key: 'totalFreeUsers',
    label: 'Free Tier Users',
    icon: UserCheck,
    color: 'blue',
  },
  {
    key: 'totalPremiumUsers',
    label: 'Review Fast Track Users',
    icon: UserPlus,
    color: 'teal',
  },
  {
    key: 'totalExtensions',
    label: 'Extensions in Libraries',
    icon: Package,
    color: 'violet',
  },
  {
    key: 'totalExtensionsInQueue',
    label: 'Extensions in Queue',
    icon: ListChecks,
    color: 'cyan',
  },
  {
    key: 'totalReviewsAssigned',
    label: 'Reviews Assigned',
    icon: TrendingUp,
    color: 'yellow',
  },
  {
    key: 'totalReviewsCompleted',
    label: 'Reviews Completed',
    icon: Star,
    color: 'orange',
  },
  {
    key: 'reviewsInProgress',
    label: 'Reviews In Progress',
    icon: Activity,
    color: 'pink',
  },
  {
    key: 'creditsEarned',
    label: 'Credits Earned',
    icon: BadgeDollarSign,
    color: 'green',
  },
  {
    key: 'activeReviewers',
    label: 'Active Reviewers (30d)',
    icon: Award,
    color: 'lime',
  },
  {
    key: 'reviewsCompletedLast7Days',
    label: 'Reviews Completed (7d)',
    icon: CheckCircle,
    color: 'grape',
  },
  {
    key: 'avgReviewCompletionTime',
    label: 'Avg. Review Completion Time',
    icon: Timer,
    color: 'gray',
  },
];

export function PlatformStatsPanel() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useMantineTheme();

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
      <Card
        withBorder
        radius="lg"
        p="xl"
        shadow="lg"
        style={{
          background:
            theme.colorScheme === 'dark'
              ? theme.colors.dark[7]
              : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
        }}
      >
        <Stack align="center" mb="xl" gap={0}>
          <Title order={2} size="2.2rem" ta="center" fw={800} c="indigo.8">
            Platform Stats
          </Title>
          <Text size="lg" c="dimmed" ta="center" mt={4} mb="md">
            Real-time growth and engagement across the ChromeExDev network
          </Text>
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
