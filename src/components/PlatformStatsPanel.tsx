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
    return '/.netlify/functions/fetch_platform_stats';
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

  // NUCLEAR COLOR FORCING for Platform Stats
  useEffect(() => {
    const forcePlatformStatsColors = () => {
      console.log('🔥 NUCLEAR: Force coloring Platform Stats');
      
      // Define vibrant colors for each stat type
      const statColors = {
        'Total Users': '#6366f1',           // Indigo
        'Free Tier Users': '#3b82f6',       // Blue
        'Review Fast Track Users': '#14b8a6', // Teal
        'Extensions in Libraries': '#8b5cf6', // Violet
        'Extensions in Queue': '#06b6d4',   // Cyan
        'Reviews Assigned': '#f59e0b',      // Yellow
        'Reviews Completed': '#f97316',     // Orange
        'Reviews In Progress': '#ec4899',   // Pink
        'Credits Earned': '#10b981',        // Green
        'Active Reviewers (30d)': '#84cc16', // Lime
        'Reviews Completed (7d)': '#9333ea', // Grape
        'Avg. Review Completion Time': '#6b7280' // Gray
      };

             // Target all stat boxes + Mantine Text components
       const allElements = document.querySelectorAll('*');
       
       // NUCLEAR: Also specifically target Mantine Text components
       const mantineTexts = document.querySelectorAll('[class*="mantine-Text"], [class*="Text-root"]');
       console.log(`🔥 Found ${mantineTexts.length} Mantine Text components`);
       
       mantineTexts.forEach((el) => {
         if (el instanceof HTMLElement && el.textContent) {
           const text = el.textContent.trim();
           console.log(`🔥 NUCLEAR: Mantine Text component: "${text}"`);
           
           // If it's not a number, force it to be bright white
           if (!(/^\d+$/.test(text)) && text.length > 3) {
             console.log(`🔥 NUCLEAR: Forcing Mantine Text to bright white: "${text}"`);
             el.style.color = '#ffffff';
             el.style.setProperty('color', '#ffffff', 'important');
             (el.style as any).webkitTextFillColor = '#ffffff';
             el.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
             el.style.fontWeight = '600';
             el.style.setProperty('font-weight', '600', 'important');
             el.style.opacity = '1';
             el.style.setProperty('opacity', '1', 'important');
             el.style.textShadow = '0 0 2px rgba(255,255,255,0.9)';
             el.style.setProperty('text-shadow', '0 0 2px rgba(255,255,255,0.9)', 'important');
           }
         }
       });
       
       allElements.forEach((el) => {
        if (el instanceof HTMLElement && el.textContent) {
          const text = el.textContent.trim();
          
          // Force bright colors for large numbers (the main stat values)
          if (/^\d+$/.test(text) && text.length >= 1) {
            console.log(`🔥 FORCING BRIGHT COLOR for stat number: "${text}"`);
            
            // Find the parent container to determine which stat this is
            let parent = el.parentElement;
            let statType = '';
            
            // Look for the label in siblings or parent elements
            while (parent && !statType) {
              const siblings = parent.querySelectorAll('*');
              siblings.forEach(sibling => {
                if (sibling instanceof HTMLElement) {
                  const siblingText = sibling.textContent || '';
                  Object.keys(statColors).forEach(key => {
                    if (siblingText.includes(key)) {
                      statType = key;
                    }
                  });
                }
              });
              parent = parent.parentElement;
            }
            
            const color = statColors[statType] || '#ffffff';
            console.log(`🔥 Using color ${color} for stat: ${statType}`);
            
            // Apply nuclear color forcing
            el.style.color = color;
            el.style.setProperty('color', color, 'important');
            (el.style as any).webkitTextFillColor = color;
            el.style.setProperty('-webkit-text-fill-color', color, 'important');
            el.style.fontWeight = '800';
            el.style.setProperty('font-weight', '800', 'important');
            el.style.fontSize = '2.2rem';
            el.style.setProperty('font-size', '2.2rem', 'important');
          }
          
                     // Force bright white for stat labels - SUPER AGGRESSIVE
           const labelTexts = [
             'Total Users', 'Free Tier Users', 'Review Fast Track Users', 
             'Extensions in Libraries', 'Extensions in Queue', 'Reviews Assigned',
             'Reviews Completed', 'Reviews In Progress', 'Credits Earned',
             'Active Reviewers (30d)', 'Reviews Completed (7d)', 'Avg. Review Completion Time'
           ];
           
           labelTexts.forEach(labelText => {
             if (text.includes(labelText) || text === labelText) {
               console.log(`🔥 NUCLEAR: FORCING BRIGHT WHITE for label: "${labelText}"`);
               el.style.color = '#ffffff';
               el.style.setProperty('color', '#ffffff', 'important');
               (el.style as any).webkitTextFillColor = '#ffffff';
               el.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
               el.style.fontWeight = '600';
               el.style.setProperty('font-weight', '600', 'important');
               el.style.opacity = '1';
               el.style.setProperty('opacity', '1', 'important');
               el.style.fontSize = '14px';
               el.style.setProperty('font-size', '14px', 'important');
               
               // Extra nuclear overrides
               el.style.textShadow = '0 0 1px rgba(255,255,255,0.8)';
               el.style.setProperty('text-shadow', '0 0 1px rgba(255,255,255,0.8)', 'important');
             }
           });
           
           // NUCLEAR: Target any small text that might be labels
           if (el.tagName && (el.tagName.toLowerCase() === 'span' || el.tagName.toLowerCase() === 'div')) {
             const fontSize = window.getComputedStyle(el).fontSize;
             const isSmallText = fontSize && (parseInt(fontSize) < 20);
             
             if (isSmallText && text.length > 5 && !(/^\d+$/.test(text))) {
               console.log(`🔥 NUCLEAR: Small text detected, forcing white: "${text}"`);
               el.style.color = '#ffffff';
               el.style.setProperty('color', '#ffffff', 'important');
               (el.style as any).webkitTextFillColor = '#ffffff';
               el.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
               el.style.fontWeight = '600';
               el.style.setProperty('font-weight', '600', 'important');
               el.style.opacity = '1';
               el.style.setProperty('opacity', '1', 'important');
               el.style.textShadow = '0 0 1px rgba(255,255,255,0.8)';
               el.style.setProperty('text-shadow', '0 0 1px rgba(255,255,255,0.8)', 'important');
             }
           }
          
          // Force specific time format colors for completion time
          if (text.includes('hours') || text.includes('minutes') || /^\d+\.\d+h$/.test(text)) {
            console.log(`🔥 FORCING CYAN for time value: "${text}"`);
            el.style.color = '#06b6d4';
            el.style.setProperty('color', '#06b6d4', 'important');
            (el.style as any).webkitTextFillColor = '#06b6d4';
            el.style.setProperty('-webkit-text-fill-color', '#06b6d4', 'important');
            el.style.fontWeight = '800';
            el.style.setProperty('font-weight', '800', 'important');
          }
        }
      });
    };

    // Run color forcing with multiple timing intervals
    const timeouts = [0, 100, 500, 1000, 2000, 3000];
    timeouts.forEach(delay => {
      setTimeout(forcePlatformStatsColors, delay);
    });

    // Add event listeners for dynamic content
    window.addEventListener('scroll', forcePlatformStatsColors);
    window.addEventListener('resize', forcePlatformStatsColors);

    return () => {
      window.removeEventListener('scroll', forcePlatformStatsColors);
      window.removeEventListener('resize', forcePlatformStatsColors);
    };
  }, [stats]); // Re-run when stats change

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
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
        }}
      >
        <Stack align="center" mb="xl" gap={0}>
          <Title order={2} size="2.2rem" ta="center" fw={800} c="indigo.8">
            Platform Stats
          </Title>
          <Text size="lg" ta="center" mt={4} mb="md" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
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
  // Define vibrant colors for each stat type
  const statColors: { [key: string]: string } = {
    'indigo': '#6366f1',
    'blue': '#3b82f6', 
    'teal': '#14b8a6',
    'violet': '#8b5cf6',
    'cyan': '#06b6d4',
    'yellow': '#f59e0b',
    'orange': '#f97316',
    'pink': '#ec4899',
    'green': '#10b981',
    'lime': '#84cc16',
    'grape': '#9333ea',
    'gray': '#6b7280'
  };

  const vibrantColor = statColors[color] || '#ffffff';
  const bgColor = (theme.colors[color] && theme.colors[color][0]) || '#f3f4f6';

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
        <Icon size={32} color={vibrantColor} />
      </Group>
      <Text 
        fw={800} 
        size="2.2rem" 
        lh={1}
        style={{ 
          color: vibrantColor,
          fontWeight: '800',
          fontSize: '2.2rem',
          WebkitTextFillColor: vibrantColor
        }}
      >
        {value}
      </Text>
      <Text 
        size="sm" 
        ta="center" 
        mt={2} 
        style={{ 
          color: '#ffffff',
          fontWeight: '500',
          opacity: 1,
          WebkitTextFillColor: '#ffffff'
        }}
      >
        {label}
      </Text>
    </Box>
  );
}
