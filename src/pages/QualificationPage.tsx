import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Card,
  Group,
  Badge,
  List,
  ThemeIcon,
  Box,
  Alert,
  Checkbox,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  CheckCircle,
  Star,
  Shield,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Award,
  Clock,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { triggerMailerLiteEvent } from "../utils/sendTransactionalEmail";

// Custom hook to get window dimensions
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  React.useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

export function QualificationPage() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  // FORCE QUALIFICATION PAGE COLORS WITH JAVASCRIPT
  useEffect(() => {
    const forceQualificationColors = () => {
      console.log("🎨 FORCING QUALIFICATION COLORS - JavaScript is running!");

      // Force badges to be more vibrant
      const badges = document.querySelectorAll(".mantine-Badge-root");
      badges.forEach((badge) => {
        if (
          badge instanceof HTMLElement &&
          badge.textContent?.includes("Reviewer Qualification")
        ) {
          console.log("Setting BRIGHT BLUE for Reviewer Qualification badge");
          badge.style.backgroundColor = "#2563eb";
          badge.style.color = "#ffffff";
          badge.style.setProperty("background-color", "#2563eb", "important");
          badge.style.setProperty("color", "#ffffff", "important");
        }
      });

      // Force ThemeIcon elements to be more vibrant based on their context
      const themeIcons = document.querySelectorAll(".mantine-ThemeIcon-root");
      console.log("Found Qualification theme icons:", themeIcons.length);

      themeIcons.forEach((icon, index) => {
        if (icon instanceof HTMLElement) {
          // Determine color based on the icon's context
          const parentCard = icon.closest(".mantine-Card-root");
          if (parentCard) {
            const cardText = parentCard.textContent;

            if (cardText?.includes("Review Guidelines")) {
              // Find which guideline this icon belongs to by looking at surrounding text
              const parentGroup =
                icon.closest('[class*="Group"]') || icon.parentElement;
              const groupText = parentGroup?.textContent || "";

              if (groupText.includes("Provide Honest Reviews")) {
                console.log(
                  `Setting VIBRANT GREEN for Honest Reviews icon ${index}`,
                );
                icon.style.background =
                  "linear-gradient(135deg, #10b981, #059669)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #10b981, #059669)",
                  "important",
                );
              } else if (groupText.includes("Use Extensions for 1+ Hours")) {
                console.log(
                  `Setting VIBRANT ORANGE for Use Extensions icon ${index}`,
                );
                icon.style.background =
                  "linear-gradient(135deg, #f59e0b, #d97706)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #f59e0b, #d97706)",
                  "important",
                );
              } else if (
                groupText.includes("Follow Chrome Web Store Policies")
              ) {
                console.log(
                  `Setting VIBRANT PURPLE for Chrome Policies icon ${index}`,
                );
                icon.style.background =
                  "linear-gradient(135deg, #8b5cf6, #7c3aed)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                  "important",
                );
              } else if (groupText.includes("Maintain Quality Standards")) {
                console.log(
                  `Setting VIBRANT RED for Quality Standards icon ${index}`,
                );
                icon.style.background =
                  "linear-gradient(135deg, #ef4444, #dc2626)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #ef4444, #dc2626)",
                  "important",
                );
              } else if (groupText.includes("Respect the Community")) {
                console.log(`Setting VIBRANT CYAN for Community icon ${index}`);
                icon.style.background =
                  "linear-gradient(135deg, #06b6d4, #0891b2)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #06b6d4, #0891b2)",
                  "important",
                );
              } else {
                // Fallback - use position-based coloring if text matching fails
                const guidelineIndex = index % 5;
                const colors = [
                  "linear-gradient(135deg, #10b981, #059669)", // Green
                  "linear-gradient(135deg, #f59e0b, #d97706)", // Orange
                  "linear-gradient(135deg, #8b5cf6, #7c3aed)", // Purple
                  "linear-gradient(135deg, #ef4444, #dc2626)", // Red
                  "linear-gradient(135deg, #06b6d4, #0891b2)", // Cyan
                ];
                console.log(
                  `Setting fallback color for guidelines icon ${index}: ${colors[guidelineIndex]}`,
                );
                icon.style.background = colors[guidelineIndex];
                icon.style.setProperty(
                  "background",
                  colors[guidelineIndex],
                  "important",
                );
              }
            } else if (cardText?.includes("Reviewer Requirements")) {
              // Find which requirement this icon belongs to by looking at surrounding text
              const parentGroup =
                icon.closest('[class*="Group"]') || icon.parentElement;
              const groupText = parentGroup?.textContent || "";

              if (
                groupText.includes(
                  "Write reviews in clear, understandable English",
                )
              ) {
                console.log(
                  `Setting VIBRANT BLUE for English requirement icon ${index}`,
                );
                icon.style.background =
                  "linear-gradient(135deg, #3b82f6, #1d4ed8)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  "important",
                );
              } else if (
                groupText.includes(
                  "Provide specific feedback about functionality",
                )
              ) {
                console.log(
                  `Setting VIBRANT PINK for Feedback requirement icon ${index}`,
                );
                icon.style.background =
                  "linear-gradient(135deg, #ec4899, #db2777)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #ec4899, #db2777)",
                  "important",
                );
              } else if (
                groupText.includes(
                  "Rate extensions fairly based on their actual performance",
                )
              ) {
                console.log(
                  `Setting VIBRANT LIME for Rating requirement icon ${index}`,
                );
                icon.style.background =
                  "linear-gradient(135deg, #84cc16, #65a30d)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #84cc16, #65a30d)",
                  "important",
                );
              } else if (
                groupText.includes(
                  "Include both positive aspects and areas for improvement",
                )
              ) {
                console.log(
                  `Setting VIBRANT VIOLET for Balance requirement icon ${index}`,
                );
                icon.style.background =
                  "linear-gradient(135deg, #a855f7, #9333ea)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #a855f7, #9333ea)",
                  "important",
                );
              } else if (
                groupText.includes(
                  "Never write fake, misleading, or spam reviews",
                )
              ) {
                console.log(
                  `Setting VIBRANT RED for No-Fake requirement icon ${index}`,
                );
                icon.style.background =
                  "linear-gradient(135deg, #ef4444, #dc2626)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #ef4444, #dc2626)",
                  "important",
                );
              } else if (
                groupText.includes(
                  "Complete all assigned reviews within the given timeframe",
                )
              ) {
                console.log(
                  `Setting VIBRANT ORANGE for Timeframe requirement icon ${index}`,
                );
                icon.style.background =
                  "linear-gradient(135deg, #f97316, #ea580c)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #f97316, #ea580c)",
                  "important",
                );
              } else if (
                groupText.includes(
                  "Provide proof of your Chrome Web Store review submission",
                )
              ) {
                console.log(
                  `Setting VIBRANT TEAL for Proof requirement icon ${index}`,
                );
                icon.style.background =
                  "linear-gradient(135deg, #14b8a6, #0f766e)";
                icon.style.setProperty(
                  "background",
                  "linear-gradient(135deg, #14b8a6, #0f766e)",
                  "important",
                );
              } else {
                // Fallback - use position-based coloring for 7 requirements
                const requirementIndex = index % 7;
                const colors = [
                  "linear-gradient(135deg, #3b82f6, #1d4ed8)", // Blue
                  "linear-gradient(135deg, #ec4899, #db2777)", // Pink
                  "linear-gradient(135deg, #84cc16, #65a30d)", // Lime
                  "linear-gradient(135deg, #a855f7, #9333ea)", // Violet
                  "linear-gradient(135deg, #ef4444, #dc2626)", // Red
                  "linear-gradient(135deg, #f97316, #ea580c)", // Orange
                  "linear-gradient(135deg, #14b8a6, #0f766e)", // Teal
                ];
                console.log(
                  `Setting fallback color for requirement icon ${index}: ${colors[requirementIndex]}`,
                );
                icon.style.background = colors[requirementIndex];
                icon.style.setProperty(
                  "background",
                  colors[requirementIndex],
                  "important",
                );
              }
            } else if (cardText?.includes("What You Get")) {
              console.log(`Setting BRIGHT ORANGE for benefits icon ${index}`);
              icon.style.backgroundColor = "#ea580c";
              icon.style.setProperty(
                "background-color",
                "#ea580c",
                "important",
              );
            }
          }
        }
      });

      // Force Alert to be BEAUTIFUL BLUE
      const alerts = document.querySelectorAll(".mantine-Alert-root");
      alerts.forEach((alert) => {
        if (
          alert instanceof HTMLElement &&
          alert.textContent?.includes("Important Notice")
        ) {
          console.log("Setting BEAUTIFUL BLUE for Important Notice alert");
          alert.style.background =
            "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 197, 253, 0.15))";
          alert.style.borderColor = "#3b82f6";
          alert.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.15)";
          alert.style.setProperty(
            "background",
            "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 197, 253, 0.15))",
            "important",
          );
          alert.style.setProperty("border-color", "#3b82f6", "important");
          alert.style.setProperty(
            "box-shadow",
            "0 4px 12px rgba(59, 130, 246, 0.15)",
            "important",
          );

          // Make the icon blue too
          const alertIcon = alert.querySelector(".mantine-Alert-icon");
          if (alertIcon instanceof HTMLElement) {
            alertIcon.style.color = "#60a5fa";
            alertIcon.style.setProperty("color", "#60a5fa", "important");
          }
        }
      });

      // Force checkbox to be more vibrant when checked
      const checkboxes = document.querySelectorAll(
        'input[type="checkbox"]:checked',
      );
      checkboxes.forEach((checkbox) => {
        if (checkbox instanceof HTMLInputElement) {
          console.log("Setting BRIGHT GREEN for checked checkbox");
          const checkboxWrapper = checkbox.closest(".mantine-Checkbox-root");
          if (checkboxWrapper instanceof HTMLElement) {
            const checkboxInput = checkboxWrapper.querySelector(
              ".mantine-Checkbox-input",
            );
            if (checkboxInput instanceof HTMLElement) {
              checkboxInput.style.backgroundColor = "#059669";
              checkboxInput.style.borderColor = "#059669";
              checkboxInput.style.setProperty(
                "background-color",
                "#059669",
                "important",
              );
              checkboxInput.style.setProperty(
                "border-color",
                "#059669",
                "important",
              );
            }
          }
        }
      });

      // Force Complete Qualification button to be VIBRANT GREEN when enabled
      const buttons = document.querySelectorAll(".mantine-Button-root");
      buttons.forEach((button) => {
        if (
          button instanceof HTMLElement &&
          button.textContent?.includes("Complete Qualification") &&
          !button.hasAttribute("disabled")
        ) {
          console.log(
            "Setting VIBRANT GREEN for Complete Qualification button",
          );
          button.style.background = "linear-gradient(135deg, #10b981, #059669)";
          button.style.color = "#ffffff";
          button.style.border = "none";
          button.style.fontWeight = "600";
          button.style.fontSize = "16px";
          button.style.padding = "12px 24px";
          button.style.borderRadius = "8px";
          button.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
          button.style.transition = "all 0.3s ease";
          button.style.setProperty(
            "background",
            "linear-gradient(135deg, #10b981, #059669)",
            "important",
          );
          button.style.setProperty("color", "#ffffff", "important");
          button.style.setProperty(
            "box-shadow",
            "0 4px 12px rgba(16, 185, 129, 0.3)",
            "important",
          );

          // Add hover effect
          button.addEventListener("mouseenter", () => {
            button.style.background =
              "linear-gradient(135deg, #059669, #047857)";
            button.style.transform = "translateY(-2px)";
            button.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.4)";
            button.style.setProperty(
              "background",
              "linear-gradient(135deg, #059669, #047857)",
              "important",
            );
            button.style.setProperty(
              "box-shadow",
              "0 6px 20px rgba(16, 185, 129, 0.4)",
              "important",
            );
          });

          button.addEventListener("mouseleave", () => {
            button.style.background =
              "linear-gradient(135deg, #10b981, #059669)";
            button.style.transform = "translateY(0)";
            button.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
            button.style.setProperty(
              "background",
              "linear-gradient(135deg, #10b981, #059669)",
              "important",
            );
            button.style.setProperty(
              "box-shadow",
              "0 4px 12px rgba(16, 185, 129, 0.3)",
              "important",
            );
          });
        }
      });
    };

    // Run immediately and also with a small delay to ensure DOM is ready
    forceQualificationColors();
    const timeout = setTimeout(forceQualificationColors, 100);

    return () => clearTimeout(timeout);
  }, [acknowledged]); // Re-run when acknowledgment state changes

  const handleCompleteQualification = async () => {
    if (!acknowledged) {
      notifications.show({
        title: "Acknowledgment Required",
        message:
          "Please acknowledge that you understand the review guidelines.",
        color: "orange",
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ has_completed_qualification: true });

      // Trigger MailerLite event for qualification completion
      if (profile?.email) {
        try {
          await triggerMailerLiteEvent(
            profile.email,
            "qualification_completed",
            {
              user_name: profile.name || "Developer",
              completion_date: new Date().toISOString(),
            },
          );
        } catch (mailerLiteError) {
          console.error(
            "Failed to trigger MailerLite qualification event:",
            mailerLiteError,
          );
          // Don't fail the qualification process if MailerLite fails
        }
      }

      // Show confetti celebration
      setShowConfetti(true);

      // Set flag for welcome modal on dashboard
      localStorage.setItem("showWelcomeModal", "true");

      notifications.show({
        title: "Qualification Complete!",
        message: "You can now participate in the review exchange program.",
        color: "green",
        icon: <Award size={16} />,
      });

      // Stop confetti after 5 seconds and navigate
      setTimeout(() => {
        setShowConfetti(false);
        navigate("/dashboard");
      }, 5000);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to complete qualification",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const guidelines = [
    {
      icon: Star,
      title: "Provide Honest Reviews",
      description:
        "Write genuine, helpful reviews based on your actual experience with the extension.",
    },
    {
      icon: Clock,
      title: "Use Extensions for 1+ Hours",
      description:
        "Install and actively use extensions for at least an hour before reviewing to provide meaningful feedback.",
    },
    {
      icon: BookOpen,
      title: "Follow Chrome Web Store Policies",
      description:
        "All reviews must comply with Google's Chrome Web Store review policies and guidelines.",
    },
    {
      icon: Shield,
      title: "Maintain Quality Standards",
      description:
        "Write detailed reviews (minimum 50 characters) that help other users make informed decisions.",
    },
    {
      icon: Users,
      title: "Respect the Community",
      description:
        "Treat fellow developers with respect and provide constructive feedback that helps improve their extensions.",
    },
  ];

  const requirements = [
    "Write reviews in clear, understandable English",
    "Provide specific feedback about functionality, usability, and value",
    "Rate extensions fairly based on their actual performance",
    "Include both positive aspects and areas for improvement when applicable",
    "Never write fake, misleading, or spam reviews",
    "Complete all assigned reviews within the given timeframe (7 days)",
    "Provide proof of your Chrome Web Store review submission",
  ];

  const benefits = [
    "Earn 1 credit for each completed review",
    "Get authentic reviews for your own extensions",
    "Connect with a community of Chrome extension developers",
    "Improve your own extensions through feedback exchange",
    "Build your reputation in the developer community",
  ];

  return (
    <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" mih="100vh">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
          colors={[
            "#667eea",
            "#764ba2",
            "#10b981",
            "#ffd700",
            "#ff6b6b",
            "#4ecdc4",
          ]}
        />
      )}
      <Container size="md" py={60}>
        <Stack align="center" gap="xl">
          {/* Logo */}
          <Group mb="xl">
            <img
              src="https://i.imgur.com/PL0Syo1.png"
              alt="ChromeExDev Logo"
              style={{ width: 200, height: "auto" }}
            />
          </Group>

          {/* Header Card */}
          <Card
            shadow="xl"
            radius="lg"
            p="xl"
            maw={700}
            className="qualification-header-card"
          >
            <Stack align="center" gap="lg">
              <Badge size="lg" variant="light" color="blue">
                Reviewer Qualification
              </Badge>

              <Title order={1} ta="center">
                Become a Qualified Reviewer
              </Title>

              <Text size="lg" ta="center" lh={1.6}>
                To maintain the quality and integrity of our review exchange
                program, all reviewers must understand and agree to follow our
                community guidelines.
              </Text>
            </Stack>
          </Card>

          {/* Guidelines Card */}
          <Card
            shadow="lg"
            radius="lg"
            p="xl"
            maw={700}
            className="qualification-guidelines-card"
          >
            <Stack gap="lg">
              <Title order={2} ta="center">
                Review Guidelines
              </Title>

              <Stack gap="md">
                {guidelines.map((guideline, index) => (
                  <Group key={index} align="flex-start" gap="md">
                    <ThemeIcon color="blue" size={40} radius="xl">
                      <guideline.icon size={20} />
                    </ThemeIcon>
                    <Stack gap={4} flex={1}>
                      <Text fw={600} size="md">
                        {guideline.title}
                      </Text>
                      <Text size="sm" c="dimmed" lh={1.4}>
                        {guideline.description}
                      </Text>
                    </Stack>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Card>

          {/* Requirements Card */}
          <Card
            shadow="lg"
            radius="lg"
            p="xl"
            maw={700}
            className="qualification-requirements-card"
          >
            <Stack gap="lg">
              <Title order={2} ta="center" c="dark.8">
                Reviewer Requirements
              </Title>

              <List
                spacing="sm"
                size="sm"
                center
                icon={
                  <ThemeIcon color="green" size={20} radius="xl">
                    <CheckCircle size={12} />
                  </ThemeIcon>
                }
              >
                {requirements.map((requirement, index) => (
                  <List.Item key={index}>
                    <Text size="sm">{requirement}</Text>
                  </List.Item>
                ))}
              </List>
            </Stack>
          </Card>

          {/* Benefits Card */}
          <Card
            shadow="lg"
            radius="lg"
            p="xl"
            maw={700}
            className="qualification-benefits-card"
          >
            <Stack gap="lg">
              <Title order={2} ta="center" c="dark.8">
                What You Get
              </Title>

              <List
                spacing="sm"
                size="sm"
                center
                icon={
                  <ThemeIcon color="orange" size={20} radius="xl">
                    <Award size={12} />
                  </ThemeIcon>
                }
              >
                {benefits.map((benefit, index) => (
                  <List.Item key={index}>
                    <Text size="sm">{benefit}</Text>
                  </List.Item>
                ))}
              </List>
            </Stack>
          </Card>

          {/* Important Notice */}
          <Card
            shadow="lg"
            radius="lg"
            p="xl"
            maw={700}
            className="qualification-notice-card"
          >
            <Alert
              icon={<AlertTriangle size={16} />}
              title="Important Notice"
              color="blue"
              mb="lg"
            >
              Violating these guidelines may result in suspension from the
              review program. We monitor all reviews for quality and compliance
              with Chrome Web Store policies.
            </Alert>

            <Divider my="lg" />

            <Stack gap="lg">
              <Checkbox
                checked={acknowledged}
                onChange={(event) =>
                  setAcknowledged(event.currentTarget.checked)
                }
                label={
                  <Text size="sm">
                    I have read and understand the review guidelines and
                    requirements. I agree to follow all policies and provide
                    honest, quality reviews.
                  </Text>
                }
                size="md"
              />

              <Button
                size="xl"
                radius="md"
                rightSection={<ArrowRight size={20} />}
                onClick={handleCompleteQualification}
                loading={loading}
                disabled={!acknowledged}
                styles={{
                  root: {
                    background: acknowledged
                      ? "linear-gradient(45deg, #10b981, #059669)"
                      : undefined,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    padding: "16px 32px",
                    boxShadow: acknowledged
                      ? "0 4px 16px rgba(16, 185, 129, 0.3)"
                      : undefined,
                    "&:hover": acknowledged
                      ? {
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                        }
                      : undefined,
                  },
                }}
              >
                Complete Qualification
              </Button>

              <Text size="sm" c="dimmed" ta="center">
                Once qualified, you'll be eligible to receive review assignments
                and start earning credits.
              </Text>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
