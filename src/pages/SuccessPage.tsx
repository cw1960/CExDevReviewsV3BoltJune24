import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Card,
  Group,
  ThemeIcon,
  Loader,
  Center,
  Alert,
} from "@mantine/core";
import { CheckCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { useSubscription } from "../hooks/useSubscription";
import { useAuth } from "../contexts/AuthContext";

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    refreshSubscription,
    planName,
    loading: subscriptionLoading,
  } = useSubscription();
  const { refreshProfile } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found");
      setVerifying(false);
      return;
    }

    // Wait a moment for webhook processing, then refresh data
    const timer = setTimeout(async () => {
      try {
        await Promise.all([refreshSubscription(), refreshProfile()]);
      } catch (err) {
        console.error("Error refreshing data:", err);
      } finally {
        setVerifying(false);
      }
    }, 3000); // Wait 3 seconds for webhook processing

    return () => clearTimeout(timer);
  }, [sessionId, refreshSubscription, refreshProfile]);

  if (!sessionId) {
    return (
      <Container size="md" py={60}>
        <Center>
          <Alert
            icon={<AlertTriangle size={16} />}
            title="Invalid Session"
            color="red"
          >
            No valid session found. Please try your purchase again.
          </Alert>
        </Center>
      </Container>
    );
  }

  if (verifying || subscriptionLoading) {
    return (
      <Container size="md" py={60}>
        <Center>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text size="lg">Verifying your purchase...</Text>
            <Text size="sm" c="dimmed">
              Please wait while we confirm your payment and activate your
              subscription.
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="md" py={60}>
        <Center>
          <Alert
            icon={<AlertTriangle size={16} />}
            title="Verification Error"
            color="red"
          >
            {error}
          </Alert>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="md" py={60}>
      <Stack align="center" gap="xl">
        <ThemeIcon size={80} radius="xl" color="green">
          <CheckCircle size={40} />
        </ThemeIcon>

        <Stack align="center" gap="md">
          <Title order={1} ta="center" size="2.5rem">
            Payment Successful! 🎉
          </Title>
          <Text size="lg" ta="center" c="dimmed" maw={600}>
            Thank you for your purchase. Your payment has been processed
            successfully.
          </Text>
        </Stack>

        <Card withBorder p="xl" maw={500} w="100%">
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Plan:</Text>
              <Text>{planName}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>Status:</Text>
              <Text c="green">Active</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={600}>Session ID:</Text>
              <Text size="sm" c="dimmed" style={{ fontFamily: "monospace" }}>
                {sessionId.substring(0, 20)}...
              </Text>
            </Group>
          </Stack>
        </Card>

        <Stack align="center" gap="md">
          <Text ta="center" c="dimmed">
            You now have access to 3x faster reviews, unlimited extensions, and
            advanced analytics.
          </Text>

          <Button
            size="lg"
            rightSection={<ArrowRight size={20} />}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
