import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Grid,
  Divider,
  Alert,
  Loader,
  Center,
} from "@mantine/core";
import {
  Crown,
  CheckCircle,
  Star,
  Package,
  Users,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Infinity,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import { useStripe } from "../contexts/StripeContext";
import { stripeProducts } from "../stripe-config";

export function UpgradePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    isPremium,
    loading: subscriptionLoading,
    planName,
  } = useSubscription();
  const { createCheckoutSession, loading: checkoutLoading } = useStripe();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async (productIndex: number) => {
    const product = stripeProducts[productIndex];
    if (!product) {
      return;
    }

    setPurchasing(true);
    try {
      const checkoutUrl = await createCheckoutSession(product);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } finally {
      setPurchasing(false);
    }
  };

  const premiumFeatures = [
    {
      icon: Infinity,
      title: "Unlimited Extensions",
      description: "Add as many Chrome extensions as you want to your library",
      color: "blue",
    },
    {
      icon: Zap,
      title: "Unlimited Monthly Submissions",
      description:
        "Submit extensions to the review queue without monthly limits",
      color: "orange",
    },
    {
      icon: Star,
      title: "3x Faster Reviews",
      description:
        "Get your extensions reviewed 3x faster with priority placement in the review queue",
      color: "green",
    },
    {
      icon: Users,
      title: "Advanced Analytics",
      description: "Track your extension performance and review metrics",
      color: "purple",
    },
    {
      icon: Shield,
      title: "Priority Support",
      description:
        "Get priority customer support and direct access to our team",
      color: "cyan",
    },
    {
      icon: Crown,
      title: "Exclusive Community",
      description: "Access to premium-only developer community and resources",
      color: "yellow",
    },
  ];

  const freeVsPremium = [
    {
      feature: "Extensions in Library",
      free: "1 Extension",
      premium: "Unlimited",
    },
    {
      feature: "Monthly Submissions",
      free: "4 per month",
      premium: "Unlimited",
    },
    {
      feature: "Review Queue Priority",
      free: "Standard",
      premium: "3x Faster",
    },
    {
      feature: "Analytics Dashboard",
      free: "Basic",
      premium: "Advanced",
    },
    {
      feature: "Customer Support",
      free: "Community",
      premium: "Priority Support",
    },
  ];

  if (subscriptionLoading) {
    return (
      <Container size="md">
        <Center h="50vh">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Loading subscription options...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  // If user is already premium, show success message
  if (isPremium) {
    return (
      <Container size="md">
        <Stack align="center" gap="xl" py={60}>
          <ThemeIcon
            size={80}
            radius="xl"
            variant="gradient"
            gradient={{ from: "yellow", to: "orange" }}
          >
            <Crown size={40} />
          </ThemeIcon>

          <Stack align="center" gap="md">
            <Title order={1} ta="center">
              You're on Review Fast Track! 🎉
            </Title>
            <Text size="lg" ta="center" c="dimmed">
              You have access to 3x faster reviews and unlimited submissions.
              Current plan: {planName}
            </Text>
          </Stack>

          <Button
            size="lg"
            leftSection={<ArrowLeft size={20} />}
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </Stack>
      </Container>
    );
  }

  const monthlyProduct = stripeProducts.find((p) => p.interval === "month");
  const yearlyProduct = stripeProducts.find((p) => p.interval === "year");

  return (
    <Container size="lg" py={40}>
      <Stack gap="xl">
        {/* Header */}
        <Stack align="center" gap="md">
          <Group>
            <Button
              variant="light"
              leftSection={<ArrowLeft size={16} />}
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </Group>

          <ThemeIcon
            size={60}
            radius="xl"
            variant="gradient"
            gradient={{ from: "yellow", to: "orange" }}
          >
            <Crown size={30} />
          </ThemeIcon>

          <Title order={1} ta="center" size="2.5rem">
            Join Review Fast Track
          </Title>

          <Text size="lg" ta="center" c="dimmed" maw={600}>
            Get 3x faster reviews with unlimited extensions and unlimited
            monthly reviews to grow your Chrome extension business faster.
          </Text>
        </Stack>

        {/* Pricing Cards */}
        <Grid>
          {/* Monthly Plan */}
          {monthlyProduct && (
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card
                shadow="lg"
                radius="lg"
                p="xl"
                h="100%"
                withBorder
                style={{ position: "relative" }}
              >
                <Badge
                  size="lg"
                  variant="filled"
                  color="green"
                  style={{
                    position: "absolute",
                    top: 15,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1,
                  }}
                >
                  Most Popular
                </Badge>

                <Stack
                  align="center"
                  gap="lg"
                  h="100%"
                  style={{ paddingTop: "30px" }}
                >
                  <Stack align="center" gap="xs">
                    <Title order={2}>Monthly Plan</Title>
                    <Group align="baseline" gap="xs">
                      <Text
                        size="3rem"
                        fw={800}
                        className="landing-card-number-green"
                      >
                        ${monthlyProduct.price}
                      </Text>
                      <Text size="lg" c="dimmed">
                        /month
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed" ta="center">
                      Billed monthly • Cancel anytime
                    </Text>
                  </Stack>

                  <Text ta="center" c="dimmed" flex={1}>
                    {monthlyProduct.description}
                  </Text>

                  <Button
                    size="lg"
                    color="green"
                    fullWidth
                    onClick={() => handlePurchase(0)}
                    loading={purchasing && checkoutLoading}
                    leftSection={<Sparkles size={20} />}
                  >
                    Choose Monthly
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          )}

          {/* Yearly Plan */}
          {yearlyProduct && (
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card
                shadow="xl"
                radius="lg"
                p="xl"
                h="100%"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  position: "relative",
                }}
              >
                <Badge
                  size="lg"
                  variant="filled"
                  color="violet"
                  style={{
                    position: "absolute",
                    top: 15,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1,
                  }}
                >
                  Save 37.5%!
                </Badge>

                <Stack align="center" gap="lg" h="100%">
                  <Stack align="center" gap="xs" style={{ paddingTop: "30px" }}>
                    <Title order={2} c="white">
                      Yearly Plan
                    </Title>
                                         <Group align="baseline" gap="xs">
                       <Text size="3rem" fw={800} className="yearly-plan-price-purple">
                         ${yearlyProduct.price}
                       </Text>
                       <Text size="lg" className="yearly-plan-price-purple">
                         /year
                       </Text>
                     </Group>
                    <Text size="sm" c="rgba(255,255,255,0.8)" ta="center">
                      Billed annually • Best value
                    </Text>
                  </Stack>

                  <Text ta="center" c="rgba(255,255,255,0.9)" flex={1}>
                    {yearlyProduct.description}
                  </Text>

                  <Button
                    size="lg"
                    variant="filled"
                    color="violet"
                    fullWidth
                    onClick={() => handlePurchase(1)}
                    leftSection={<Crown size={20} />}
                    styles={{
                      root: {
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                        },
                      },
                    }}
                  >
                    Choose Yearly
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          )}
        </Grid>

        {/* Features Grid */}
        <div>
          <Title order={2} ta="center" mb="xl">
            Premium Features
          </Title>

          <Grid>
            {premiumFeatures.map((feature, index) => (
              <Grid.Col key={index} span={{ base: 12, md: 6 }}>
                <Card withBorder h="100%" p="lg" shadow="sm">
                  <Group align="flex-start" gap="md">
                    <ThemeIcon
                      color={feature.color}
                      size={40}
                      radius="xl"
                      variant="filled"
                    >
                      <feature.icon size={20} />
                    </ThemeIcon>
                    <Stack gap={4} flex={1}>
                      <Text fw={700} size="md" c={feature.color}>
                        {feature.title}
                      </Text>
                      <Text size="sm" c="dimmed" lh={1.4}>
                        {feature.description}
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </div>

        {/* Comparison Table */}
        <Card
          withBorder
          p="xl"
          shadow="md"
          style={{
            background:
              "linear-gradient(135deg, #667eea 0%, #764ba2 20%, #667eea 100%)",
          }}
        >
          <Title order={2} ta="center" mb="xl" c="white">
            Free vs Premium Comparison
          </Title>

          <Stack gap="md">
            {freeVsPremium.map((item, index) => (
              <div key={index}>
                <Group justify="space-between" align="center" py="sm">
                  <Text fw={500} c="white">
                    {item.feature}
                  </Text>
                  <Group gap="xl">
                    <Stack align="center" gap={4}>
                      <Text size="sm" c="rgba(255, 255, 255, 0.7)" fw={600}>
                        Free
                      </Text>
                      <Text size="sm" c="rgba(255, 255, 255, 0.9)">
                        {item.free}
                      </Text>
                    </Stack>
                    <Stack align="center" gap={4}>
                      <Text size="sm" c="yellow" fw={700}>
                        Premium
                      </Text>
                      <Text size="sm" fw={700} c="yellow">
                        {item.premium}
                      </Text>
                    </Stack>
                  </Group>
                </Group>
                {index < freeVsPremium.length - 1 && (
                  <Divider color="rgba(255, 255, 255, 0.2)" />
                )}
              </div>
            ))}
          </Stack>
        </Card>

        {/* Current Status Alert */}
        <Alert
          icon={<Clock size={16} />}
          title="Your Current Status"
          color="blue"
        >
          <Stack gap="xs">
            <Text size="sm">
              You're currently on the <strong>Free Tier</strong> with:
            </Text>
            <List size="sm" spacing="xs">
              <List.Item>1 extension in your library</List.Item>
              <List.Item>
                {4 - (profile?.exchanges_this_month || 0)} submissions remaining
                this month
              </List.Item>
              <List.Item>Standard review queue priority</List.Item>
            </List>
          </Stack>
        </Alert>

        {/* FAQ or Additional Info */}
        <Card
          withBorder
          p="xl"
          shadow="lg"
          style={{
            background:
              "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            borderColor: "#667eea",
          }}
        >
          <Stack gap="md">
            <Title order={3} ta="center" c="white">
              Why Join Review Fast Track?
            </Title>

            <Text ta="center" c="rgba(255, 255, 255, 0.9)" size="md">
              Review Fast Track members get their extensions reviewed 3x faster,
              can submit unlimited extensions, and have access to advanced
              analytics to track their success. Join hundreds of successful
              Chrome extension developers who have joined Review Fast Track.
            </Text>

            <Group justify="center" gap="xl" mt="xl">
              <Stack align="center" gap={8}>
                <Text size="3rem" fw={800} c="green">
                  3x
                </Text>
                <Text size="sm" c="white" fw={600}>
                  Faster Reviews
                </Text>
              </Stack>
              <Stack align="center" gap={8}>
                <Text size="3rem" fw={800} c="blue">
                  ∞
                </Text>
                <Text size="sm" c="white" fw={600}>
                  Extensions
                </Text>
              </Stack>
              <Stack align="center" gap={8}>
                <Text size="3rem" fw={800} c="orange">
                  24/7
                </Text>
                <Text size="sm" c="white" fw={600}>
                  Priority Support
                </Text>
              </Stack>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
