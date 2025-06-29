import React, { useState, useEffect } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  Stack,
  Group,
  Button,
  FileInput,
  Avatar,
  Text,
  Alert,
  Card,
  Badge,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  Upload,
  AlertCircle,
  Zap,
  Globe,
  Tag,
  FileText,
  Shield,
  Star,
  Gift,
  Package,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useSubscription } from "../hooks/useSubscription";
import type { Database } from "../types/database";

type Extension = Database["public"]["Tables"]["extensions"]["Row"];

const CATEGORIES = [
  "Accessibility",
  "Art & Design",
  "Communication",
  "Developer Tools",
  "Education",
  "Entertainment",
  "Functionality & UI",
  "Games",
  "Household",
  "Just for Fun",
  "News & Weather",
  "Privacy & Security",
  "Shopping",
  "Social Media & Networking",
  "Tools",
  "Travel",
  "Well-being",
  "Workflow & Planning",
];

const ACCESS_TYPES = [
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "free_trial", label: "Free Trial" },
  { value: "promo_code", label: "Promo Code Required" },
];

interface AddExtensionModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: (extension: Extension) => void;
  initialExtensionData?: Partial<Extension>;
  userExtensionsCount?: number;
}

export function AddExtensionModal({
  opened,
  onClose,
  onSuccess,
  initialExtensionData,
  userExtensionsCount = 0,
}: AddExtensionModalProps) {
  const { profile } = useAuth();
  const { isPremium } = useSubscription();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: "",
      chrome_store_url: "",
      description: "",
      category: [],
      access_type: "free" as "free" | "freemium" | "free_trial" | "promo_code",
      promo_code: "",
      promo_code_expires_at: "",
    },
    validate: {
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      chrome_store_url: (value) => {
        // Normalize input
        const url = value.trim();
        // Improved regex: allows URL-encoded characters, optional trailing slash, query params, and fragments
        const urlRegex =
          /^https?:\/\/(www\.)?chromewebstore\.google\.com\/detail\/[a-zA-Z0-9_%-]+(\/[a-zA-Z0-9_%-]+)?(\/)?(\?.*)?(#.*)?$/i;
        if (!urlRegex.test(url)) {
          return "Please provide a valid Chrome Web Store URL";
        }
        return null;
      },
    },
  });

  // Effect to populate form when editing an existing extension
  useEffect(() => {
    if (opened) {
      if (initialExtensionData) {
        // Editing existing extension
        form.setValues({
          name: initialExtensionData.name || "",
          chrome_store_url: initialExtensionData.chrome_store_url || "",
          description: initialExtensionData.description || "",
          category: initialExtensionData.category || [],
          access_type:
            (initialExtensionData.access_type as
              | "free"
              | "freemium"
              | "free_trial"
              | "promo_code") || "free",
          promo_code: initialExtensionData.promo_code || "",
          promo_code_expires_at:
            initialExtensionData.promo_code_expires_at || "",
        });
        setPreviewUrl(initialExtensionData.logo_url || null);
        setSelectedFile(null);
      } else {
        // Adding new extension
        form.reset();
        setPreviewUrl(null);
        setSelectedFile(null);
      }
    }
  }, [opened, initialExtensionData]);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(initialExtensionData?.logo_url || null);
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      notifications.show({
        title: "Invalid File Type",
        message: "Please select a PNG, JPG, JPEG, or SVG image file",
        color: "red",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      notifications.show({
        title: "File Too Large",
        message: "Please select an image smaller than 5MB",
        color: "red",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const uploadImage = async (
    file: File,
    extensionId: string,
  ): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${extensionId}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("extension-logos2")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("extension-logos2").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!profile || !profile.id) {
      notifications.show({
        title: "Profile Error",
        message:
          "User profile is not loaded. Please refresh the page and try again.",
        color: "red",
      });
      return;
    }

    // Check freemium limits for free tier users (only when adding new extensions, not editing)
    if (
      profile.subscription_status === "free" &&
      !initialExtensionData &&
      userExtensionsCount >= 1
    ) {
      notifications.show({
        title: "Extension Limit Reached",
        message:
          "Free tier users are limited to one extension. Upgrade to premium to add more extensions.",
        color: "orange",
        autoClose: 8000,
      });
      return;
    }

    setUploading(true);
    try {
      let logoUrl = initialExtensionData?.logo_url || null;

      // If we have a new file selected, upload it
      if (!isPremium && !initialExtensionData && userExtensionsCount >= 1) {
        const extensionId = initialExtensionData?.id || crypto.randomUUID();
        logoUrl = await uploadImage(selectedFile, extensionId);
      }

      let extensionData;
      let result;
      console.log("🔄 Processing extension data...");

      if (initialExtensionData?.id) {
        // Update existing extension using Edge Function to avoid RLS issues
        extensionData = {
          name: values.name,
          chrome_store_url: values.chrome_store_url,
          description: values.description,
          category: values.category,
          access_type: values.access_type,
          promo_code: values.promo_code,
          promo_code_expires_at: values.promo_code_expires_at || null,
          logo_url: logoUrl,
        };

        console.log(
          "📤 Calling update-extension Edge Function with data:",
          extensionData,
        );

        const { data: updateResponse, error } = await supabase.functions.invoke(
          "update-extension",
          {
            body: {
              extension_id: initialExtensionData.id,
              updates: extensionData,
            },
          },
        );

        console.log("📥 Update response received:", {
          data: updateResponse,
          error: error,
          success: updateResponse?.success,
        });

        if (error || !updateResponse?.success) {
          const errorMessage =
            updateResponse?.error ||
            error?.message ||
            "Failed to update extension";
          throw new Error(`Update failed: ${errorMessage}`);
        }

        result = updateResponse.data;

        notifications.show({
          title: "Success",
          message: "Extension updated successfully",
          color: "green",
        });
      } else {
        // Create new extension using Edge Function to avoid RLS issues
        extensionData = {
          ...values,
          owner_id: profile.id,
          status: "library" as const,
          logo_url: logoUrl,
          promo_code_expires_at: values.promo_code_expires_at || null,
        };

        const { data: createResponse, error } = await supabase.functions.invoke(
          "create-extension",
          {
            body: extensionData,
          },
        );

        if (error || !createResponse?.success) {
          const errorMessage =
            createResponse?.error ||
            error?.message ||
            "Failed to create extension";
          throw new Error(`Creation failed: ${errorMessage}`);
        }
        result = createResponse.data;

        // If we have a selected file but no logo_url yet (new extension), upload now
        if (selectedFile && !logoUrl) {
          const uploadedUrl = await uploadImage(selectedFile, result.id);

          // Update the extension with the logo URL
          const { data: logoUpdateResponse, error: updateError } =
            await supabase.functions.invoke("update-extension", {
              body: {
                extension_id: result.id,
                updates: { logo_url: uploadedUrl },
              },
            });

          if (updateError || !logoUpdateResponse?.success) {
            const errorMessage =
              logoUpdateResponse?.error ||
              updateError?.message ||
              "Failed to update extension logo";
            throw new Error(`Logo update failed: ${errorMessage}`);
          }

          result = logoUpdateResponse.data;
        }

        notifications.show({
          title: "Success",
          message: "Extension added successfully",
          color: "green",
        });
      }

      onSuccess(result);
      handleClose();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to save extension. Please try again.",
        color: "red",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    // Clean up preview URL if it's a blob URL
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <ThemeIcon
            size={40}
            radius="xl"
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
            }}
          >
            <Package size={20} color="white" />
          </ThemeIcon>
          <Text fw={700} size="xl" c="dark.8">
            {initialExtensionData?.id
              ? "✨ Edit Extension"
              : "🚀 Add Extension"}
          </Text>
        </Group>
      }
      size="xl"
      radius="lg"
      shadow="xl"
      centered={true}
      withinPortal={true}
      closeOnClickOutside={true}
      closeOnEscape={true}
      zIndex={900}
      overlayProps={{
        backgroundOpacity: 0.7,
        blur: 4,
      }}
      styles={{
        overlay: {
          background:
            "linear-gradient(135deg, rgba(102, 126, 234, 0.8), rgba(118, 75, 162, 0.8))",
        },
        inner: {
          padding: "20px",
        },
        header: {
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "none",
          borderRadius: "12px 12px 0 0",
          padding: "20px 24px",
        },
        content: {
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          maxHeight: "90vh",
          overflowY: "auto",
          border: "none",
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        },
        body: {
          padding: "24px",
          background: "transparent",
        },
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Badge
            size="lg"
            variant="light"
            color="blue"
            styles={{
              root: {
                background:
                  "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))",
                color: "#3b82f6",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              },
            }}
          >
            {initialExtensionData?.id
              ? "Edit Extension Details"
              : "Add New Extension"}
          </Badge>

          <Card
            shadow="md"
            radius="lg"
            p="xl"
            style={{
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(5px)",
              border: "2px solid rgba(16, 185, 129, 0.1)",
            }}
          >
            <Group gap="sm" mb="lg">
              <ThemeIcon color="green" size={32} radius="xl">
                <Star size={18} />
              </ThemeIcon>
              <Text fw={700} size="lg" c="dark.8">
                Extension Details
              </Text>
            </Group>
            <TextInput
              label="Extension Name"
              placeholder="My Awesome Extension"
              required
              radius="md"
              size="md"
              styles={{
                label: {
                  color: "#374151",
                  fontWeight: 600,
                  fontSize: "14px",
                  marginBottom: "8px",
                },
                input: {
                  borderColor: "#10b981",
                  borderWidth: "2px",
                  fontSize: "14px",
                  "&:focus": {
                    borderColor: "#059669",
                    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)",
                  },
                },
              }}
              {...form.getInputProps("name")}
            />
          </Card>

          <Card
            shadow="md"
            radius="lg"
            p="xl"
            style={{
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(5px)",
              border: "2px solid rgba(245, 158, 11, 0.1)",
            }}
          >
            <Group gap="sm" mb="lg">
              <ThemeIcon color="orange" size={32} radius="xl">
                <Upload size={18} />
              </ThemeIcon>
              <Text fw={700} size="lg" c="dark.8">
                Extension Logo (Optional)
              </Text>
            </Group>
            <Group align="flex-start" gap="lg">
              <FileInput
                placeholder="Select PNG, JPG, JPEG, or SVG image"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                leftSection={<Upload size={16} />}
                onChange={handleFileChange}
                radius="md"
                size="md"
                style={{ flex: 1 }}
                styles={{
                  input: {
                    borderColor: "#f59e0b",
                    borderWidth: "2px",
                    "&:focus": {
                      borderColor: "#d97706",
                      boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.1)",
                    },
                  },
                }}
              />
              {previewUrl && (
                <Box
                  style={{
                    padding: "8px",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                  }}
                >
                  <Avatar
                    src={previewUrl}
                    size="xl"
                    radius="md"
                    alt="Extension logo preview"
                  />
                </Box>
              )}
            </Group>
            <Text size="sm" mt="md" c="dimmed">
              📁 Maximum file size: 5MB. Supported formats: PNG, JPG, JPEG, SVG
            </Text>
          </Card>

          <Card
            shadow="md"
            radius="lg"
            p="xl"
            style={{
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(5px)",
              border: "2px solid rgba(59, 130, 246, 0.1)",
            }}
          >
            <Group gap="sm" mb="lg">
              <ThemeIcon color="blue" size={32} radius="xl">
                <Globe size={18} />
              </ThemeIcon>
              <Text fw={700} size="lg" c="dark.8">
                Chrome Web Store
              </Text>
            </Group>
            <TextInput
              label="Store URL"
              placeholder="https://chromewebstore.google.com/detail/..."
              required
              radius="md"
              size="md"
              styles={{
                label: {
                  color: "#374151",
                  fontWeight: 600,
                  fontSize: "14px",
                  marginBottom: "8px",
                },
                input: {
                  borderColor: "#3b82f6",
                  borderWidth: "2px",
                  fontSize: "14px",
                  "&:focus": {
                    borderColor: "#2563eb",
                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                  },
                },
              }}
              {...form.getInputProps("chrome_store_url")}
            />
          </Card>

          <Card
            shadow="md"
            radius="lg"
            p="xl"
            style={{
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(5px)",
              border: "2px solid rgba(139, 92, 246, 0.1)",
            }}
          >
            <Group gap="sm" mb="lg">
              <ThemeIcon color="violet" size={32} radius="xl">
                <Tag size={18} />
              </ThemeIcon>
              <Text fw={700} size="lg" c="dark.8">
                Categories & Tags
              </Text>
            </Group>
            <MultiSelect
              label="Categories"
              placeholder="Select categories"
              data={CATEGORIES}
              radius="md"
              size="md"
              withinPortal={true}
              zIndex={1500}
              dropdownPosition="bottom"
              maxDropdownHeight={200}
              styles={{
                label: {
                  color: "#374151",
                  fontWeight: 600,
                  fontSize: "14px",
                  marginBottom: "8px",
                },
                input: {
                  borderColor: "#8b5cf6",
                  borderWidth: "2px",
                  "&:focus": {
                    borderColor: "#7c3aed",
                    boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)",
                  },
                },
                pill: {
                  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                  color: "white",
                  fontWeight: 600,
                },
                dropdown: {
                  backgroundColor: "white",
                  border: "2px solid #8b5cf6",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  zIndex: 1500,
                },
                option: {
                  color: "#374151",
                  "&[data-selected]": {
                    backgroundColor: "#8b5cf6",
                    color: "white",
                  },
                  "&[data-hovered]": {
                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                  },
                },
              }}
              {...form.getInputProps("category")}
            />
          </Card>

          <Card
            shadow="md"
            radius="lg"
            p="xl"
            style={{
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(5px)",
              border: "2px solid rgba(6, 182, 212, 0.1)",
            }}
          >
            <Group gap="sm" mb="lg">
              <ThemeIcon color="cyan" size={32} radius="xl">
                <FileText size={18} />
              </ThemeIcon>
              <Text fw={700} size="lg" c="dark.8">
                Description & Details
              </Text>
            </Group>
            <Textarea
              label="Description"
              placeholder="Brief description of your extension..."
              rows={3}
              radius="md"
              size="md"
              styles={{
                label: {
                  color: "#374151",
                  fontWeight: 600,
                  fontSize: "14px",
                  marginBottom: "8px",
                },
                input: {
                  borderColor: "#06b6d4",
                  borderWidth: "2px",
                  "&:focus": {
                    borderColor: "#0891b2",
                    boxShadow: "0 0 0 3px rgba(6, 182, 212, 0.1)",
                  },
                },
              }}
              {...form.getInputProps("description")}
            />
          </Card>

          <Card
            shadow="md"
            radius="lg"
            p="xl"
            style={{
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(5px)",
              border: "2px solid rgba(16, 185, 129, 0.1)",
            }}
          >
            <Group gap="sm" mb="lg">
              <ThemeIcon color="teal" size={32} radius="xl">
                <Shield size={18} />
              </ThemeIcon>
              <Text fw={700} size="lg" c="dark.8">
                Access & Pricing
              </Text>
            </Group>
            <Select
              label="Access Type"
              data={ACCESS_TYPES}
              radius="md"
              size="md"
              withinPortal={true}
              zIndex={1500}
              dropdownPosition="bottom"
              maxDropdownHeight={200}
              styles={{
                label: {
                  color: "#374151",
                  fontWeight: 600,
                  fontSize: "14px",
                  marginBottom: "8px",
                },
                input: {
                  borderColor: "#10b981",
                  borderWidth: "2px",
                  "&:focus": {
                    borderColor: "#059669",
                    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)",
                  },
                },
                dropdown: {
                  backgroundColor: "white",
                  border: "2px solid #10b981",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  zIndex: 1500,
                },
                option: {
                  color: "#374151",
                  "&[data-selected]": {
                    backgroundColor: "#10b981",
                    color: "white",
                  },
                  "&[data-hovered]": {
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                  },
                },
              }}
              {...form.getInputProps("access_type")}
            />
          </Card>

          {form.values.access_type === "promo_code" && (
            <Card
              shadow="md"
              radius="lg"
              p="xl"
              style={{
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(5px)",
                border: "2px solid rgba(245, 101, 101, 0.1)",
              }}
            >
              <Group gap="sm" mb="lg">
                <ThemeIcon color="red" size={32} radius="xl">
                  <Gift size={18} />
                </ThemeIcon>
                <Text fw={700} size="lg" c="dark.8">
                  🎁 Promo Code Details
                </Text>
              </Group>
              <Stack gap="md">
                <TextInput
                  label="Promo Code"
                  placeholder="REVIEW2024"
                  radius="md"
                  size="md"
                  styles={{
                    label: {
                      color: "#374151",
                      fontWeight: 600,
                      fontSize: "14px",
                      marginBottom: "8px",
                    },
                    input: {
                      borderColor: "#f56565",
                      borderWidth: "2px",
                      "&:focus": {
                        borderColor: "#e53e3e",
                        boxShadow: "0 0 0 3px rgba(245, 101, 101, 0.1)",
                      },
                    },
                  }}
                  {...form.getInputProps("promo_code")}
                />
                <TextInput
                  label="Promo Code Expires At"
                  type="date"
                  radius="md"
                  size="md"
                  styles={{
                    label: {
                      color: "#374151",
                      fontWeight: 600,
                      fontSize: "14px",
                      marginBottom: "8px",
                    },
                    input: {
                      borderColor: "#f56565",
                      borderWidth: "2px",
                      "&:focus": {
                        borderColor: "#e53e3e",
                        boxShadow: "0 0 0 3px rgba(245, 101, 101, 0.1)",
                      },
                    },
                  }}
                  {...form.getInputProps("promo_code_expires_at")}
                />
              </Stack>
            </Card>
          )}

          {selectedFile && (
            <Alert
              icon={<AlertCircle size={16} />}
              color="blue"
              title="🚀 Image Upload Ready"
              radius="lg"
              styles={{
                root: {
                  background: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(5px)",
                  border: "2px solid rgba(59, 130, 246, 0.2)",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.1)",
                },
                title: { color: "#3b82f6", fontWeight: 700 },
                body: { color: "#374151" },
              }}
            >
              ✨ Your logo will be uploaded when you save the extension.
            </Alert>
          )}

          <Group justify="flex-end" gap="md" pt="lg">
            <Button
              variant="light"
              onClick={handleClose}
              radius="md"
              size="lg"
              styles={{
                root: {
                  background: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(5px)",
                  border: "2px solid rgba(107, 114, 128, 0.2)",
                  color: "#6b7280",
                  fontWeight: 600,
                  fontSize: "14px",
                  "&:hover": {
                    background: "rgba(255,255,255,0.9)",
                    border: "2px solid rgba(107, 114, 128, 0.3)",
                    transform: "translateY(-1px)",
                  },
                },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={uploading}
              radius="md"
              size="lg"
              styles={{
                root: {
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "14px",
                  boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #059669, #047857)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                  },
                  "&:disabled": {
                    background: "linear-gradient(135deg, #9ca3af, #6b7280)",
                  },
                },
              }}
            >
              {initialExtensionData?.id
                ? "✨ Update Extension"
                : "🚀 Add Extension"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
