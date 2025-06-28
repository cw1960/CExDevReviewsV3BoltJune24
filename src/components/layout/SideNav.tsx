import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  AppShell,
  NavLink as MantineNavLink,
  Group,
  Text,
  Button,
  Stack,
  Alert,
} from "@mantine/core";
import {
  Home,
  Package,
  Star,
  User,
  Settings,
  LogOut,
  Shield,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";

export function SideNav() {
  const { profile, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    { icon: Home, label: "Dashboard", to: "/dashboard" },
    { icon: Package, label: "Extension Library", to: "/extensions" },
    { icon: Star, label: "Review Queue", to: "/reviews" },
    { icon: User, label: "Profile", to: "/profile" },
  ];

  const adminNavItems = [
    { icon: Shield, label: "Admin Dashboard", to: "/admin" },
  ];

  return (
    <AppShell.Navbar p="md">
      <AppShell.Section>
        <Group mb="md">
          <img
            src="https://i.imgur.com/PL0Syo1.png"
            alt="ChromeExDev Logo"
            style={{ width: 144, height: "auto" }}
          />
        </Group>
      </AppShell.Section>

      <AppShell.Section grow>
        <Stack gap={4}>
          {navItems.map((item) => (
            <MantineNavLink
              key={item.to}
              component={NavLink}
              to={item.to}
              label={item.label}
              leftSection={<item.icon size={16} />}
              style={({ isActive }) => ({
                backgroundColor: isActive
                  ? "var(--mantine-color-blue-light)"
                  : undefined,
                borderRadius: "var(--mantine-radius-sm)",
              })}
            />
          ))}

          {profile?.role === "admin" && (
            <>
              <Text size="sm" c="dimmed" mt="md" mb="xs">
                Administration
              </Text>
              {adminNavItems.map((item) => (
                <MantineNavLink
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  label={item.label}
                  leftSection={<item.icon size={16} />}
                  style={({ isActive }) => ({
                    backgroundColor: isActive
                      ? "var(--mantine-color-blue-light)"
                      : undefined,
                    borderRadius: "var(--mantine-radius-sm)",
                  })}
                />
              ))}
            </>
          )}
        </Stack>
      </AppShell.Section>

      <AppShell.Section>
        <Group justify="space-between" mb="xs">
          <Text size="sm" c="dimmed">
            Credits
          </Text>
          <Text size="sm" fw={600}>
            {profile?.credit_balance || 0}
          </Text>
        </Group>
        <Group justify="space-between" mb="xs">
          <Text size="sm" c="dimmed">
            Plan
          </Text>
          <Text size="sm" fw={600}>
            {isPremium ? "Review Fast Track" : "Free"}
          </Text>
        </Group>
        <Button
          variant="light"
          leftSection={<LogOut size={16} />}
          fullWidth
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </AppShell.Section>
    </AppShell.Navbar>
  );
}
