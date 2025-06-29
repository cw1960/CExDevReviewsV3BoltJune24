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

  // LOAD MAILERLITE SCRIPTS AND FORCE PROFILE PAGE COLORS
  React.useEffect(() => {
    // Load MailerLite Universal script
    const loadMailerLiteScripts = () => {
      // MailerLite Universal script
      if (!(window as any).ml) {
        (function (w: any, d: any, e: any, u: any, f: any, l: any, n: any) {
          w[f] =
            w[f] ||
            function () {
              (w[f].q = w[f].q || []).push(arguments);
            };
          l = d.createElement(e);
          l.async = 1;
          l.src = u;
          n = d.getElementsByTagName(e)[0];
          n.parentNode.insertBefore(l, n);
        })(
          window,
          document,
          "script",
          "https://assets.mailerlite.com/js/universal.js",
          "ml",
        );
        (window as any).ml("account", "1613019");
      }

      // Load reCAPTCHA script
      if (
        !document.querySelector(
          'script[src="https://www.google.com/recaptcha/api.js"]',
        )
      ) {
        const recaptchaScript = document.createElement("script");
        recaptchaScript.src = "https://www.google.com/recaptcha/api.js";
        document.head.appendChild(recaptchaScript);
      }

      // Load MailerLite webforms script
      if (!document.querySelector('script[src*="webforms.min.js"]')) {
        const webformsScript = document.createElement("script");
        webformsScript.src =
          "https://groot.mailerlite.com/js/w/webforms.min.js?v176e10baa5e7ed80d35ae235be3d5024";
        webformsScript.type = "text/javascript";
        document.body.appendChild(webformsScript);
      }

      // Load tracking script
      if (!document.querySelector('script[src*="takel"]')) {
        fetch(
          "https://assets.mailerlite.com/jsonp/1613019/forms/158568564338460556/takel",
        ).catch(() => {}); // Silent fail if tracking doesn't work
      }

      // Add success callback function
      if (!(window as any).ml_webform_success_27795499) {
        (window as any).ml_webform_success_27795499 = function () {
          const $ = (window as any).ml_jQuery || (window as any).jQuery;
          if ($) {
            $(".ml-subscribe-form-27795499 .row-success").show();
            $(".ml-subscribe-form-27795499 .row-form").hide();
          }
        };
      }
    };

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

    // Load scripts and apply colors
    loadMailerLiteScripts();
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

            {/* MailerLite Contact Form */}
            <Card withBorder p="xl" radius="lg" shadow="sm">
              <div
                id="mlb2-27795499"
                className="ml-form-embedContainer ml-subscribe-form ml-subscribe-form-27795499"
              >
                <div className="ml-form-align-center">
                  <div className="ml-form-embedWrapper embedForm">
                    <div className="ml-form-embedBody ml-form-embedBodyDefault row-form">
                      <div className="ml-form-embedContent">
                        <h4
                          style={{
                            color: "#FFFFFF",
                            fontSize: "30px",
                            fontWeight: 400,
                            margin: "0 0 10px 0",
                          }}
                        >
                          Contact Us!
                        </h4>
                        <p
                          style={{
                            color: "#FFFFFF",
                            fontSize: "14px",
                            fontWeight: 400,
                            lineHeight: "20px",
                            margin: "0 0 10px 0",
                          }}
                        >
                          Let us know how we can help with something. Please
                          provide the email address you used to sign up and then
                          provide your comment below.
                        </p>
                      </div>

                      <form
                        className="ml-block-form"
                        action="https://assets.mailerlite.com/jsonp/1613019/forms/158568564338460556/subscribe"
                        data-code=""
                        method="post"
                        target="_blank"
                      >
                        <div className="ml-form-formContent">
                          <div className="ml-form-fieldRow">
                            <div className="ml-field-group ml-field-email ml-validate-email ml-validate-required">
                              <input
                                aria-label="email"
                                aria-required="true"
                                type="email"
                                className="form-control"
                                data-inputmask=""
                                name="fields[email]"
                                placeholder="Email"
                                autoComplete="email"
                                style={{
                                  backgroundColor: "#ffffff",
                                  color: "#333333",
                                  borderColor: "#cccccc",
                                  borderRadius: "4px",
                                  borderStyle: "solid",
                                  borderWidth: "1px",
                                  fontFamily:
                                    "'Open Sans', Arial, Helvetica, sans-serif",
                                  fontSize: "14px",
                                  padding: "10px",
                                  width: "100%",
                                  boxSizing: "border-box",
                                  marginBottom: "10px",
                                }}
                              />
                            </div>
                          </div>
                          <div className="ml-form-fieldRow ml-last-item">
                            <div className="ml-field-group ml-field-name">
                              <textarea
                                className="form-control"
                                name="fields[name]"
                                aria-label="name"
                                maxLength={255}
                                placeholder="Your message..."
                                style={{
                                  backgroundColor: "#ffffff",
                                  color: "#333333",
                                  borderColor: "#cccccc",
                                  borderRadius: "4px",
                                  borderStyle: "solid",
                                  borderWidth: "1px",
                                  fontFamily:
                                    "'Open Sans', Arial, Helvetica, sans-serif",
                                  fontSize: "14px",
                                  padding: "10px",
                                  width: "100%",
                                  boxSizing: "border-box",
                                  height: "auto",
                                  minHeight: "100px",
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div
                          className="ml-form-recaptcha ml-validate-required"
                          style={{ float: "left", marginBottom: "20px" }}
                        >
                          <div
                            className="g-recaptcha"
                            data-sitekey="6Lf1KHQUAAAAAFNKEX1hdSWCS3mRMv4FlFaNslaD"
                          ></div>
                        </div>

                        <input type="hidden" name="ml-submit" value="1" />

                        <div className="ml-form-embedSubmit">
                          <button
                            type="submit"
                            className="primary"
                            style={{
                              backgroundColor: "#2F9E44",
                              border: "none",
                              borderRadius: "4px",
                              boxShadow: "none",
                              color: "#ffffff",
                              cursor: "pointer",
                              fontFamily:
                                "'Open Sans', Arial, Helvetica, sans-serif",
                              fontSize: "14px",
                              fontWeight: "700",
                              lineHeight: "21px",
                              height: "auto",
                              padding: "10px",
                              width: "100%",
                              boxSizing: "border-box",
                            }}
                          >
                            Submit your message
                          </button>
                          <button
                            disabled
                            style={{ display: "none" }}
                            type="button"
                            className="loading"
                          >
                            <div className="ml-form-embedSubmitLoad"></div>
                            <span className="sr-only">Loading...</span>
                          </button>
                        </div>

                        <input type="hidden" name="anticsrf" value="true" />
                      </form>
                    </div>

                    <div
                      className="ml-form-successBody row-success"
                      style={{ display: "none" }}
                    >
                      <div className="ml-form-successContent">
                        <h4
                          style={{
                            color: "#FFFFFF",
                            fontSize: "30px",
                            fontWeight: 400,
                            margin: "0 0 10px 0",
                          }}
                        >
                          Thank you!
                        </h4>
                        <p
                          style={{
                            color: "#FFFFFF",
                            fontSize: "14px",
                            fontWeight: 400,
                            lineHeight: "20px",
                            margin: "0 0 10px 0",
                          }}
                        >
                          Your message has been sent to our team. We'll respond
                          as quickly as we can. Thank you for using
                          ChromeExDev.Reviews!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
