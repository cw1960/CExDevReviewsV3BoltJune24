import React, { useState, useEffect } from "react";
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
              <Group
                justify="space-between"
                style={{ width: "100%", marginRight: 20 }}
              >
                <Text
                  fw={600}
                  size="lg"
                  style={{ color: "rgba(255, 255, 255, 1)" }}
                >
                  Your Usage This Cycle
                </Text>
                <Badge color="blue" variant="light">
                  Free Tier
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Text size="sm" style={{ color: "rgba(255, 255, 255, 1)" }}>
                  Cycle: {new Date(freeStats.cycleStart).toLocaleDateString()} –{" "}
                  {new Date(freeStats.cycleEnd).toLocaleDateString()}
                  <br />
                  <b style={{ color: "#f59e0b", fontSize: "1.1rem" }}>
                    {freeStats.daysLeftInCycle}
                  </b>{" "}
                  days left in this cycle
                </Text>
                <Group justify="space-between">
                  <Text style={{ color: "rgba(255, 255, 255, 1)" }}>
                    Reviews Submitted
                  </Text>
                  <Text
                    style={{
                      color: "#10b981",
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                    }}
                  >
                    {freeStats.reviewsSubmittedThisCycle} / 4
                  </Text>
                </Group>
                <Progress
                  value={reviewSubmitPct}
                  color="green"
                  radius="xl"
                  size="md"
                />
                <Group justify="space-between">
                  <Text style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                    Reviews Received
                  </Text>
                  <Text
                    style={{
                      color: "#8b5cf6",
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                    }}
                  >
                    {freeStats.reviewsReceivedThisCycle} / 4
                  </Text>
                </Group>
                <Progress
                  value={reviewReceivePct}
                  color="violet"
                  radius="xl"
                  size="md"
                />
                <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  You can submit{" "}
                  <b style={{ color: "#f59e0b", fontSize: "1.1rem" }}>
                    {freeStats.reviewsLeftToSubmit}
                  </b>{" "}
                  more and receive{" "}
                  <b style={{ color: "#06b6d4", fontSize: "1.1rem" }}>
                    {freeStats.reviewsLeftToReceive}
                  </b>{" "}
                  more reviews this cycle.
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
                  Total Submitted:{" "}
                  <b style={{ color: "#2563eb", fontSize: "1.2rem" }}>
                    {freeStats.totalReviewsSubmitted}
                  </b>
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.95)" }}>
                  Total Received:{" "}
                  <b style={{ color: "#059669", fontSize: "1.2rem" }}>
                    {freeStats.totalReviewsReceived}
                  </b>
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
                  <Text
                    size="sm"
                    fw={500}
                    style={{ color: "rgba(255, 255, 255, 0.95)" }}
                  >
                    Unlock Premium Features:
                  </Text>
                  <Text
                    size="sm"
                    style={{ color: "rgba(255, 255, 255, 0.95)" }}
                  >
                    • Unlimited reviews per cycle
                    <br />
                    • Priority queue placement
                    <br />
                    • Advanced analytics & trends
                    <br />
                    • Instant review assignments
                    <br />• Detailed performance insights
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

  // NUCLEAR COLOR FORCING - TARGET EVERYTHING POSSIBLE
  useEffect(() => {
    const forceColors = () => {
      console.log("🎨 NUCLEAR COLOR FORCING - JavaScript is running!");

      // APPROACH 1: Target by text content - Find cards with specific titles
      const allCards = document.querySelectorAll(
        ".mantine-Card-root, .mantine-Paper-root",
      );
      console.log("Found total cards/papers:", allCards.length);

      allCards.forEach((card, index) => {
        if (card instanceof HTMLElement) {
          const cardText = card.textContent || "";
          console.log(`Card ${index} text snippet:`, cardText.substring(0, 50));

          // Target the large numbers in each card
          const numberElements = card.querySelectorAll(
            'div[style*="font-size: 32px"], div[style*="font-size: 36px"], .mantine-Text-root[style*="2.5rem"], .mantine-Text-root[style*="2rem"]',
          );
          const iconElements = card.querySelectorAll("svg");

          if (
            cardText.includes("Reviews This Cycle") ||
            cardText.includes("Reviews Submitted")
          ) {
            console.log("🟢 FORCING GREEN for Reviews This Cycle card");
            numberElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.color = "#10b981";
                el.style.setProperty("color", "#10b981", "important");
                (el.style as any).webkitTextFillColor = "#10b981";
                el.style.setProperty(
                  "-webkit-text-fill-color",
                  "#10b981",
                  "important",
                );
              }
            });
            iconElements.forEach((el) => {
              if (el instanceof SVGElement) {
                el.style.color = "#10b981";
                el.style.setProperty("color", "#10b981", "important");
              }
            });
          }

          if (cardText.includes("Reviews Received")) {
            console.log("🟣 FORCING PURPLE for Reviews Received card");
            numberElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.color = "#8b5cf6";
                el.style.setProperty("color", "#8b5cf6", "important");
                (el.style as any).webkitTextFillColor = "#8b5cf6";
                el.style.setProperty(
                  "-webkit-text-fill-color",
                  "#8b5cf6",
                  "important",
                );
              }
            });
            iconElements.forEach((el) => {
              if (el instanceof SVGElement) {
                el.style.color = "#8b5cf6";
                el.style.setProperty("color", "#8b5cf6", "important");
              }
            });
          }

          if (cardText.includes("Queue Position")) {
            console.log("🟠 FORCING ORANGE for Queue Position card");
            numberElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.color = "#f59e0b";
                el.style.setProperty("color", "#f59e0b", "important");
                (el.style as any).webkitTextFillColor = "#f59e0b";
                el.style.setProperty(
                  "-webkit-text-fill-color",
                  "#f59e0b",
                  "important",
                );
              }
            });
            iconElements.forEach((el) => {
              if (el instanceof SVGElement) {
                el.style.color = "#f59e0b";
                el.style.setProperty("color", "#f59e0b", "important");
              }
            });
          }

          if (
            cardText.includes("Avg. Turnaround") ||
            cardText.includes("Average Turnaround")
          ) {
            console.log("🔵 FORCING CYAN for Avg Turnaround card");
            numberElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.color = "#06b6d4";
                el.style.setProperty("color", "#06b6d4", "important");
                (el.style as any).webkitTextFillColor = "#06b6d4";
                el.style.setProperty(
                  "-webkit-text-fill-color",
                  "#06b6d4",
                  "important",
                );
              }
            });
            iconElements.forEach((el) => {
              if (el instanceof SVGElement) {
                el.style.color = "#06b6d4";
                el.style.setProperty("color", "#06b6d4", "important");
              }
            });
          }
        }
      });

      // APPROACH 2: Target accordion content by looking for specific text patterns
      const accordionPanels = document.querySelectorAll(
        ".mantine-Accordion-panel, .mantine-Accordion-content",
      );
      console.log("Found accordion panels:", accordionPanels.length);

      accordionPanels.forEach((panel, index) => {
        if (panel instanceof HTMLElement) {
          const panelText = panel.textContent || "";
          console.log(
            `Accordion panel ${index} text:`,
            panelText.substring(0, 100),
          );

          // LIFETIME PERFORMANCE section
          if (
            panelText.includes("Total Submitted") ||
            panelText.includes("Total Received") ||
            panelText.includes("Next Review ETA")
          ) {
            console.log("🔵 FORCING COLORS for Lifetime Performance section");

            // Target all bold elements (numbers) within this panel
            const boldElements = panel.querySelectorAll(
              'b, strong, .mantine-Text-root[style*="font-weight"]',
            );
            const numberElements = panel.querySelectorAll(
              'div[style*="font-size: 36px"], .mantine-Text-root',
            );

            boldElements.forEach((el, idx) => {
              if (el instanceof HTMLElement) {
                const colors = ["#2563eb", "#059669", "#ea580c"]; // Blue, Green, Orange
                const color = colors[idx % colors.length];
                console.log(
                  `Setting ${color} for lifetime bold element ${idx}`,
                );
                el.style.color = color;
                el.style.setProperty("color", color, "important");
                (el.style as any).webkitTextFillColor = color;
                el.style.setProperty(
                  "-webkit-text-fill-color",
                  color,
                  "important",
                );
              }
            });
          }

          // 6-MONTH REVIEW TRENDS section - SUPER AGGRESSIVE
          if (
            panelText.includes("6-month") ||
            panelText.includes("6-Month") ||
            panelText.includes("Review Trends") ||
            panelText.includes("Jan 25") ||
            panelText.includes("Submitted") ||
            panelText.includes("Received")
          ) {
            console.log(
              "📊 NUCLEAR: FORCING COLORS for 6-Month Review Trends section",
            );
            console.log("📊 Full panel text:", panelText);

            // Target ALL possible number elements
            const allElements = panel.querySelectorAll("*");
            allElements.forEach((el, idx) => {
              if (el instanceof HTMLElement && el.textContent) {
                const text = el.textContent.trim();

                // Color the month numbers (0, 0, 0, 5, 2, etc)
                if (/^\d+$/.test(text) && text !== "") {
                  const colors = [
                    "#8b5cf6",
                    "#06b6d4",
                    "#f59e0b",
                    "#10b981",
                    "#ef4444",
                    "#ec4899",
                  ];
                  const color = colors[idx % colors.length];
                  console.log(
                    `📊 FORCING ${color} for trend number: "${text}"`,
                  );

                  el.style.color = color;
                  el.style.setProperty("color", color, "important");
                  (el.style as any).webkitTextFillColor = color;
                  el.style.setProperty(
                    "-webkit-text-fill-color",
                    color,
                    "important",
                  );
                  el.style.fontWeight = "bold";
                  el.style.setProperty("font-weight", "bold", "important");
                }

                // Color the month labels
                if (
                  text.includes("Jan") ||
                  text.includes("Feb") ||
                  text.includes("Mar") ||
                  text.includes("Apr") ||
                  text.includes("May") ||
                  text.includes("Jun")
                ) {
                  console.log(`📊 FORCING CYAN for month label: "${text}"`);
                  el.style.color = "#06b6d4";
                  el.style.setProperty("color", "#06b6d4", "important");
                }

                // Color "Submitted" and "Received" labels
                if (text.includes("Submitted")) {
                  console.log(`📊 FORCING GREEN for Submitted label`);
                  el.style.color = "#10b981";
                  el.style.setProperty("color", "#10b981", "important");
                } else if (text.includes("Received")) {
                  console.log(`📊 FORCING PURPLE for Received label`);
                  el.style.color = "#8b5cf6";
                  el.style.setProperty("color", "#8b5cf6", "important");
                }
              }
            });
          }

          // RECENT POSITIVE FEEDBACK section
          if (
            panelText.includes("Recent Positive Feedback") ||
            panelText.includes("feedback")
          ) {
            console.log(
              "⭐ FORCING COLORS for Recent Positive Feedback section",
            );

            // Color star ratings gold and feedback text green
            const stars = panel.querySelectorAll(
              'svg, .star, [data-icon="star"]',
            );
            stars.forEach((star) => {
              if (star instanceof SVGElement || star instanceof HTMLElement) {
                star.style.color = "#fbbf24";
                star.style.setProperty("color", "#fbbf24", "important");
              }
            });

            const feedbackText = panel.querySelectorAll(".mantine-Text-root");
            feedbackText.forEach((el) => {
              if (
                el instanceof HTMLElement &&
                el.textContent &&
                el.textContent.length > 20
              ) {
                el.style.color = "#059669"; // Green for positive feedback
                el.style.setProperty("color", "#059669", "important");
              }
            });
          }

          // PLATFORM COMPARISON section - SUPER AGGRESSIVE
          if (
            panelText.includes("Platform Comparison") ||
            panelText.includes("Your Reviews") ||
            panelText.includes("Your Speed") ||
            panelText.includes("vs") ||
            panelText.includes("avg") ||
            panelText.includes("Fast Track")
          ) {
            console.log(
              "📈 NUCLEAR: FORCING COLORS for Platform Comparison section",
            );
            console.log("📈 Full panel text:", panelText);

            // Target ALL elements and be very specific
            const allElements = panel.querySelectorAll("*");
            allElements.forEach((el, idx) => {
              if (el instanceof HTMLElement && el.textContent) {
                const text = el.textContent.trim();
                console.log(`📈 Checking element: "${text}"`);

                // Color specific numbers in "Your Reviews vs avg"
                if (
                  text === "5" ||
                  (text.includes("5") && text.includes("Your Reviews"))
                ) {
                  console.log(`📈 FORCING BRIGHT GREEN for "5" (Your Reviews)`);
                  el.style.color = "#10b981";
                  el.style.setProperty("color", "#10b981", "important");
                  (el.style as any).webkitTextFillColor = "#10b981";
                  el.style.setProperty(
                    "-webkit-text-fill-color",
                    "#10b981",
                    "important",
                  );
                  el.style.fontWeight = "bold";
                  el.style.setProperty("font-weight", "bold", "important");
                }

                if (
                  text === "3" ||
                  (text.includes("3") && text.includes("avg"))
                ) {
                  console.log(`📈 FORCING BRIGHT ORANGE for "3" (avg)`);
                  el.style.color = "#f59e0b";
                  el.style.setProperty("color", "#f59e0b", "important");
                  (el.style as any).webkitTextFillColor = "#f59e0b";
                  el.style.setProperty(
                    "-webkit-text-fill-color",
                    "#f59e0b",
                    "important",
                  );
                  el.style.fontWeight = "bold";
                  el.style.setProperty("font-weight", "bold", "important");
                }

                // Color speed times
                if (text.includes("11.8") || text.includes("hours")) {
                  console.log(
                    `📈 FORCING BRIGHT CYAN for speed time "${text}"`,
                  );
                  el.style.color = "#06b6d4";
                  el.style.setProperty("color", "#06b6d4", "important");
                  (el.style as any).webkitTextFillColor = "#06b6d4";
                  el.style.setProperty(
                    "-webkit-text-fill-color",
                    "#06b6d4",
                    "important",
                  );
                }

                if (text.includes("12.8h") || text.includes("12.8")) {
                  console.log(
                    `📈 FORCING BRIGHT PURPLE for avg speed "${text}"`,
                  );
                  el.style.color = "#8b5cf6";
                  el.style.setProperty("color", "#8b5cf6", "important");
                  (el.style as any).webkitTextFillColor = "#8b5cf6";
                  el.style.setProperty(
                    "-webkit-text-fill-color",
                    "#8b5cf6",
                    "important",
                  );
                }

                // Color status labels
                if (text.includes("Fast Track")) {
                  console.log(`📈 FORCING GOLD for Fast Track status`);
                  el.style.color = "#fbbf24";
                  el.style.setProperty("color", "#fbbf24", "important");
                  (el.style as any).webkitTextFillColor = "#fbbf24";
                  el.style.setProperty(
                    "-webkit-text-fill-color",
                    "#fbbf24",
                    "important",
                  );
                }

                if (text.includes("Premium Member")) {
                  console.log(`📈 FORCING EMERALD for Premium Member`);
                  el.style.color = "#059669";
                  el.style.setProperty("color", "#059669", "important");
                  (el.style as any).webkitTextFillColor = "#059669";
                  el.style.setProperty(
                    "-webkit-text-fill-color",
                    "#059669",
                    "important",
                  );
                }

                // Color "vs" and "avg" text
                if (text === "vs" || text.includes("vs ")) {
                  console.log(`📈 FORCING WHITE for "vs"`);
                  el.style.color = "#ffffff";
                  el.style.setProperty("color", "#ffffff", "important");
                }

                // Color descriptive labels
                if (text.includes("Your Reviews") && !text.includes("vs")) {
                  console.log(`📈 FORCING LIGHT BLUE for Your Reviews label`);
                  el.style.color = "#7dd3fc";
                  el.style.setProperty("color", "#7dd3fc", "important");
                }

                if (text.includes("Your Speed") && !text.includes("vs")) {
                  console.log(`📈 FORCING LIGHT CYAN for Your Speed label`);
                  el.style.color = "#67e8f9";
                  el.style.setProperty("color", "#67e8f9", "important");
                }

                if (text.includes("Your Status") && !text.includes("vs")) {
                  console.log(`📈 FORCING LIGHT YELLOW for Your Status label`);
                  el.style.color = "#fde047";
                  el.style.setProperty("color", "#fde047", "important");
                }
              }
            });
          }
        }
      });

      // APPROACH 3: Brute force ALL large numbers on the page
      const allLargeNumbers = document.querySelectorAll(
        'div[style*="font-size: 32px"], div[style*="font-size: 36px"], ' +
          '.mantine-Text-root[style*="2.5rem"], .mantine-Text-root[style*="2rem"], ' +
          'div[style*="font-size: 2rem"], div[style*="font-size: 2.5rem"]',
      );
      console.log("Found all large numbers on page:", allLargeNumbers.length);

      allLargeNumbers.forEach((el, index) => {
        if (el instanceof HTMLElement) {
          const parentCard = el.closest(
            ".mantine-Card-root, .mantine-Paper-root",
          );
          if (parentCard && parentCard.textContent) {
            const cardText = parentCard.textContent;

            // If not already colored, apply a default vibrant color scheme
            if (
              !el.style.color ||
              el.style.color.includes("rgb(255, 255, 255)")
            ) {
              const colors = [
                "#10b981",
                "#8b5cf6",
                "#f59e0b",
                "#06b6d4",
                "#2563eb",
                "#dc2626",
              ];
              const color = colors[index % colors.length];
              console.log(
                `BRUTE FORCE: Setting ${color} for number ${el.textContent} (index ${index})`,
              );

              el.style.color = color;
              el.style.setProperty("color", color, "important");
              (el.style as any).webkitTextFillColor = color;
              el.style.setProperty(
                "-webkit-text-fill-color",
                color,
                "important",
              );
            }
          }
        }
      });

      // Force Reviews Received to Purple (keeping existing logic)
      const reviewsReceivedCards = document.querySelectorAll(
        ".reviews-received-card",
      );
      console.log("Found Reviews Received cards:", reviewsReceivedCards.length);
      reviewsReceivedCards.forEach((card) => {
        const numberDiv = card.querySelector(
          'div[style*="font-size: 32px"]',
        ) as HTMLElement;
        const icon = card.querySelector("svg") as SVGElement;
        console.log(
          "Reviews Received - Found numberDiv:",
          !!numberDiv,
          "Found icon:",
          !!icon,
        );
        if (numberDiv) {
          console.log("Setting PURPLE color for Reviews Received");
          numberDiv.style.color = "#8b5cf6";
          numberDiv.style.setProperty("color", "#8b5cf6", "important");
          (numberDiv.style as any).webkitTextFillColor = "#8b5cf6";
          numberDiv.style.setProperty(
            "-webkit-text-fill-color",
            "#8b5cf6",
            "important",
          );
        }
        if (icon) {
          icon.style.color = "#8b5cf6";
          icon.style.setProperty("color", "#8b5cf6", "important");
        }
      });

      // Force Queue Position to Orange
      const queuePositionCards = document.querySelectorAll(
        ".queue-position-card",
      );
      console.log("Found Queue Position cards:", queuePositionCards.length);
      queuePositionCards.forEach((card) => {
        const numberDiv = card.querySelector(
          'div[style*="font-size: 32px"]',
        ) as HTMLElement;
        const icon = card.querySelector("svg") as SVGElement;
        console.log(
          "Queue Position - Found numberDiv:",
          !!numberDiv,
          "Found icon:",
          !!icon,
        );
        if (numberDiv) {
          console.log("Setting ORANGE color for Queue Position");
          numberDiv.style.color = "#f59e0b";
          numberDiv.style.setProperty("color", "#f59e0b", "important");
          (numberDiv.style as any).webkitTextFillColor = "#f59e0b";
          numberDiv.style.setProperty(
            "-webkit-text-fill-color",
            "#f59e0b",
            "important",
          );
        }
        if (icon) {
          icon.style.color = "#f59e0b";
          icon.style.setProperty("color", "#f59e0b", "important");
        }
      });

      // Force Avg Turnaround to Cyan
      const avgTurnaroundCards = document.querySelectorAll(
        ".avg-turnaround-card",
      );
      console.log("Found Avg Turnaround cards:", avgTurnaroundCards.length);
      avgTurnaroundCards.forEach((card) => {
        const numberDiv = card.querySelector(
          'div[style*="font-size: 32px"]',
        ) as HTMLElement;
        const icon = card.querySelector("svg") as SVGElement;
        console.log(
          "Avg Turnaround - Found numberDiv:",
          !!numberDiv,
          "Found icon:",
          !!icon,
        );
        if (numberDiv) {
          console.log("Setting CYAN color for Avg Turnaround");
          numberDiv.style.color = "#06b6d4";
          numberDiv.style.setProperty("color", "#06b6d4", "important");
          (numberDiv.style as any).webkitTextFillColor = "#06b6d4";
          numberDiv.style.setProperty(
            "-webkit-text-fill-color",
            "#06b6d4",
            "important",
          );
        }
        if (icon) {
          icon.style.color = "#06b6d4";
          icon.style.setProperty("color", "#06b6d4", "important");
        }
      });

      // LIFETIME PERFORMANCE SECTION - Force vibrant colors
      const lifetimeNumbers = document.querySelectorAll(
        '[value="lifetime"] div[style*="font-size: 36px"]',
      );
      console.log(
        "Found Lifetime Performance numbers:",
        lifetimeNumbers.length,
      );
      lifetimeNumbers.forEach((numberDiv, index) => {
        const colors = ["#3b82f6", "#10b981", "#f59e0b"]; // Blue, Green, Orange
        const brightColors = ["#2563eb", "#059669", "#ea580c"]; // Brighter versions
        if (numberDiv instanceof HTMLElement) {
          numberDiv.style.color = brightColors[index] || brightColors[0];
          numberDiv.style.setProperty(
            "color",
            brightColors[index] || brightColors[0],
            "important",
          );
          console.log(
            `Set Lifetime Performance ${index} to ${brightColors[index]}`,
          );
        }
      });

      // REVIEW TRENDS SECTION - Force vibrant colors
      const trendsNumbers = document.querySelectorAll(
        '[value="trends"] .mantine-Text-root[style*="color: #3b82f6"], [value="trends"] .mantine-Text-root[style*="color: #10b981"]',
      );
      console.log("Found Review Trends numbers:", trendsNumbers.length);
      trendsNumbers.forEach((numberDiv) => {
        if (numberDiv instanceof HTMLElement) {
          if (
            numberDiv.style.color.includes("#3b82f6") ||
            numberDiv.style.color.includes("59, 130, 246")
          ) {
            numberDiv.style.color = "#2563eb";
            numberDiv.style.setProperty("color", "#2563eb", "important");
          } else if (
            numberDiv.style.color.includes("#10b981") ||
            numberDiv.style.color.includes("16, 185, 129")
          ) {
            numberDiv.style.color = "#059669";
            numberDiv.style.setProperty("color", "#059669", "important");
          }
        }
      });

      // PLATFORM COMPARISON SECTION - Force vibrant colors
      const comparisonNumbers = document.querySelectorAll(
        '[value="comparison"] .mantine-Text-root[style*="font-weight: 700"]',
      );
      console.log(
        "Found Platform Comparison numbers:",
        comparisonNumbers.length,
      );
      comparisonNumbers.forEach((numberDiv, index) => {
        if (numberDiv instanceof HTMLElement) {
          const colors = ["#2563eb", "#059669", "#fbbf24"]; // Blue, Green, Yellow
          numberDiv.style.color = colors[index] || colors[0];
          numberDiv.style.setProperty(
            "color",
            colors[index] || colors[0],
            "important",
          );
        }
      });

      // PLATFORM COMPARISON STATUS - Force "Fast Track" to be more vibrant
      const fastTrackElements = document.querySelectorAll(
        '[value="comparison"] .mantine-Text-root',
      );
      fastTrackElements.forEach((element) => {
        if (
          element instanceof HTMLElement &&
          element.textContent?.includes("Fast Track")
        ) {
          element.style.color = "#fbbf24";
          element.style.setProperty("color", "#fbbf24", "important");
          element.style.fontWeight = "bold";
        }
      });
    };

    // AGGRESSIVE TIMING: Run multiple times to catch all dynamic content
    forceColors(); // Run immediately
    const timeout1 = setTimeout(forceColors, 100); // After 100ms
    const timeout2 = setTimeout(forceColors, 500); // After 500ms
    const timeout3 = setTimeout(forceColors, 1000); // After 1 second
    const timeout4 = setTimeout(forceColors, 2000); // After 2 seconds

    // Also run on scroll and resize to catch any lazy-loaded content
    const handleEvent = () => forceColors();
    window.addEventListener("scroll", handleEvent);
    window.addEventListener("resize", handleEvent);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      window.removeEventListener("scroll", handleEvent);
      window.removeEventListener("resize", handleEvent);
    };
  }, [stats]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .reviews-cycle-card *, .reviews-received-card *, .queue-position-card *, .avg-turnaround-card * {
            color: #FFFFFF !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
          .mantine-Text-root {
            color: #FFFFFF !important;
          }
          .mantine-Card-root .mantine-Text-root {
            color: #FFFFFF !important;
          }
        `,
        }}
      />
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Accordion defaultValue="overview" variant="separated">
          <Accordion.Item value="overview">
            <Accordion.Control icon={<IconTrophy size={20} />}>
              <Group
                justify="space-between"
                style={{ width: "100%", marginRight: 20 }}
              >
                <Text
                  fw={600}
                  size="lg"
                  style={{ color: "rgba(255, 255, 255, 1)" }}
                >
                  Review Fast Track Dashboard
                </Text>
                <Group>
                  <Badge color="yellow" variant="filled" leftSection="⚡">
                    PREMIUM
                  </Badge>
                  <Text
                    size="sm"
                    style={{ color: "rgba(255, 255, 255, 0.95)" }}
                  >
                    {premiumStats.badgeIcon}
                  </Text>
                  <Text
                    size="sm"
                    fw={500}
                    style={{ color: "rgba(255, 255, 255, 0.95)" }}
                  >
                    {premiumStats.badgeRank}
                  </Text>
                </Group>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  Cycle:{" "}
                  {new Date(premiumStats.cycleStart).toLocaleDateString()} –{" "}
                  {new Date(premiumStats.cycleEnd).toLocaleDateString()}
                  <br />
                  <b style={{ color: "rgba(255, 255, 255, 1)" }}>
                    {premiumStats.daysLeftInCycle}
                  </b>{" "}
                  days left in this cycle
                </Text>

                {/* Main Stats Grid */}
                <SimpleGrid cols={2} spacing="md">
                  <Card
                    shadow="sm"
                    p="md"
                    radius="md"
                    withBorder
                    className="reviews-cycle-card"
                  >
                    <Group justify="space-between" mb="xs">
                      <div
                        style={{
                          color: "#FFFFFF",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Reviews This Cycle
                      </div>
                      <IconTrendingUp size={16} style={{ color: "#10b981" }} />
                    </Group>
                    <Group justify="space-between">
                      <div
                        style={{
                          color: "#10b981",
                          fontSize: "32px",
                          fontWeight: "bold",
                          lineHeight: "1.2",
                        }}
                      >
                        {premiumStats.reviewsSubmittedThisCycle}
                      </div>
                      <Text size="sm" style={{ color: "#10b981" }}>
                        Unlimited
                      </Text>
                    </Group>
                    <div style={{ color: "#FFFFFF", fontSize: "12px" }}>
                      Submitted
                    </div>
                  </Card>

                  <Card
                    shadow="sm"
                    p="md"
                    radius="md"
                    withBorder
                    className="reviews-received-card"
                  >
                    <Group justify="space-between" mb="xs">
                      <div
                        style={{
                          color: "#FFFFFF",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Reviews Received
                      </div>
                      <IconStar size={16} style={{ color: "#8b5cf6" }} />
                    </Group>
                    <div
                      style={{
                        color: "#8b5cf6",
                        fontSize: "32px",
                        fontWeight: "bold",
                        lineHeight: "1.2",
                      }}
                    >
                      {premiumStats.reviewsReceivedThisCycle}
                    </div>
                    <Text size="xs" style={{ color: "rgba(255, 255, 255, 1)" }}>
                      This cycle
                    </Text>
                  </Card>

                  <Card
                    shadow="sm"
                    p="md"
                    radius="md"
                    withBorder
                    className="queue-position-card"
                  >
                    <Group justify="space-between" mb="xs">
                      <Text
                        size="sm"
                        fw={500}
                        style={{ color: "rgba(255, 255, 255, 1)" }}
                      >
                        Queue Position
                      </Text>
                      <IconTarget size={16} style={{ color: "#f59e0b" }} />
                    </Group>
                    <div
                      style={{
                        color: "#f59e0b",
                        fontSize: "32px",
                        fontWeight: "bold",
                        lineHeight: "1.2",
                      }}
                    >
                      #{premiumStats.queuePosition}
                    </div>
                    <Text size="xs" style={{ color: "rgba(255, 255, 255, 1)" }}>
                      Priority queue
                    </Text>
                  </Card>

                  <Card
                    shadow="sm"
                    p="md"
                    radius="md"
                    withBorder
                    className="avg-turnaround-card"
                  >
                    <Group justify="space-between" mb="xs">
                      <Text
                        size="sm"
                        fw={500}
                        style={{ color: "rgba(255, 255, 255, 1)" }}
                      >
                        Avg. Turnaround
                      </Text>
                      <IconClock size={16} style={{ color: "#06b6d4" }} />
                    </Group>
                    <div
                      style={{
                        color: "#06b6d4",
                        fontSize: "32px",
                        fontWeight: "bold",
                        lineHeight: "1.2",
                      }}
                    >
                      {premiumStats.avgReviewTurnaroundTime || "N/A"}
                    </div>
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
                  <div
                    style={{
                      color: "#3b82f6",
                      fontSize: "36px",
                      fontWeight: "bold",
                      lineHeight: "1.2",
                    }}
                  >
                    {premiumStats.totalReviewsSubmitted}
                  </div>
                  <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    Total Submitted
                  </Text>
                </Stack>
                <Stack align="center" gap={4}>
                  <div
                    style={{
                      color: "#10b981",
                      fontSize: "36px",
                      fontWeight: "bold",
                      lineHeight: "1.2",
                    }}
                  >
                    {premiumStats.totalReviewsReceived}
                  </div>
                  <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    Total Received
                  </Text>
                </Stack>
                <Stack align="center" gap={4}>
                  <div
                    style={{
                      color: "#f59e0b",
                      fontSize: "36px",
                      fontWeight: "bold",
                      lineHeight: "1.2",
                    }}
                  >
                    {premiumStats.nextReviewETA}
                  </div>
                  <Text size="sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    Next Review ETA
                  </Text>
                </Stack>
              </Group>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Review Trends */}
          {premiumStats.reviewTrends &&
            premiumStats.reviewTrends.length > 0 && (
              <Accordion.Item value="trends">
                <Accordion.Control icon={<IconChartLine size={20} />}>
                  6-Month Review Trends
                </Accordion.Control>
                <Accordion.Panel>
                  <SimpleGrid cols={6} spacing="xs">
                    {premiumStats.reviewTrends.map((trend, index) => (
                      <Stack key={index} align="center" gap={4}>
                        <Text
                          size="xs"
                          style={{ color: "rgba(255, 255, 255, 0.9)" }}
                        >
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
                      <Text
                        size="xs"
                        style={{ color: "rgba(255, 255, 255, 0.9)" }}
                      >
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
                      <Text
                        size="xs"
                        style={{ color: "rgba(255, 255, 255, 0.9)" }}
                      >
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
                          <Text
                            size="sm"
                            style={{ color: "rgba(255, 255, 255, 0.95)" }}
                          >
                            {feedback}
                          </Text>
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
                    <Text
                      size="lg"
                      fw={700}
                      style={{ color: "rgba(255, 255, 255, 0.95)" }}
                    >
                      {premiumStats.totalReviewsSubmitted}
                    </Text>
                    <Text
                      size="xs"
                      style={{ color: "rgba(255, 255, 255, 0.9)" }}
                    >
                      Your Reviews
                    </Text>
                    <Text size="xs" style={{ color: "#3b82f6" }}>
                      vs {premiumStats.platformAverages.avgSubmitted} avg
                    </Text>
                  </Stack>
                  <Stack align="center" gap={4}>
                    <Text
                      size="lg"
                      fw={700}
                      style={{ color: "rgba(255, 255, 255, 0.95)" }}
                    >
                      {premiumStats.avgReviewTurnaroundTime || "N/A"}
                    </Text>
                    <Text
                      size="xs"
                      style={{ color: "rgba(255, 255, 255, 0.9)" }}
                    >
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
                    <Text
                      size="xs"
                      style={{ color: "rgba(255, 255, 255, 0.9)" }}
                    >
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
    </>
  );
};

export default PersonalStatsPanel;
