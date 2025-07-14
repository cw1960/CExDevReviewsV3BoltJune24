import React, { useEffect, useState } from "react";
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
} from "@mantine/core";
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
} from "lucide-react";

// Utility to auto-detect Netlify vs Supabase Edge Functions
function getStatsFunctionUrl() {
  // If running on Netlify (production or preview), use Netlify Functions path
  if (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("netlify.app") ||
      window.location.hostname.includes("chromeexdev.reviews") ||
      window.location.hostname.includes("chromexdev.reviews"))
  ) {
    return "/.netlify/functions/fetch_platform_stats";
  }
  // Default to Supabase Edge Functions path (local dev or Supabase hosting)
  return "/functions/v1/fetch-platform-stats";
}

const statConfig = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: Users,
    color: "indigo",
  },
  {
    key: "totalFreeUsers",
    label: "Free Tier Users",
    icon: UserCheck,
    color: "blue",
  },
  {
    key: "totalPremiumUsers",
    label: "Review Fast Track Users",
    icon: UserPlus,
    color: "teal",
  },
  {
    key: "totalExtensions",
    label: "Extensions in Libraries",
    icon: Package,
    color: "violet",
  },
  {
    key: "totalExtensionsInQueue",
    label: "Extensions in Queue",
    icon: ListChecks,
    color: "cyan",
  },
  {
    key: "totalReviewsAssigned",
    label: "Reviews Assigned",
    icon: TrendingUp,
    color: "yellow",
  },
  {
    key: "totalReviewsCompleted",
    label: "Reviews Completed",
    icon: Star,
    color: "orange",
  },
  {
    key: "reviewsInProgress",
    label: "Reviews In Progress",
    icon: Activity,
    color: "pink",
  },
  {
    key: "creditsEarned",
    label: "Credits Earned",
    icon: BadgeDollarSign,
    color: "green",
  },
  {
    key: "activeReviewers",
    label: "Active Reviewers (30d)",
    icon: Award,
    color: "lime",
  },
  {
    key: "reviewsCompletedLast7Days",
    label: "Reviews Completed (7d)",
    icon: CheckCircle,
    color: "grape",
  },
  {
    key: "avgReviewCompletionTime",
    label: "Avg. Review Completion Time",
    icon: Timer,
    color: "gray",
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
          setError(json.error || "Failed to load stats");
        }
      } catch (e: any) {
        setError(e.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // TARGETED JAVASCRIPT - Only target Platform Stats container
  useEffect(() => {
    const forceColorsInPlatformStatsOnly = () => {
      console.log("🎯 TARGETED: Only Platform Stats container");

      // Find ONLY the Platform Stats container - don't touch anything else!
      const platformContainer = document.querySelector(
        '[data-testid="platform-stats-container"]',
      );
      if (!platformContainer) {
        console.log("❌ No Platform Stats container found");
        return;
      }

      console.log("✅ Found Platform Stats container - applying colors");

      // Only search within the Platform Stats container
      const elements = platformContainer.querySelectorAll("*");

      elements.forEach((element, index) => {
        if (!(element instanceof HTMLElement)) return;

        const text = element.textContent?.trim() || "";
        if (!text) return;

        // BRIGHT ORANGE LABELS - catch ALL possible variations
        if (
          text === "Total Users" ||
          text === "Free Tier Users" ||
          text === "Review Fast Track Users" ||
          text === "Extensions in Libraries" ||
          text === "Extensions in Queue" ||
          text === "Reviews Assigned" ||
          text === "Reviews Completed" ||
          text === "Reviews In Progress" ||
          text === "Credits Earned" ||
          text.includes("Active Reviewers") ||
          text.includes("Avg. Review Completion") ||
          text.includes("Reviews Completed") ||
          text.includes("Completed") ||
          text.includes("Progress") ||
          text.includes("Assigned") ||
          text.includes("Queue") ||
          text.includes("Libraries") ||
          text.includes("Users") ||
          text.includes("Credits") ||
          text.includes("Extensions")
        ) {
          console.log(`🟠 LABEL: "${text}" -> BRIGHT ORANGE`);

          element.style.color = "#ff6b35";
          element.style.setProperty("color", "#ff6b35", "important");
          element.style.fontWeight = "bold";
          element.style.setProperty("font-weight", "bold", "important");
          element.style.fontSize = "14px";
          element.style.setProperty("font-size", "14px", "important");
          element.style.opacity = "1";
          element.style.setProperty("opacity", "1", "important");
          element.style.visibility = "visible";
          element.style.setProperty("visibility", "visible", "important");
          (element.style as any).webkitTextFillColor = "#ff6b35";
          element.style.setProperty(
            "-webkit-text-fill-color",
            "#ff6b35",
            "important",
          );
        }

        // VIBRANT COLORED NUMBERS
        if (/^\d+$/.test(text) && text.length >= 1 && parseInt(text) > 0) {
          const colors = [
            "#6366f1",
            "#3b82f6",
            "#14b8a6",
            "#8b5cf6",
            "#06b6d4",
            "#f59e0b",
            "#f97316",
            "#ec4899",
            "#10b981",
            "#84cc16",
            "#9333ea",
            "#6b7280",
          ];
          const color = colors[index % colors.length];

          console.log(`🌈 NUMBER: "${text}" -> ${color}`);

          element.style.color = color;
          element.style.setProperty("color", color, "important");
          element.style.fontWeight = "800";
          element.style.setProperty("font-weight", "800", "important");
          element.style.fontSize = "2.2rem";
          element.style.setProperty("font-size", "2.2rem", "important");
          element.style.opacity = "1";
          element.style.setProperty("opacity", "1", "important");
          element.style.visibility = "visible";
          element.style.setProperty("visibility", "visible", "important");
          (element.style as any).webkitTextFillColor = color;
          element.style.setProperty(
            "-webkit-text-fill-color",
            color,
            "important",
          );
        }

        // FALLBACK: Any small text that looks like a label
        if (
          text.length > 3 &&
          text.length < 50 &&
          !/^\d+$/.test(text) &&
          !text.includes("Platform Stats") &&
          !text.includes("Real-time")
        ) {
          const computedStyle = window.getComputedStyle(element);
          const fontSize = parseInt(computedStyle.fontSize || "16");

          if (fontSize <= 16) {
            console.log(`🔄 FALLBACK LABEL: "${text}" -> BRIGHT ORANGE`);

            element.style.color = "#ff6b35";
            element.style.setProperty("color", "#ff6b35", "important");
            element.style.fontWeight = "bold";
            element.style.setProperty("font-weight", "bold", "important");
            element.style.fontSize = "14px";
            element.style.setProperty("font-size", "14px", "important");
            element.style.opacity = "1";
            element.style.setProperty("opacity", "1", "important");
            element.style.visibility = "visible";
            element.style.setProperty("visibility", "visible", "important");
            (element.style as any).webkitTextFillColor = "#ff6b35";
            element.style.setProperty(
              "-webkit-text-fill-color",
              "#ff6b35",
              "important",
            );
          }
        }
      });
    };

    // Apply colors when stats load
    if (stats) {
      setTimeout(forceColorsInPlatformStatsOnly, 100);
      setTimeout(forceColorsInPlatformStatsOnly, 500);
      setTimeout(forceColorsInPlatformStatsOnly, 1000);
    }
  }, [stats]);

  if (loading)
    return (
      <Center my="xl">
        <Loader />
      </Center>
    );
  if (error)
    return (
      <Center my="xl">
        <Text c="red">{error}</Text>
      </Center>
    );
  if (!stats) return null;

  return (
    <Container size="lg" my="xl" data-testid="platform-stats-container">
      <Card
        withBorder
        radius="lg"
        p="xl"
        shadow="lg"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
        }}
      >
        <Stack align="center" mb="xl" gap={0}>
          <Title order={2} size="2.2rem" ta="center" fw={800} c="indigo.8">
            Platform Stats
          </Title>
          <Text
            size="lg"
            ta="center"
            mt={4}
            mb="md"
            style={{ color: "rgba(255, 255, 255, 0.9)" }}
          >
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
    indigo: "#6366f1",
    blue: "#3b82f6",
    teal: "#14b8a6",
    violet: "#8b5cf6",
    cyan: "#06b6d4",
    yellow: "#f59e0b",
    orange: "#f97316",
    pink: "#ec4899",
    green: "#10b981",
    lime: "#84cc16",
    grape: "#9333ea",
    gray: "#6b7280",
  };

  const vibrantColor = statColors[color] || "#ffffff";
  const bgColor = (theme.colors[color] && theme.colors[color][0]) || "#f3f4f6";

  return (
    <Box
      p="md"
      style={{
        background: bgColor,
        borderRadius: theme.radius.md,
        boxShadow: theme.shadows.xs,
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "box-shadow 0.2s",
      }}
    >
      <Group mb={8} justify="center">
        <Icon size={32} color={vibrantColor} />
      </Group>
      <Text
        fw={800}
        size="2.2rem"
        lh={1}
        className="platform-stats-number"
        style={{
          color: vibrantColor,
          fontWeight: "800",
          fontSize: "2.2rem",
          WebkitTextFillColor: vibrantColor,
          opacity: "1",
          visibility: "visible",
        }}
      >
        {value}
      </Text>
      <div
        className="platform-stats-label-bright-orange"
        data-label={label}
        style={{
          color: "#ff6b35",
          fontWeight: "bold",
          fontSize: "14px",
          textAlign: "center",
          marginTop: "8px",
          opacity: "1",
          WebkitTextFillColor: "#ff6b35",
          textShadow: "0 0 2px rgba(255,107,53,0.9)",
          lineHeight: "1.4",
          fontFamily: "inherit",
          visibility: "visible",
        }}
      >
        {label}
      </div>
    </Box>
  );
}
