import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Stack,
  Container,
  Tabs,
  Alert,
  Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { Package, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("signin");
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const signInForm = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length < 6 ? "Password must be at least 6 characters" : null,
    },
  });

  const signUpForm = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length < 6 ? "Password must be at least 6 characters" : null,
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords do not match" : null,
    },
  });

  const handleSignIn = async (values: typeof signInForm.values) => {
    setLoading(true);
    try {
      await signIn(values.email, values.password);
      notifications.show({
        title: "Welcome back!",
        message: "Successfully signed in",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "Sign in failed",
        message: error.message || "An error occurred",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (values: typeof signUpForm.values) => {
    setLoading(true);
    try {
      await signUp(values.email, values.password, values.name);
      notifications.show({
        title: "Account created!",
        message: "Welcome to ChromeExDev.reviews",
        color: "green",
      });
      navigate("/onboarding");
    } catch (error: any) {
      notifications.show({
        title: "Sign up failed",
        message: error.message || "An error occurred",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // User will be redirected to Google, then back to this page
      // The auth state will be handled by the AuthContext
    } catch (error: any) {
      notifications.show({
        title: "Google sign in failed",
        message: error.message || "An error occurred",
        color: "red",
      });
      setGoogleLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Group justify="center" mb={30}>
        <img
          src="https://i.imgur.com/PL0Syo1.png"
          alt="ChromeExDev Logo"
          style={{ width: 180, height: "auto" }}
        />
      </Group>

      <Paper withBorder shadow="xl" p="xl" radius="lg">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow>
            <Tabs.Tab value="signin">Sign In</Tabs.Tab>
            <Tabs.Tab value="signup">Sign Up</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="signin" pt="md">
            <Stack gap="lg">
              {/* Google OAuth Button */}
              <Button
                fullWidth
                variant="outline"
                leftSection={
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285f4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34a853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#fbbc05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#ea4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
                onClick={handleGoogleAuth}
                loading={googleLoading}
                radius="md"
                size="md"
              >
                Continue with Google
              </Button>

              <Divider label="Or continue with email" labelPosition="center" />

              {/* Email/Password Form */}
              <form onSubmit={signInForm.onSubmit(handleSignIn)}>
                <Stack gap="lg">
                  <TextInput
                    label="Email"
                    placeholder="your@email.com"
                    required
                    radius="md"
                    {...signInForm.getInputProps("email")}
                  />
                  <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    required
                    {...signInForm.getInputProps("password")}
                    radius="md"
                  />
                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    radius="md"
                    size="md"
                  >
                    Sign In
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="signup" pt="md">
            <Alert
              icon={<AlertCircle size={16} />}
              title="Developer Community"
              color="blue"
              mb="md"
            >
              Join our trusted community of Chrome extension developers for
              authentic review exchanges.
            </Alert>

            <Stack gap="lg">
              {/* Google OAuth Button */}
              <Button
                fullWidth
                variant="outline"
                leftSection={
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285f4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34a853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#fbbc05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#ea4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
                onClick={handleGoogleAuth}
                loading={googleLoading}
                radius="md"
                size="md"
              >
                Continue with Google
              </Button>

              <Divider label="Or continue with email" labelPosition="center" />

              {/* Email/Password Form */}
              <form onSubmit={signUpForm.onSubmit(handleSignUp)}>
                <Stack gap="lg">
                  <TextInput
                    label="First Name"
                    placeholder="John Doe"
                    required
                    radius="md"
                    {...signUpForm.getInputProps("name")}
                  />
                  <TextInput
                    label="Email"
                    placeholder="your@email.com"
                    required
                    {...signUpForm.getInputProps("email")}
                    radius="md"
                  />
                  <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    required
                    radius="md"
                    {...signUpForm.getInputProps("password")}
                  />
                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    required
                    {...signUpForm.getInputProps("confirmPassword")}
                    radius="md"
                  />
                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    radius="md"
                    size="md"
                  >
                    Create Account
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
}
