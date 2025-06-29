import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Card,
  TextInput,
  Button,
  Stack,
  Group,
  Text,
  Badge,
  Grid,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { User, Mail, Globe, Star, Crown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Query timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}

export function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const { planName, isPremium } = useSubscription();
  const navigate = useNavigate();

  // Contact form state
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactMessage, setContactMessage] = React.useState("");
  const [isSubmittingContact, setIsSubmittingContact] = React.useState(false);

  // FORCE PROFILE PAGE COLORS ONLY
  React.useEffect(() => {
    const forceProfileColors = () => {
      console.log("🎨 FORCING PROFILE COLORS - JavaScript is running!");

      // Force Credits display to bright blue
      const creditsNumbers = document.querySelectorAll(
        'div[class*="mantine-Text-root"][class*="2.5rem"][class*="fw-800"]',
      );
      console.log("Found profile credits numbers:", creditsNumbers.length);

      creditsNumbers.forEach((numberElement) => {
        if (numberElement instanceof HTMLElement) {
          const parentCard = numberElement.closest(".mantine-Card-root");
          if (parentCard) {
            const titleElement = parentCard.querySelector(
              'div[class*="fw-700"]',
            ) as HTMLElement;
            const iconElement = parentCard.querySelector("svg") as SVGElement;

            if (titleElement && titleElement.textContent?.includes("Credits")) {
              console.log("Setting BRIGHT BLUE color for Credits");
              numberElement.style.color = "#2563eb"; // Bright Blue
              numberElement.style.setProperty("color", "#2563eb", "important");
              (numberElement.style as any).webkitTextFillColor = "#2563eb";
              numberElement.style.setProperty(
                "-webkit-text-fill-color",
                "#2563eb",
                "important",
              );
              if (iconElement) {
                iconElement.style.color = "#2563eb";
                iconElement.style.setProperty("color", "#2563eb", "important");
              }
            }
          }
        }
      });
    };

    // Apply colors
    forceProfileColors();
    const timeout = setTimeout(forceProfileColors, 100);

    return () => clearTimeout(timeout);
  }, [profile]);

  const form = useForm({
    initialValues: {
      name: profile?.name || "",
    },
    validate: {
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await withTimeout(updateProfile(values), 5000); // 5 second timeout
      notifications.show({
        title: "Success",
        message: "Profile updated successfully",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to update profile",
        color: "red",
      });
    }
  };

  // Contact form submission handler
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactEmail || !contactMessage) {
      notifications.show({
        title: "Error",
        message: "Please fill in both email and message fields",
        color: "red",
      });
      return;
    }

    setIsSubmittingContact(true);

    try {
      const formData = new FormData();
      formData.append("fields[email]", contactEmail);
      formData.append("fields[name]", contactMessage);
      formData.append("ml-submit", "1");
      formData.append("anticsrf", "true");

      const response = await fetch(
        "https://assets.mailerlite.com/jsonp/1613019/forms/158568564338460556/subscribe",
        {
          method: "POST",
          body: formData,
          mode: "no-cors", // Required for cross-origin requests
        },
      );

      // Since we're using no-cors mode, we can't read the response
      // but if no error is thrown, we assume success
      notifications.show({
        title: "Message Sent!",
        message: "Thank you for contacting us! We'll respond within 24 hours.",
        color: "green",
      });

      // Clear the form
      setContactEmail("");
      setContactMessage("");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to send message. Please try again later.",
        color: "red",
      });
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <Container size="md">
      <Title order={1} mb="xl">
        Profile Settings
      </Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="xl">
            <Card withBorder p="xl" radius="lg" shadow="sm">
              <Title order={3} mb="lg">
                Personal Information
              </Title>
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                  <TextInput
                    label="Full Name"
                    placeholder="Your full name"
                    leftSection={<User size={16} />}
                    required
                    radius="md"
                    {...form.getInputProps("name")}
                  />
                  <TextInput
                    label="Email"
                    value={profile?.email || ""}
                    leftSection={<Mail size={16} />}
                    disabled
                    radius="md"
                    description="Email cannot be changed"
                  />
                  <Group justify="flex-end" pt="md">
                    <Button type="submit" radius="md">
                      Update Profile
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Card>

            {/* Simple Contact Form */}
            <Card withBorder p="xl" radius="lg" shadow="sm">
              <Title order={3} mb="lg" style={{ color: "#FFFFFF" }}>
                Contact Us!
              </Title>
              <Text mb="lg" style={{ color: "#FFFFFF" }}>
                Let us know how we can help with something. Please provide your
                email address and describe your question or issue below.
              </Text>

              <form onSubmit={handleContactSubmit}>
                <Stack gap="lg">
                  <TextInput
                    label="Email Address"
                    placeholder="your.email@example.com"
                    leftSection={<Mail size={16} />}
                    required
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    autoComplete="email"
                    radius="md"
                    styles={{
                      label: { color: "#FFFFFF", fontWeight: 600 },
                    }}
                  />

                  <div>
                    <Text mb="xs" fw={500} style={{ color: "#FFFFFF" }}>
                      Your Message
                    </Text>
                    <textarea
                      placeholder="Please describe your question, issue, or feedback..."
                      required
                      rows={5}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="contact-form-textarea"
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #cccccc",
                        borderRadius: "4px",
                        padding: "10px",
                        width: "100%",
                        fontFamily: "'Open Sans', Arial, Helvetica, sans-serif",
                        fontSize: "14px",
                        resize: "vertical",
                        minHeight: "120px",
                      }}
                    />
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    radius="md"
                    loading={isSubmittingContact}
                    style={{
                      backgroundColor: "#2F9E44",
                      border: "none",
                    }}
                    styles={{
                      root: {
                        "&:hover": {
                          backgroundColor: "#259440",
                        },
                      },
                    }}
                  >
                    {isSubmittingContact ? "Sending..." : "Send Message"}
                  </Button>
                </Stack>
              </form>

              <Text
                size="sm"
                mt="md"
                style={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                We typically respond within 24 hours. Thank you for using
                ChromeExDev.Reviews!
              </Text>
            </Card>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Card withBorder p="xl" radius="lg" shadow="sm">
              <Group justify="space-between" mb="md">
                <Text fw={700} size="lg">
                  Account Status
                </Text>
                <Badge color="green">Active</Badge>
              </Group>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm">Member Since</Text>
                  <Text size="sm" c="dimmed">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "N/A"}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Role</Text>
                  <Badge size="sm" variant="light">
                    {profile?.role || "user"}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Qualification</Text>
                  <Badge
                    size="sm"
                    color={
                      profile?.has_completed_qualification ? "green" : "yellow"
                    }
                  >
                    {profile?.has_completed_qualification
                      ? "Completed"
                      : "Pending"}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Subscription</Text>
                  <Badge
                    size="sm"
                    color={planName === "Premium" ? "green" : "blue"}
                  >
                    {planName}
                  </Badge>
                </Group>
              </Stack>
            </Card>

            <Card withBorder p="xl" radius="lg" shadow="sm">
              <Group justify="space-between" mb="md">
                <Text fw={700} size="lg">
                  Credits
                </Text>
                <Star size={20} />
              </Group>
              <Text size="2.5rem" fw={800} c="blue.6">
                {profile?.credit_balance || 0}
              </Text>
              <Text size="sm" c="dimmed">
                Available credits for queue submissions
              </Text>
            </Card>

            <Card withBorder p="xl" radius="lg" shadow="sm">
              <Text fw={700} size="lg" mb="lg">
                Quick Actions
              </Text>
              <Stack gap="md">
                {!isPremium && (
                  <Button
                    variant="gradient"
                    gradient={{ from: "yellow", to: "orange" }}
                    fullWidth
                    leftSection={<Crown size={16} />}
                    onClick={() => navigate("/upgrade")}
                    radius="md"
                  >
                    Join Review Fast Track
                  </Button>
                )}
                <Button
                  variant="light"
                  fullWidth
                  component="a"
                  href="/extensions"
                  radius="md"
                >
                  Manage Extensions
                </Button>
                <Button
                  variant="light"
                  fullWidth
                  component="a"
                  href="/reviews"
                  radius="md"
                >
                  View Reviews
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
