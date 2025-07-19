import React from "react";
import {
  Modal,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Badge,
  Card,
  List,
  ThemeIcon,
  Box,
  Divider,
  Alert,
} from "@mantine/core";
import {
  Sparkles,
  Star,
  Package,
  CreditCard,
  Crown,
  CheckCircle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Database } from "../types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type Extension = Database["public"]["Tables"]["extensions"]["Row"];

interface WelcomeModalProps {
  opened: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  extensions: Extension[];
}

export function WelcomeModal({
  opened,
  onClose,
  profile,
  extensions,
}: WelcomeModalProps) {
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    navigate("/upgrade");
  };

  const handleRequestAssignment = () => {
    navigate("/reviews");
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title=""
      size="lg"
      centered
      styles={{
        content: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
        },
        header: {
          background: "transparent",
          borderBottom: "none",
        },
        close: {
          color: "white",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.1)",
          },
        },
      }}
    >
      <Box p="md">
        <Card
          shadow="xl"
          radius="lg"
          p="xl"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Stack align="center" gap="xl">
            {/* Header */}
            <Stack align="center" gap="md">
              <ThemeIcon
                size={80}
                radius="xl"
                variant="gradient"
                gradient={{ from: "blue", to: "purple" }}
              >
                <Sparkles size={40} />
              </ThemeIcon>

              <Title order={1} ta="center" c="dark.8" size="2rem">
                🎉 Welcome to Your Dashboard, {profile?.name}!
              </Title>

              <Text
                size="lg"
                ta="center"
                lh={1.6}
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
              >
                You're all set up and ready to start getting authentic reviews
                for your Chrome extensions!
              </Text>
            </Stack>

            <Divider w="100%" />

            {/* Important Notice - First Review Required */}
            <Alert
              icon={<AlertCircle size={20} />}
              title="Important: First Review Required"
              color="blue"
              variant="light"
              styles={{
                root: {
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                },
              }}
            >
              <Text size="sm" c="blue.8">
                <strong>
                  Before you can submit your extensions to the review queue,
                </strong>{" "}
                you must complete your first review assignment. This ensures
                everyone contributes to the community before receiving reviews.
              </Text>
            </Alert>

            {/* Key Points */}
            <Stack gap="lg" w="100%">
              <Card withBorder p="md" bg="blue.0">
                <Group gap="md">
                  <ThemeIcon color="blue" size={40} radius="xl">
                    <CreditCard size={20} />
                  </ThemeIcon>
                  <Stack gap={4} flex={1}>
                    <Text fw={600} size="md">
                      You Have 1 Welcome Credit!
                    </Text>
                    <Text
                      size="sm"
                      style={{ color: "rgba(255, 255, 255, 0.9)" }}
                    >
                      Your credit balance shows{" "}
                      <Badge color="blue" size="sm">
                        {profile?.credit_balance || 1} Credit
                      </Badge>{" "}
                      ready to use
                    </Text>
                  </Stack>
                </Group>
              </Card>

              {extensions.length > 0 && (
                <Card withBorder p="md" bg="green.0">
                  <Group gap="md">
                    <ThemeIcon color="green" size={40} radius="xl">
                      <Package size={20} />
                    </ThemeIcon>
                    <Stack gap={4} flex={1}>
                      <Text fw={600} size="md">
                        Your Extension is Ready!
                      </Text>
                      <Text
                        size="sm"
                        style={{ color: "rgba(255, 255, 255, 0.9)" }}
                      >
                        Your extension is in your library. Complete your first
                        review to unlock queue submission!
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              )}

              <Card withBorder p="md" bg="orange.0">
                <Group gap="md">
                  <ThemeIcon color="orange" size={40} radius="xl">
                    <Star size={20} />
                  </ThemeIcon>
                  <Stack gap={4} flex={1}>
                    <Text fw={600} size="md">
                      Start with Your First Review
                    </Text>
                    <Text
                      size="sm"
                      style={{ color: "rgba(255, 255, 255, 0.9)" }}
                    >
                      Request a review assignment to help another developer and
                      earn credits for your own reviews
                    </Text>
                  </Stack>
                </Group>
              </Card>

              <Card withBorder p="md" bg="purple.0">
                <Group gap="md">
                  <ThemeIcon color="purple" size={40} radius="xl">
                    <Crown size={20} />
                  </ThemeIcon>
                  <Stack gap={4} flex={1}>
                    <Text fw={600} size="md">
                      Want More Reviews?
                    </Text>
                    <Text
                      size="sm"
                      style={{ color: "rgba(255, 255, 255, 0.9)" }}
                    >
                      Upgrade to premium to add all your extensions, and earn
                      credits by reviewing other developers' extensions!
                    </Text>
                  </Stack>
                </Group>
              </Card>
            </Stack>

            <Divider w="100%" />

            {/* Next Steps */}
            <Stack gap="md" w="100%">
              <Text fw={600} size="lg" ta="center" c="dark.8">
                Your Next Steps:
              </Text>

              <List
                spacing="sm"
                size="sm"
                center
                icon={
                  <ThemeIcon color="blue" size={20} radius="xl">
                    <CheckCircle size={12} />
                  </ThemeIcon>
                }
              >
                <List.Item>
                  <Text size="sm">
                    <strong>First:</strong> Request a review assignment to
                    complete your first review
                  </Text>
                </List.Item>
                <List.Item>
                  <Text size="sm">
                    <strong>Then:</strong> Submit your extension to the Review
                    Queue (costs 1 credit)
                  </Text>
                </List.Item>
                <List.Item>
                  <Text size="sm">
                    <strong>Continue:</strong> Request more review assignments
                    to earn additional credits
                  </Text>
                </List.Item>
                <List.Item>
                  <Text size="sm">
                    <strong>Optional:</strong> Consider joining Review Fast
                    Track for 3x faster reviews
                  </Text>
                </List.Item>
              </List>
            </Stack>

            {/* Action Buttons */}
            <Group justify="center" gap="md" w="100%">
              <Button
                variant="light"
                size="lg"
                onClick={handleRequestAssignment}
                leftSection={<Star size={18} />}
                styles={{
                  root: {
                    background: "linear-gradient(45deg, #f59e0b, #d97706)",
                    color: "white",
                    border: "none",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                    },
                  },
                }}
              >
                Request Review Assignment
              </Button>

              <Button
                variant="light"
                size="lg"
                onClick={handleUpgradeClick}
                leftSection={<Crown size={18} />}
                styles={{
                  root: {
                    background: "linear-gradient(45deg, #ffd700, #ffb347)",
                    color: "dark",
                    border: "none",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(255, 215, 0, 0.3)",
                    },
                  },
                }}
              >
                Join Review Fast Track
              </Button>

              <Button
                size="lg"
                onClick={onClose}
                rightSection={<ArrowRight size={18} />}
                styles={{
                  root: {
                    background: "linear-gradient(45deg, #10b981, #059669)",
                    fontSize: "1rem",
                    fontWeight: 600,
                    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                    },
                  },
                }}
              >
                Start Using Dashboard
              </Button>
            </Group>
          </Stack>
        </Card>
      </Box>
    </Modal>
  );
}
