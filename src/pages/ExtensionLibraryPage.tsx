import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Button,
  Table,
  Badge,
  Group,
  ActionIcon,
  Text,
  Alert,
  Avatar,
  Card,
  Stack,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Plus, Edit, Trash2, Upload, AlertCircle, Package } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { AddExtensionModal } from "../components/AddExtensionModal";
import { useSubscription } from "../hooks/useSubscription";
import type { Database } from "../types/database";

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

type Extension = Database["public"]["Tables"]["extensions"]["Row"];

export function ExtensionLibraryPage() {
  const { profile, refreshProfile, updateProfile } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExtension, setEditingExtension] = useState<Extension | null>(
    null,
  );

  // Helper function to check if user needs monthly reset
  const checkAndResetMonthlyLimit = async () => {
    if (!profile) return false;

    // Only check for free tier users
    if (profile.subscription_status !== "free") return true;

    const lastResetDate = profile.last_exchange_reset_date
      ? new Date(profile.last_exchange_reset_date)
      : new Date(0);
    const daysSinceReset = Math.floor(
      (Date.now() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // If 28 or more days have passed, reset the counter
    if (daysSinceReset >= 28) {
      console.log("🔄 Resetting monthly exchange count for user");
      await updateProfile({
        exchanges_this_month: 0,
        last_exchange_reset_date: new Date().toISOString(),
      });
      return true;
    }

    return true;
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  const fetchExtensions = async () => {
    try {
      if (!profile?.id) {
        console.log("No profile ID available yet");
        return;
      }

      console.log("Fetching extensions for user:", profile.id);

      // Use Edge Function to bypass RLS and prevent infinite recursion
      const { data, error } = await withTimeout(
        supabase.functions.invoke("fetch-user-extensions", {
          body: { user_id: profile.id },
        }),
        10000, // 10 second timeout for edge function calls
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to fetch extensions");
      }

      setExtensions(data.data || []);
      console.log("Extensions fetch completed");
    } catch (error) {
      console.error("Error fetching extensions:", error);
      notifications.show({
        title: "Error",
        message: (error as Error)?.message || "Failed to load extensions",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtensionSuccess = () => {
    setModalOpen(false);
    setEditingExtension(null);
    fetchExtensions();
  };

  const handleEdit = (extension: Extension) => {
    setEditingExtension(extension);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this extension?")) return;

    try {
      const { error } = await supabase.from("extensions").delete().eq("id", id);

      if (error) throw error;
      notifications.show({
        title: "Success",
        message: "Extension deleted successfully",
        color: "green",
      });
      fetchExtensions();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to delete extension",
        color: "red",
      });
    }
  };

  const handleSubmitToQueue = async (extension: Extension) => {
    if (!profile) {
      notifications.show({
        title: "Error",
        message: "Profile not loaded. Please try again.",
        color: "red",
      });
      return;
    }

    if (profile.credit_balance < 1) {
      notifications.show({
        title: "Insufficient Credits",
        message:
          "You need at least 1 credit to submit an extension to the review queue",
        color: "red",
      });
      return;
    }

    // Check freemium limits for free tier users
    if (!isPremium) {
      // First, check if we need to reset the monthly counter
      await checkAndResetMonthlyLimit();

      // Refresh profile to get updated data after potential reset
      await refreshProfile();

      // Check if user has reached their monthly limit (1 submission for free tier)
      if ((profile.exchanges_this_month || 0) >= 1) {
        notifications.show({
          title: "Monthly Limit Reached",
          message:
            "You have reached your monthly submission limit of 1 extension for the free tier. Upgrade to premium for unlimited submissions.",
          color: "orange",
          autoClose: 8000,
        });
        return;
      }
    }

    try {
      // Update extension status and deduct credit
      const { error: extensionError } = await supabase
        .from("extensions")
        .update({
          status: "queued",
          submitted_to_queue_at: new Date().toISOString(),
        })
        .eq("id", extension.id);

      if (extensionError) throw extensionError;

      // Deduct credit
      const { error: creditError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: profile.id,
          amount: -1,
          type: "spent",
          description: `Queue submission for ${extension.name}`,
        });

      if (creditError) throw creditError;

      // For free tier users, increment their monthly exchange count
      if (!isPremium) {
        await updateProfile({
          exchanges_this_month: (profile.exchanges_this_month || 0) + 1,
        });
      }

      // Refresh profile to update credit balance display
      await refreshProfile();

      notifications.show({
        title: "Success",
        message:
          "Extension submitted for review! You will be notified by email when the review has been uploaded to the Chrome Web Store.",
        color: "green",
      });

      fetchExtensions();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to submit extension",
        color: "red",
      });
    }
  };

  const getStatusColor = (status: Extension["status"]) => {
    switch (status) {
      case "verified":
      case "library":
        return "green";
      case "queued":
        return "blue";
      case "assigned":
        return "purple";
      case "reviewed":
      case "completed":
        return "orange";
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status: Extension["status"]) => {
    switch (status) {
      case "verified":
        return "In my Library";
      case "library":
        return "In my Library";
      case "queued":
        return "In Review Queue";
      case "assigned":
        return "Selected for Review";
      case "reviewed":
        return "Review Submitted";
      case "completed":
        return "Completed";
      case "rejected":
        return "Rejected";
      default:
        return status.replace("_", " ");
    }
  };

  // FORCE EXTENSION LIBRARY COLORS WITH JAVASCRIPT
  useEffect(() => {
    const forceExtensionLibraryColors = () => {
      console.log(
        "🎨 FORCING EXTENSION LIBRARY COLORS - JavaScript is running!",
      );

      // Force status badges to be more vibrant
      const statusBadges = document.querySelectorAll(".mantine-Badge-root");
      console.log("Found Extension Library badges:", statusBadges.length);

      statusBadges.forEach((badge) => {
        if (badge instanceof HTMLElement) {
          const text = badge.textContent?.trim();

          switch (text) {
            case "In my Library":
              console.log("Setting BRIGHT GREEN for In my Library");
              badge.style.backgroundColor = "#059669";
              badge.style.color = "#ffffff";
              badge.style.setProperty(
                "background-color",
                "#059669",
                "important",
              );
              badge.style.setProperty("color", "#ffffff", "important");
              break;
            case "In Review Queue":
              console.log("Setting BRIGHT BLUE for In Review Queue");
              badge.style.backgroundColor = "#2563eb";
              badge.style.color = "#ffffff";
              badge.style.setProperty(
                "background-color",
                "#2563eb",
                "important",
              );
              badge.style.setProperty("color", "#ffffff", "important");
              break;
            case "Selected for Review":
              console.log("Setting BRIGHT PURPLE for Selected for Review");
              badge.style.backgroundColor = "#7c3aed";
              badge.style.color = "#ffffff";
              badge.style.setProperty(
                "background-color",
                "#7c3aed",
                "important",
              );
              badge.style.setProperty("color", "#ffffff", "important");
              break;
            case "Review Submitted":
              console.log("Setting BRIGHT ORANGE for Review Submitted");
              badge.style.backgroundColor = "#ea580c";
              badge.style.color = "#ffffff";
              badge.style.setProperty(
                "background-color",
                "#ea580c",
                "important",
              );
              badge.style.setProperty("color", "#ffffff", "important");
              break;
            case "Rejected":
              console.log("Setting BRIGHT RED for Rejected");
              badge.style.backgroundColor = "#dc2626";
              badge.style.color = "#ffffff";
              badge.style.setProperty(
                "background-color",
                "#dc2626",
                "important",
              );
              badge.style.setProperty("color", "#ffffff", "important");
              break;
          }
        }
      });
    };

    // Run immediately and also with a small delay to ensure DOM is ready
    forceExtensionLibraryColors();
    const timeout = setTimeout(forceExtensionLibraryColors, 100);

    return () => clearTimeout(timeout);
  }, [extensions]);

  const handleMoveToLibrary = async (extension: Extension) => {
    try {
      // Use Edge Function to update extension status to avoid RLS issues
      const { data: updateResponse, error } = await supabase.functions.invoke(
        "update-extension-status",
        {
          body: {
            extension_id: extension.id,
            status: "verified",
          },
        },
      );

      if (error || !updateResponse?.success) {
        throw new Error(
          updateResponse?.error ||
            error?.message ||
            "Failed to update extension status",
        );
      }

      notifications.show({
        title: "Success",
        message: "Extension moved back to your library",
        color: "green",
      });
      fetchExtensions();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to move extension to library",
        color: "red",
      });
    }
  };

  const openModal = () => {
    // Check freemium limits for free tier users
    if (!isPremium && extensions.length >= 1) {
      notifications.show({
        title: "Extension Limit Reached",
        message:
          "To add more extensions to the Extension Library, please join Review Fast Track.",
        color: "orange",
        autoClose: 8000,
      });
      return;
    }

    setEditingExtension(null);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <Container size="lg">
        <Text>Loading extensions...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Extension Library</Title>
          <Text c="dimmed">
            Manage your Chrome extensions and submit them for review
          </Text>
          {!isPremium && (
            <Text size="sm" c="orange" mt="xs">
              Free tier: Limited to 1 extension with up to 4 monthly submissions
            </Text>
          )}
        </div>
        <Group>
          {!isPremium && extensions.length >= 1 && (
            <Text size="sm" c="dimmed">
              Join Review Fast Track to add more extensions
            </Text>
          )}
          <Button
            leftSection={<Plus size={16} />}
            onClick={openModal}
            disabled={!isPremium && extensions.length >= 1}
          >
            Add Extension
          </Button>
        </Group>
      </Group>

      {!isPremium && extensions.length >= 1 && (
        <Alert
          icon={<AlertCircle size={16} />}
          title="Free Tier Limit"
          color="blue"
          mb="md"
        >
          You've reached the free tier limit of 1 extension. You can still
          submit this extension to the review queue up to 4 times per month.
          <Button
            variant="light"
            size="sm"
            mt="sm"
            ml="sm"
            onClick={() => navigate("/upgrade")}
          >
            Join Review Fast Track
          </Button>
        </Alert>
      )}

      {!profile?.has_completed_first_review && extensions.length > 0 && (
        <Alert
          icon={<AlertCircle size={16} />}
          title="First Review Required"
          color="blue"
          mb="md"
        >
          You must complete your first review assignment before submitting
          extensions to the queue. This ensures everyone contributes to the
          community before receiving reviews.
          <Button
            variant="light"
            size="sm"
            mt="sm"
            ml="sm"
            onClick={() => navigate("/reviews")}
          >
            Request Review Assignment
          </Button>
        </Alert>
      )}

      {extensions.length === 0 ? (
        <Card withBorder p="xl" radius="lg" shadow="sm">
          <Stack align="center" gap="xl" py="xl">
            <ThemeIcon size={80} radius="xl" variant="light" color="blue">
              <Package size={40} />
            </ThemeIcon>
            <Stack align="center" gap="md">
              <Title order={2} ta="center">
                No extensions yet
              </Title>
              <Text c="dimmed" size="lg" ta="center" maw={500}>
                Start by adding your first Chrome extension to get authentic
                reviews from the developer community.
              </Text>
            </Stack>
            <Button
              leftSection={<Plus size={20} />}
              onClick={openModal}
              size="lg"
              radius="md"
              disabled={!isPremium && extensions.length >= 1}
            >
              Add Your First Extension
            </Button>
          </Stack>
        </Card>
      ) : (
        <Card withBorder radius="lg" shadow="sm">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Extension</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {extensions.map((extension) => (
                <Table.Tr key={extension.id}>
                  <Table.Td>
                    <Group>
                      <Avatar size="sm" src={extension.logo_url} />
                      <div>
                        <Text fw={500}>{extension.name}</Text>
                        <Text size="sm" c="dimmed" truncate maw={300}>
                          {extension.description}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(extension.status)} radius="md">
                      {getStatusLabel(extension.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {extension.category?.join(", ") || "No category"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        radius="md"
                        onClick={() => handleEdit(extension)}
                        disabled={
                          !["library", "verified", "rejected"].includes(
                            extension.status,
                          )
                        }
                      >
                        <Edit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        radius="md"
                        onClick={() => handleDelete(extension.id)}
                        disabled={
                          !["library", "verified", "rejected"].includes(
                            extension.status,
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </ActionIcon>
                      {(extension.status === "verified" ||
                        extension.status === "library") &&
                        (profile?.credit_balance ?? 0) > 0 &&
                        profile?.has_completed_first_review && (
                          <Button
                            size="xs"
                            radius="md"
                            onClick={() => handleSubmitToQueue(extension)}
                            disabled={
                              !isPremium &&
                              (profile?.exchanges_this_month || 0) >= 1
                            }
                          >
                            {!isPremium &&
                            (profile?.exchanges_this_month || 0) >= 1
                              ? "Monthly Limit Reached"
                              : "Submit to Queue"}
                          </Button>
                        )}
                      {extension.status === "rejected" &&
                        (profile?.credit_balance ?? 0) > 0 &&
                        profile?.has_completed_first_review && (
                          <Button
                            size="xs"
                            color="orange"
                            radius="md"
                            onClick={() => handleSubmitToQueue(extension)}
                            disabled={
                              !isPremium &&
                              (profile?.exchanges_this_month || 0) >= 1
                            }
                          >
                            {!isPremium &&
                            (profile?.exchanges_this_month || 0) >= 1
                              ? "Monthly Limit Reached"
                              : "Re-submit to Queue"}
                          </Button>
                        )}
                      {extension.status === "reviewed" && (
                        <Button
                          size="xs"
                          color="green"
                          radius="md"
                          onClick={() => handleMoveToLibrary(extension)}
                        >
                          Add to Library
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <AddExtensionModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleExtensionSuccess}
        initialExtensionData={editingExtension || undefined}
        userExtensionsCount={extensions.length}
      />
    </Container>
  );
}
