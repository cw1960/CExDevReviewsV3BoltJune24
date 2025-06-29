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
  Paper,
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
  Gift
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
          <div style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={20} color="white" />
          </div>
          <Text fw={600} size="lg" style={{ color: '#10b981' }}>
            {initialExtensionData?.id ? "✨ Edit Extension" : "🚀 Add Extension"}
          </Text>
        </Group>
      }
      size="lg"
      radius="lg"
      shadow="xl"
      centered={true}
      withinPortal={true}
      closeOnClickOutside={true}
      closeOnEscape={true}
      zIndex={1000}
      overlayProps={{
        backgroundOpacity: 1.0,
        blur: 0,
        color: '#000'
      }}
      styles={{
        overlay: {
          backgroundColor: 'rgb(0, 0, 0)',
          backdropFilter: 'none'
        },
        inner: {
          padding: '20px'
        },
        header: { 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))',
          borderBottom: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px 12px 0 0',
          backgroundColor: '#1f2937'
        },
        content: { 
          background: '#1f2937',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        },
        body: {
          padding: '20px',
          backgroundColor: '#1f2937'
        }
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Paper
            p="md"
            radius="md"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}
          >
            <Group gap="sm" mb="xs">
              <Star size={16} style={{ color: '#10b981' }} />
              <Text fw={600} size="sm" style={{ color: '#10b981' }}>Extension Details</Text>
            </Group>
            <TextInput
              label="Extension Name"
              placeholder="My Awesome Extension"
              required
              radius="md"
              styles={{
                label: { color: '#374151', fontWeight: 600 },
                input: {
                  borderColor: '#10b981',
                  '&:focus': { borderColor: '#059669', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' }
                }
              }}
              {...form.getInputProps("name")}
            />
          </Paper>

          <Paper
            p="md"
            radius="md"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(249, 115, 22, 0.08))',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}
          >
            <Group gap="sm" mb="xs">
              <Upload size={16} style={{ color: '#f59e0b' }} />
              <Text fw={600} size="sm" style={{ color: '#f59e0b' }}>Extension Logo (Optional)</Text>
            </Group>
            <Group align="flex-start" gap="lg">
              <FileInput
                placeholder="Select PNG, JPG, JPEG, or SVG image"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                leftSection={<Upload size={16} />}
                onChange={handleFileChange}
                radius="md"
                style={{ flex: 1 }}
                styles={{
                  input: {
                    borderColor: '#f59e0b',
                    '&:focus': { borderColor: '#d97706', boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.2)' }
                  }
                }}
              />
              {previewUrl && (
                <div style={{
                  padding: '4px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  borderRadius: '12px'
                }}>
                  <Avatar
                    src={previewUrl}
                    size="xl"
                    radius="md"
                    alt="Extension logo preview"
                  />
                </div>
              )}
            </Group>
            <Text size="xs" mt="sm" style={{ color: "#6b7280" }}>
              📁 Maximum file size: 5MB. Supported formats: PNG, JPG, JPEG, SVG
            </Text>
          </Paper>

          <Paper
            p="md"
            radius="md"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(124, 58, 237, 0.08))',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}
          >
            <Group gap="sm" mb="xs">
              <Globe size={16} style={{ color: '#3b82f6' }} />
              <Text fw={600} size="sm" style={{ color: '#3b82f6' }}>Chrome Web Store</Text>
            </Group>
            <TextInput
              label="Store URL"
              placeholder="https://chromewebstore.google.com/detail/..."
              required
              {...form.getInputProps("chrome_store_url")}
              radius="md"
              styles={{
                label: { color: '#374151', fontWeight: 600 },
                input: {
                  borderColor: '#3b82f6',
                  '&:focus': { borderColor: '#2563eb', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)' }
                }
              }}
            />
          </Paper>

          <Paper
            p="md"
            radius="md"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(168, 85, 247, 0.08))',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}
          >
            <Group gap="sm" mb="xs">
              <Tag size={16} style={{ color: '#8b5cf6' }} />
              <Text fw={600} size="sm" style={{ color: '#8b5cf6' }}>Categories & Tags</Text>
            </Group>
            <MultiSelect
              label="Categories"
              placeholder="Select categories"
              data={CATEGORIES}
              {...form.getInputProps("category")}
              radius="md"
              styles={{
                label: { color: '#374151', fontWeight: 600 },
                input: {
                  borderColor: '#8b5cf6',
                  '&:focus': { borderColor: '#7c3aed', boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)' }
                },
                pill: {
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  fontWeight: 600
                }
              }}
            />
          </Paper>

          <Paper
            p="md"
            radius="md"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(14, 165, 233, 0.08))',
              border: '1px solid rgba(6, 182, 212, 0.2)'
            }}
          >
            <Group gap="sm" mb="xs">
              <FileText size={16} style={{ color: '#06b6d4' }} />
              <Text fw={600} size="sm" style={{ color: '#06b6d4' }}>Description & Details</Text>
            </Group>
            <Textarea
              label="Description"
              placeholder="Brief description of your extension..."
              rows={3}
              {...form.getInputProps("description")}
              radius="md"
              styles={{
                label: { color: '#374151', fontWeight: 600 },
                input: {
                  borderColor: '#06b6d4',
                  '&:focus': { borderColor: '#0891b2', boxShadow: '0 0 0 2px rgba(6, 182, 212, 0.2)' }
                }
              }}
            />
          </Paper>

          <Paper
            p="md"
            radius="md"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}
          >
            <Group gap="sm" mb="xs">
              <Shield size={16} style={{ color: '#10b981' }} />
              <Text fw={600} size="sm" style={{ color: '#10b981' }}>Access & Pricing</Text>
            </Group>
            <Select
              label="Access Type"
              data={ACCESS_TYPES}
              {...form.getInputProps("access_type")}
              radius="md"
              styles={{
                label: { color: '#374151', fontWeight: 600 },
                input: {
                  borderColor: '#10b981',
                  '&:focus': { borderColor: '#059669', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)' }
                }
              }}
            />
          </Paper>

          {form.values.access_type === "promo_code" && (
            <Paper
              p="md"
              radius="md"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 101, 101, 0.08), rgba(239, 68, 68, 0.08))',
                border: '1px solid rgba(245, 101, 101, 0.2)'
              }}
            >
              <Group gap="sm" mb="xs">
                <Gift size={16} style={{ color: '#f56565' }} />
                <Text fw={600} size="sm" style={{ color: '#f56565' }}>🎁 Promo Code Details</Text>
              </Group>
              <Stack gap="md">
                <TextInput
                  label="Promo Code"
                  placeholder="REVIEW2024"
                  {...form.getInputProps("promo_code")}
                  radius="md"
                  styles={{
                    label: { color: '#374151', fontWeight: 600 },
                    input: {
                      borderColor: '#f56565',
                      '&:focus': { borderColor: '#e53e3e', boxShadow: '0 0 0 2px rgba(245, 101, 101, 0.2)' }
                    }
                  }}
                />
                <TextInput
                  label="Promo Code Expires At"
                  type="date"
                  {...form.getInputProps("promo_code_expires_at")}
                  radius="md"
                  styles={{
                    label: { color: '#374151', fontWeight: 600 },
                    input: {
                      borderColor: '#f56565',
                      '&:focus': { borderColor: '#e53e3e', boxShadow: '0 0 0 2px rgba(245, 101, 101, 0.2)' }
                    }
                  }}
                />
              </Stack>
            </Paper>
          )}

          {selectedFile && (
            <Alert
              icon={<AlertCircle size={16} />}
              color="blue"
              title="🚀 Image Upload Ready"
              radius="md"
              styles={{
                root: {
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))',
                  border: '2px solid rgba(59, 130, 246, 0.3)'
                },
                title: { color: '#3b82f6', fontWeight: 700 },
                body: { color: '#374151' }
              }}
            >
              ✨ Your logo will be uploaded when you save the extension.
            </Alert>
          )}

          <Group justify="flex-end" gap="md" pt="md">
            <Button 
              variant="light" 
              onClick={handleClose} 
              radius="md"
              size="md"
              styles={{
                root: {
                  background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(75, 85, 99, 0.1))',
                  border: '2px solid rgba(107, 114, 128, 0.3)',
                  color: '#6b7280',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2))',
                    border: '2px solid rgba(107, 114, 128, 0.5)'
                  }
                }
              }}
            >
              ❌ Cancel
            </Button>
            <Button 
              type="submit" 
              loading={uploading} 
              radius="md"
              size="md"
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '14px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #9ca3af, #6b7280)'
                  }
                }
              }}
            >
              {initialExtensionData?.id ? "✨ Update Extension" : "🚀 Add Extension"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
