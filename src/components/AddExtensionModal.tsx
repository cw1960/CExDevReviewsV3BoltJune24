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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { Upload, AlertCircle } from "lucide-react";
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
      title={initialExtensionData?.id ? "Edit Extension" : "Add Extension"}
      size="lg"
      radius="lg"
      shadow="xl"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <TextInput
            label="Extension Name"
            placeholder="My Awesome Extension"
            required
            radius="md"
            {...form.getInputProps("name")}
          />

          <div>
            <Text size="sm" fw={600} mb="xs">
              Extension Logo (Optional)
            </Text>
            <Group align="flex-start" gap="lg">
              <FileInput
                placeholder="Select PNG, JPG, JPEG, or SVG image"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                leftSection={<Upload size={16} />}
                onChange={handleFileChange}
                radius="md"
                style={{ flex: 1 }}
              />
              {previewUrl && (
                <Avatar
                  src={previewUrl}
                  size="xl"
                  radius="md"
                  alt="Extension logo preview"
                />
              )}
            </Group>
            <Text size="xs" c="dimmed" mt="sm">
              Maximum file size: 5MB. Supported formats: PNG, JPG, JPEG, SVG
            </Text>
          </div>

          <TextInput
            label="Chrome Web Store URL"
            placeholder="https://chromewebstore.google.com/detail/..."
            required
            {...form.getInputProps("chrome_store_url")}
            radius="md"
          />

          <MultiSelect
            label="Categories"
            placeholder="Select categories"
            data={CATEGORIES}
            {...form.getInputProps("category")}
            radius="md"
          />

          <Textarea
            label="Description"
            placeholder="Brief description of your extension..."
            rows={3}
            {...form.getInputProps("description")}
            radius="md"
          />

          <Select
            label="Access Type"
            data={ACCESS_TYPES}
            {...form.getInputProps("access_type")}
            radius="md"
          />

          {form.values.access_type === "promo_code" && (
            <Stack gap="md">
              <TextInput
                label="Promo Code"
                placeholder="REVIEW2024"
                {...form.getInputProps("promo_code")}
                radius="md"
              />
              <TextInput
                label="Promo Code Expires At"
                type="date"
                {...form.getInputProps("promo_code_expires_at")}
                radius="md"
              />
            </Stack>
          )}

          {selectedFile && (
            <Alert
              icon={<AlertCircle size={16} />}
              color="blue"
              title="Image Upload"
              radius="md"
            >
              Your logo will be uploaded when you save the extension.
            </Alert>
          )}

          <Group justify="flex-end" gap="md" pt="md">
            <Button variant="light" onClick={handleClose} radius="md">
              Cancel
            </Button>
            <Button type="submit" loading={uploading} radius="md">
              {initialExtensionData?.id ? "Update" : "Add"} Extension
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
