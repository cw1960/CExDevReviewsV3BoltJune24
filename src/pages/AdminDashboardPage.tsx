import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Table,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  Tabs,
  Alert,
  Progress,
  Avatar,
  Divider,
  Drawer,
  ScrollArea,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  Users,
  Package,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Clock,
  Shield,
  CreditCard,
  Mail,
  Settings,
  Edit,
  Bug,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { PlatformStatsPanel } from "../components/PlatformStatsPanel";
import type { Database } from "../types/database";

type Extension = Database["public"]["Tables"]["extensions"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];
type ReviewAssignment =
  Database["public"]["Tables"]["review_assignments"]["Row"];
type CreditTransaction =
  Database["public"]["Tables"]["credit_transactions"]["Row"];
type EmailLog = Database["public"]["Tables"]["email_logs"]["Row"];

interface UserMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UserMessageWithRecipient extends UserMessage {
  recipient: User;
}

interface ExtensionWithOwner extends Extension {
  owner: User;
}

interface AssignmentWithDetails extends ReviewAssignment {
  extension: Extension;
  reviewer: User;
}

export function AdminDashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // DEBUGGING: Log component initialization
  console.log("🚀 AdminDashboardPage component initialized");
  console.log("👤 Profile from useAuth:", profile);
  console.log("🔐 Profile role:", profile?.role);
  console.log("📍 Current location:", window.location.pathname);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>("overview");
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [statsDrawerOpened, setStatsDrawerOpened] = useState(false);
  const [reportModalOpened, setReportModalOpened] = useState(false);
  const [selectedReport, setSelectedReport] = useState<EmailLog | null>(null);
  const [updatingReportStatus, setUpdatingReportStatus] = useState(false);

  // Sent messages state
  const [sentMessages, setSentMessages] = useState<UserMessageWithRecipient[]>(
    [],
  );
  const [sentMessagesLoading, setSentMessagesLoading] = useState(false);
  const [messageModalOpened, setMessageModalOpened] = useState(false);
  const [selectedMessage, setSelectedMessage] =
    useState<UserMessageWithRecipient | null>(null);

  // Queue modal state
  const [queueModalOpened, setQueueModalOpened] = useState(false);

  // Active reviews modal state
  const [activeReviewsModalOpened, setActiveReviewsModalOpened] =
    useState(false);

  // Search states for each tab
  const [extensionsSearch, setExtensionsSearch] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [creditsSearch, setCreditsSearch] = useState("");
  const [problemsSearch, setProblemsSearch] = useState("");
  const [messagesSearch, setMessagesSearch] = useState("");

  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExtensions: 0,
    pendingVerifications: 0,
    activeReviews: 0,
    totalCreditsIssued: 0,
    avgQueueTime: "0 days",
  });

  const [extensions, setExtensions] = useState<ExtensionWithOwner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [problemReports, setProblemReports] = useState<EmailLog[]>([]);

  useEffect(() => {
    if (profile?.role === "admin") {
      fetchAdminData();
      fetchProblemReports();
      fetchSentMessages();
    }
  }, [profile?.role]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        "fetch-admin-dashboard-data",
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to fetch admin data");
      }

      const {
        users: usersData,
        extensions: extensionsData,
        assignments: assignmentsData,
        transactions: transactionsData,
        stats: statsData,
      } = data.data;

      // Set the data from Edge Function response
      setUsers(usersData);
      setExtensions(extensionsData as ExtensionWithOwner[]);
      setAssignments(assignmentsData as AssignmentWithDetails[]);
      setTransactions(transactionsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load admin data. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemReports = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "fetch-problem-reports",
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to fetch problem reports");
      }

      setProblemReports(data.data);
    } catch (error) {
      console.error("Error fetching problem reports:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load problem reports. Please try again.",
        color: "red",
      });
    }
  };

  const fetchSentMessages = async () => {
    try {
      setSentMessagesLoading(true);
      console.log("🔄 Starting fetchSentMessages...");

      // Get current session to ensure authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("📱 Session check:", {
        hasSession: !!session,
        userId: session?.user?.id,
      });

      if (!session) {
        throw new Error("No authenticated session");
      }

      console.log("🔐 About to call fetch-admin-sent-messages with session");

      const { data, error } = await supabase.functions.invoke(
        "fetch-admin-sent-messages",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      console.log("📡 Edge function response:", { data, error });

      if (error) {
        console.error("❌ Edge function error details:", error);
        throw error;
      }

      if (!data?.success) {
        console.error("❌ Function returned error:", data?.error);
        throw new Error(data?.error || "Failed to fetch sent messages");
      }

      console.log("✅ Successfully fetched sent messages:", data.data);
      setSentMessages(data.data);
    } catch (error) {
      console.error("❌ Error fetching sent messages:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load sent messages. Please try again.",
        color: "red",
      });
    } finally {
      setSentMessagesLoading(false);
    }
  };

  const handleReportClick = (report: EmailLog) => {
    setSelectedReport(report);
    setReportModalOpened(true);
  };

  const handleMessageClick = (message: UserMessageWithRecipient) => {
    setSelectedMessage(message);
    setMessageModalOpened(true);
  };

  const handleQueueCardClick = () => {
    setQueueModalOpened(true);
  };

  const handleActiveReviewsCardClick = () => {
    setActiveReviewsModalOpened(true);
  };

  const handleCancelAssignment = async (
    assignmentId: string,
    assignmentNumber: string,
    extensionName: string,
    reviewerName: string,
  ) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to cancel Assignment #${assignmentNumber}?\n\n` +
        `Extension: ${extensionName}\n` +
        `Reviewer: ${reviewerName}\n\n` +
        `This will:\n` +
        `• Cancel the assignment and remove it from the reviewer\n` +
        `• Put the extension back at the front of the review queue\n` +
        `• The reviewer will NOT receive credit for this review\n\n` +
        `This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-cancel-assignment",
        {
          body: {
            assignment_id: assignmentId,
            admin_key: "chrome_ex_dev_admin_2025",
            reason: "Admin cancelled due to reviewer delay",
          },
        },
      );

      if (error) {
        console.error("Error cancelling assignment:", error);
        notifications.show({
          title: "Error",
          message: "Failed to cancel assignment. Please try again.",
          color: "red",
        });
        return;
      }

      if (!data.success) {
        console.error("Assignment cancellation failed:", data.error);
        notifications.show({
          title: "Error",
          message: data.error || "Failed to cancel assignment.",
          color: "red",
        });
        return;
      }

      notifications.show({
        title: "Assignment Cancelled",
        message: data.message,
        color: "green",
      });

      // Refresh the data to show updated state
      fetchAdminData();
    } catch (error) {
      console.error("Error cancelling assignment:", error);
      notifications.show({
        title: "Error",
        message: "Failed to cancel assignment. Please try again.",
        color: "red",
      });
    }
  };

  const handleRemoveFromQueue = async (
    extensionId: string,
    extensionName: string,
  ) => {
    if (
      !confirm(
        `Are you sure you want to remove "${extensionName}" from the queue?\n\nThis will:\n- Remove the extension from queue\n- Refund the user's credit\n- Reset their monthly exchange count (if free tier)`,
      )
    ) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-remove-from-queue",
        {
          body: {
            extension_id: extensionId,
            admin_key: "chrome_ex_dev_admin_2025",
          },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to remove extension from queue");
      }

      notifications.show({
        title: "Success",
        message: `Extension "${extensionName}" removed from queue successfully`,
        color: "green",
      });
      // Refresh the data
      fetchAdminData();
    } catch (error) {
      console.error("Error removing extension from queue:", error);
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove extension from queue",
        color: "red",
      });
    }
  };

  const updateReportStatus = async (
    reportId: string,
    newStatus: "pending" | "resolved",
  ) => {
    try {
      setUpdatingReportStatus(true);

      const { data, error } = await supabase.functions.invoke(
        "update-problem-report-status",
        {
          body: { report_id: reportId, status: newStatus },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to update report status");
      }

      // Update the selected report status locally
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }

      // Update the report in the main list
      setProblemReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? { ...report, status: newStatus } : report,
        ),
      );

      notifications.show({
        title: "Status Updated",
        message: `Problem report marked as ${newStatus}`,
        color: "green",
      });
    } catch (error) {
      console.error("Error updating report status:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update report status. Please try again.",
        color: "red",
      });
    } finally {
      setUpdatingReportStatus(false);
    }
  };

  const parseReportBody = (body: string) => {
    try {
      // The body is stored as JSON string with structured problem report data
      const reportData = JSON.parse(body);

      return {
        assignmentId: reportData.assignment_id || "",
        extensionId: reportData.extension_id || "",
        extensionName: reportData.extension_name || "",
        reporterId: reportData.reporter_id || "",
        reporterEmail: reportData.reporter_email || "",
        issueType: reportData.issue_type || "",
        description: reportData.description || "",
        assignmentCancelled: reportData.cancel_assignment || false,
        timestamp: reportData.timestamp || "",
        severity: reportData.severity || "medium",
        rawData: reportData,
      };
    } catch (error) {
      console.error("Error parsing report body:", error);
      // Fallback for non-JSON content
      return {
        assignmentId: "",
        extensionId: "",
        extensionName: "",
        reporterId: "",
        reporterEmail: "",
        issueType: "",
        description: body.substring(0, 200) + "...",
        assignmentCancelled: false,
        timestamp: "",
        severity: "unknown",
        rawData: body,
      };
    }
  };

  const navigateToUserProfile = (userId: string) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleTriggerAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "assign-reviews",
        {
          body: { max_assignments: 10 },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to trigger assignments");
      }

      notifications.show({
        title: "Assignments Triggered",
        message: `Successfully created ${data.assignments_created} new review assignments`,
        color: "green",
      });

      // Refresh the admin data to show updated stats
      fetchAdminData();
    } catch (error: any) {
      console.error("Assignment trigger error:", error);
      notifications.show({
        title: "Error",
        message: error.message || "Failed to trigger assignments",
        color: "red",
      });
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const getStatusColor = (status: Extension["status"]) => {
    switch (status) {
      case "verified":
        return "green";
      case "queued":
        return "blue";
      case "assigned":
        return "purple";
      case "reviewed":
        return "orange";
      case "rejected":
        return "red";
      case "library":
        return "gray";
      default:
        return "gray";
    }
  };

  const getRoleColor = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return "red";
      case "moderator":
        return "blue";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status: Extension["status"]) => {
    switch (status) {
      case "verified":
      case "library":
        return "In my Library";
      case "queued":
        return "In Review Queue";
      case "assigned":
        return "Selected for Review";
      case "reviewed":
        return "Review Submitted";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  // Helper function to find the reviewer for an extension
  const getExtensionReviewer = (extensionId: string) => {
    const assignment = assignments.find(
      (assignment) =>
        assignment.extension.id === extensionId &&
        assignment.status === "assigned",
    );
    return assignment?.reviewer;
  };

  // Filter functions for search functionality
  const getFilteredExtensions = () => {
    if (!extensionsSearch.trim()) return extensions;
    const search = extensionsSearch.toLowerCase();
    return extensions.filter(
      (extension) =>
        extension.name?.toLowerCase().includes(search) ||
        extension.description?.toLowerCase().includes(search) ||
        extension.owner?.name?.toLowerCase().includes(search) ||
        extension.owner?.email?.toLowerCase().includes(search) ||
        extension.status?.toLowerCase().includes(search),
    );
  };

  const getFilteredUsers = () => {
    if (!usersSearch.trim()) return users;
    const search = usersSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.role?.toLowerCase().includes(search) ||
        user.subscription_status?.toLowerCase().includes(search),
    );
  };

  const getFilteredAssignments = () => {
    if (!reviewsSearch.trim()) return assignments;
    const search = reviewsSearch.toLowerCase();
    return assignments.filter(
      (assignment) =>
        assignment.assignment_number?.toString().includes(search) ||
        assignment.extension?.name?.toLowerCase().includes(search) ||
        assignment.reviewer?.name?.toLowerCase().includes(search) ||
        assignment.reviewer?.email?.toLowerCase().includes(search) ||
        assignment.status?.toLowerCase().includes(search),
    );
  };

  const getFilteredTransactions = () => {
    if (!creditsSearch.trim()) return transactions;
    const search = creditsSearch.toLowerCase();
    return transactions.filter(
      (transaction) =>
        transaction.user_id?.toLowerCase().includes(search) ||
        transaction.type?.toLowerCase().includes(search) ||
        transaction.description?.toLowerCase().includes(search) ||
        transaction.amount?.toString().includes(search),
    );
  };

  const getFilteredProblemReports = () => {
    if (!problemsSearch.trim()) return problemReports;
    const search = problemsSearch.toLowerCase();
    return problemReports.filter(
      (report) =>
        report.subject?.toLowerCase().includes(search) ||
        report.body?.toLowerCase().includes(search) ||
        report.to_email?.toLowerCase().includes(search) ||
        report.status?.toLowerCase().includes(search) ||
        report.error_message?.toLowerCase().includes(search),
    );
  };

  const getFilteredSentMessages = () => {
    if (!messagesSearch.trim()) return sentMessages;
    const search = messagesSearch.toLowerCase();
    return sentMessages.filter(
      (message) =>
        message.subject?.toLowerCase().includes(search) ||
        message.message?.toLowerCase().includes(search) ||
        message.recipient?.name?.toLowerCase().includes(search) ||
        message.recipient?.email?.toLowerCase().includes(search) ||
        message.priority?.toLowerCase().includes(search),
    );
  };

  // Get active reviews sorted by due date (soonest first)
  const getActiveReviewsSorted = () => {
    return assignments
      .filter((assignment) => assignment.status === "assigned")
      .sort((a, b) => {
        const dateA = new Date(a.due_at).getTime();
        const dateB = new Date(b.due_at).getTime();
        return dateA - dateB; // Ascending order (soonest first)
      });
  };

  // CONTROLLED ADMIN DASHBOARD COLOR FORCING - Fixed infinite loop
  const [colorForceExecuted, setColorForceExecuted] = useState(false);

  useEffect(() => {
    // Only run once when stats are loaded and not loading
    if (loading || colorForceExecuted || stats.totalUsers === 0) {
      return;
    }

    const forceAdminColors = () => {
      console.log("🎨 CONTROLLED COLOR FORCING - Running once");

      // APPROACH 1: Target all cards by content
      const allCards = document.querySelectorAll(
        ".mantine-Card-root, .mantine-Paper-root",
      );
      console.log("Found all admin cards:", allCards.length);

      allCards.forEach((card, index) => {
        if (card instanceof HTMLElement) {
          const cardText = card.textContent || "";

          // Find all potential number displays - be very aggressive
          const numberElements = card.querySelectorAll(
            'div[class*="xl"], div[class*="fw-700"], .mantine-Text-root, h1, h2, h3, h4, h5, h6, span, div',
          );
          const iconElements = card.querySelectorAll("svg");

          // Force colors based on card content
          if (
            cardText.includes("Total Users") ||
            cardText.includes("Registered developers")
          ) {
            numberElements.forEach((el) => {
              if (
                el instanceof HTMLElement &&
                /^\d+$/.test(el.textContent?.trim() || "")
              ) {
                el.style.color = "#2563eb";
                el.style.setProperty("color", "#2563eb", "important");
                (el.style as any).webkitTextFillColor = "#2563eb";
                el.style.setProperty(
                  "-webkit-text-fill-color",
                  "#2563eb",
                  "important",
                );
                el.style.fontSize = el.style.fontSize || "2rem";
              }
            });
            iconElements.forEach((el) => {
              if (el instanceof SVGElement) {
                el.style.color = "#2563eb";
                el.style.setProperty("color", "#2563eb", "important");
              }
            });
          }

          if (
            cardText.includes("Total Extensions") ||
            cardText.includes("In the system")
          ) {
            numberElements.forEach((el) => {
              if (
                el instanceof HTMLElement &&
                /^\d+$/.test(el.textContent?.trim() || "")
              ) {
                el.style.color = "#059669";
                el.style.setProperty("color", "#059669", "important");
                (el.style as any).webkitTextFillColor = "#059669";
                el.style.setProperty(
                  "-webkit-text-fill-color",
                  "#059669",
                  "important",
                );
              }
            });
            iconElements.forEach((el) => {
              if (el instanceof SVGElement) {
                el.style.color = "#059669";
                el.style.setProperty("color", "#059669", "important");
              }
            });
          }

          if (
            cardText.includes("Extensions in Queue") ||
            cardText.includes("Queued for review")
          ) {
            numberElements.forEach((el) => {
              if (
                el instanceof HTMLElement &&
                /^\d+$/.test(el.textContent?.trim() || "")
              ) {
                el.style.color = "#ea580c";
                el.style.setProperty("color", "#ea580c", "important");
                (el.style as any).webkitTextFillColor = "#ea580c";
                el.style.setProperty(
                  "-webkit-text-fill-color",
                  "#ea580c",
                  "important",
                );
              }
            });
            iconElements.forEach((el) => {
              if (el instanceof SVGElement) {
                el.style.color = "#ea580c";
                el.style.setProperty("color", "#ea580c", "important");
              }
            });
          }

          if (
            cardText.includes("Active Reviews") ||
            cardText.includes("In progress")
          ) {
            numberElements.forEach((el) => {
              if (
                el instanceof HTMLElement &&
                /^\d+$/.test(el.textContent?.trim() || "")
              ) {
                el.style.color = "#8b5cf6";
                el.style.setProperty("color", "#8b5cf6", "important");
                (el.style as any).webkitTextFillColor = "#8b5cf6";
                el.style.setProperty(
                  "-webkit-text-fill-color",
                  "#8b5cf6",
                  "important",
                );
              }
            });
            iconElements.forEach((el) => {
              if (el instanceof SVGElement) {
                el.style.color = "#8b5cf6";
                el.style.setProperty("color", "#8b5cf6", "important");
              }
            });
          }

          if (
            cardText.includes("Credits Issued") ||
            cardText.includes("Total earned by users")
          ) {
            numberElements.forEach((el) => {
              if (
                el instanceof HTMLElement &&
                /^\d+$/.test(el.textContent?.trim() || "")
              ) {
                el.style.color = "#fbbf24";
                el.style.setProperty("color", "#fbbf24", "important");
                (el.style as any).webkitTextFillColor = "#fbbf24";
                el.style.setProperty(
                  "-webkit-text-fill-color",
                  "#fbbf24",
                  "important",
                );
              }
            });
            iconElements.forEach((el) => {
              if (el instanceof SVGElement) {
                el.style.color = "#fbbf24";
                el.style.setProperty("color", "#fbbf24", "important");
              }
            });
          }

          if (
            cardText.includes("Avg Queue Time") ||
            cardText.includes("From submission to assignment")
          ) {
            numberElements.forEach((el) => {
              if (
                el instanceof HTMLElement &&
                (el.textContent?.includes("days") ||
                  el.textContent?.includes("0.3"))
              ) {
                el.style.color = "#06b6d4";
                el.style.setProperty("color", "#06b6d4", "important");
                (el.style as any).webkitTextFillColor = "#06b6d4";
                el.style.setProperty(
                  "-webkit-text-fill-color",
                  "#06b6d4",
                  "important",
                );
              }
            });
            iconElements.forEach((el) => {
              if (el instanceof SVGElement) {
                el.style.color = "#06b6d4";
                el.style.setProperty("color", "#06b6d4", "important");
              }
            });
          }
        }
      });

      // APPROACH 2: BRUTE FORCE ALL LARGE NUMBERS IN ADMIN DASHBOARD
      const bigNumbers = document.querySelectorAll(
        'div[class*="xl"], div[class*="fw-700"], .mantine-Text-root[class*="xl"]',
      );
      console.log(
        "BRUTE FORCE: Found potential big numbers:",
        bigNumbers.length,
      );

      bigNumbers.forEach((el, index) => {
        if (
          el instanceof HTMLElement &&
          /^\d+(\.\d+)?/.test(el.textContent?.trim() || "")
        ) {
          // Only color if it doesn't already have a vibrant color
          const currentColor = window.getComputedStyle(el).color;
          if (
            currentColor.includes("255, 255, 255") ||
            currentColor.includes("rgb(255, 255, 255)")
          ) {
            const colors = [
              "#2563eb",
              "#059669",
              "#ea580c",
              "#8b5cf6",
              "#fbbf24",
              "#06b6d4",
            ];
            const color = colors[index % colors.length];

            el.style.color = color;
            el.style.setProperty("color", color, "important");
            (el.style as any).webkitTextFillColor = color;
            el.style.setProperty("-webkit-text-fill-color", color, "important");
          }
        }
      });
    };

    // Run once after DOM is ready, then mark as executed
    const timeout = setTimeout(() => {
      forceAdminColors();
      setColorForceExecuted(true);
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [loading, stats.totalUsers, colorForceExecuted]);

  if (profile?.role !== "admin") {
    console.log("🚫 Access denied - user is not admin");
    console.log("👤 Current profile:", profile);
    console.log("🔐 Current role:", profile?.role);
    return (
      <Container size="md">
        <Alert icon={<Shield size={16} />} title="Access Denied" color="red">
          You don't have permission to access the admin dashboard.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    console.log("⏳ Showing loading state");
    console.log("🔄 Loading value:", loading);
    return (
      <Container size="lg">
        <Text>Loading admin dashboard...</Text>
      </Container>
    );
  }

  // DEBUGGING: Log final render state
  console.log("🎨 About to render main dashboard content");
  console.log("📊 Final stats for render:", stats);
  console.log("📦 Final extensions count:", extensions.length);
  console.log("👥 Final users count:", users.length);
  console.log("📝 Final assignments count:", assignments.length);
  console.log("💳 Final transactions count:", transactions.length);
  console.log("📑 Active tab:", activeTab);

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="md">
        <Title order={1}>Admin Dashboard</Title>
        <Button variant="outline" onClick={() => setStatsDrawerOpened(true)}>
          Platform Stats
        </Button>
      </Group>

      <Group justify="space-between" mb="xl">
        <div>
          <Text c="dimmed" size="lg">
            Manage users, extensions, and review assignments
          </Text>
        </div>
        <Group>
          <Badge size="lg" variant="light" color="red">
            Administrator
          </Badge>
        </Group>
      </Group>

      <Group mb="md">
        <Badge color="blue">
          {assignments.filter((a) => a.status === "assigned").length} Active
          Reviews
        </Badge>
        <Badge color="green">
          {assignments.filter((a) => a.status === "approved").length} Completed
          Reviews
        </Badge>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<TrendingUp size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="extensions" leftSection={<Package size={16} />}>
            Extensions
          </Tabs.Tab>
          <Tabs.Tab value="users" leftSection={<Users size={16} />}>
            Users
          </Tabs.Tab>
          <Tabs.Tab value="reviews" leftSection={<Star size={16} />}>
            Reviews
          </Tabs.Tab>
          <Tabs.Tab value="credits" leftSection={<CreditCard size={16} />}>
            Credits
          </Tabs.Tab>
          <Tabs.Tab value="problems" leftSection={<Bug size={16} />}>
            Problem Reports
            {(() => {
              const pendingCount = problemReports.filter(
                (report) => report.status === "pending",
              ).length;
              return (
                pendingCount > 0 && (
                  <Badge size="xs" color="red" ml="xs">
                    {pendingCount}
                  </Badge>
                )
              );
            })()}
          </Tabs.Tab>
          <Tabs.Tab value="sent-messages" leftSection={<Mail size={16} />}>
            Sent Messages
            {sentMessages.length > 0 && (
              <Badge size="xs" color="blue" ml="xs">
                {sentMessages.length}
              </Badge>
            )}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Total Users</Text>
                  <Users size={20} />
                </Group>
                <Text size="xl" fw={700} mb="xs">
                  {stats.totalUsers}
                </Text>
                <Text size="sm" c="dimmed">
                  Registered developers
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Total Extensions</Text>
                  <Package size={20} />
                </Group>
                <Text size="xl" fw={700} mb="xs">
                  {stats.totalExtensions}
                </Text>
                <Text size="sm" c="dimmed">
                  In the system
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                withBorder
                onClick={handleQueueCardClick}
                style={{ cursor: "pointer" }}
                className="hover:bg-gray-50"
              >
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Extensions in Queue</Text>
                  <Package size={20} />
                </Group>
                <Text
                  size="xl"
                  fw={700}
                  mb="xs"
                  c={stats.pendingVerifications > 0 ? "orange" : "green"}
                >
                  {stats.pendingVerifications}
                </Text>
                <Text size="sm" c="dimmed">
                  Queued for review
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                withBorder
                onClick={handleActiveReviewsCardClick}
                style={{ cursor: "pointer" }}
                className="hover:bg-gray-50"
              >
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Active Reviews</Text>
                  <Star size={20} />
                </Group>
                <Text size="xl" fw={700} mb="xs">
                  {stats.activeReviews}
                </Text>
                <Text size="sm" c="dimmed">
                  In progress
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Credits Issued</Text>
                  <CreditCard size={20} />
                </Group>
                <Text size="xl" fw={700} mb="xs">
                  {stats.totalCreditsIssued}
                </Text>
                <Text size="sm" c="dimmed">
                  Total earned by users
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Avg Queue Time</Text>
                  <TrendingUp size={20} />
                </Group>
                <Text size="xl" fw={700} mb="xs">
                  {stats.avgQueueTime}
                </Text>
                <Text size="sm" c="dimmed">
                  From submission to assignment
                </Text>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="extensions" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Extension Management</Text>
              <Text size="sm" c="dimmed">
                {getFilteredExtensions().length} of {extensions.length}{" "}
                extensions
              </Text>
            </Group>
            <TextInput
              placeholder="Search extensions by name, description, owner, or status..."
              leftSection={<Search size={16} />}
              value={extensionsSearch}
              onChange={(event) =>
                setExtensionsSearch(event.currentTarget.value)
              }
              mb="md"
            />
            <ScrollArea h={400}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Extension</Table.Th>
                    <Table.Th>Owner</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Reviewer</Table.Th>
                    <Table.Th>Plan</Table.Th>
                    <Table.Th>Submitted</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredExtensions().map((extension) => (
                    <Table.Tr key={extension.id}>
                      <Table.Td>
                        <Group>
                          <Avatar size="sm" src={extension.logo_url} />
                          <div>
                            <Text
                              fw={500}
                              component="a"
                              href={extension.chrome_store_url}
                              target="_blank"
                              style={{
                                textDecoration: "none",
                                color: "inherit",
                              }}
                              className="hover:underline"
                            >
                              {extension.name}
                            </Text>
                            <Text size="sm" c="dimmed" truncate maw={200}>
                              {extension.description}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          size="sm"
                          component="button"
                          onClick={() =>
                            extension.owner?.id &&
                            navigateToUserProfile(extension.owner.id)
                          }
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--mantine-color-blue-6)",
                            textDecoration: "none",
                          }}
                          className="hover:underline"
                        >
                          {extension.owner?.name || "Unknown"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={getStatusColor(extension.status)}
                          size="sm"
                        >
                          {getStatusLabel(extension.status)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {extension.status === "assigned" ? (
                          (() => {
                            const reviewer = getExtensionReviewer(extension.id);
                            return reviewer ? (
                              <Text
                                size="sm"
                                component="button"
                                onClick={() =>
                                  navigateToUserProfile(reviewer.id)
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "var(--mantine-color-blue-6)",
                                  textDecoration: "none",
                                }}
                                className="hover:underline"
                              >
                                {reviewer.email}
                              </Text>
                            ) : (
                              <Text size="sm" c="dimmed">
                                No reviewer
                              </Text>
                            );
                          })()
                        ) : (
                          <Text size="sm" c="dimmed">
                            —
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            extension.owner?.subscription_status === "premium"
                              ? "green"
                              : "blue"
                          }
                          size="sm"
                        >
                          {extension.owner?.subscription_status === "premium"
                            ? "Premium"
                            : "Free"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {extension.created_at
                            ? new Date(
                                extension.created_at,
                              ).toLocaleDateString()
                            : "N/A"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            size="sm"
                            onClick={() =>
                              window.open(extension.chrome_store_url, "_blank")
                            }
                          >
                            <Eye size={14} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="users" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>User Management</Text>
              <Text size="sm" c="dimmed">
                {getFilteredUsers().length} of {users.length} users
              </Text>
            </Group>
            <TextInput
              placeholder="Search users by name, email, role, or subscription..."
              leftSection={<Search size={16} />}
              value={usersSearch}
              onChange={(event) => setUsersSearch(event.currentTarget.value)}
              mb="md"
            />
            <ScrollArea h={400}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>User</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Credits</Table.Th>
                    <Table.Th>Qualified</Table.Th>
                    <Table.Th>Plan</Table.Th>
                    <Table.Th>Joined</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredUsers().map((user) => (
                    <Table.Tr key={user.id}>
                      <Table.Td>
                        <div>
                          <Text
                            fw={500}
                            component="button"
                            onClick={() => navigateToUserProfile(user.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--mantine-color-blue-6)",
                              textDecoration: "none",
                            }}
                            className="hover:underline"
                          >
                            {user.name || "No name"}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {user.email}
                          </Text>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getRoleColor(user.role)} size="sm">
                          {user.role}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600}>{user.credit_balance}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            user.has_completed_qualification ? "green" : "gray"
                          }
                          size="sm"
                        >
                          {user.has_completed_qualification ? "Yes" : "No"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            user.subscription_status === "premium"
                              ? "green"
                              : "blue"
                          }
                          size="sm"
                        >
                          {user.subscription_status === "premium"
                            ? "Premium"
                            : "Free"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={() => navigateToUserProfile(user.id)}
                        >
                          <Edit size={14} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="reviews" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Review Assignments</Text>
              <Group>
                <Badge color="blue">
                  {
                    getFilteredAssignments().filter(
                      (a) => a.status === "assigned",
                    ).length
                  }{" "}
                  Active
                </Badge>
                <Badge color="green">
                  {
                    getFilteredAssignments().filter(
                      (a) => a.status === "approved",
                    ).length
                  }{" "}
                  Completed
                </Badge>
                <Text size="sm" c="dimmed">
                  {getFilteredAssignments().length} of {assignments.length}{" "}
                  assignments
                </Text>
              </Group>
            </Group>
            <TextInput
              placeholder="Search assignments by number, extension, reviewer, or status..."
              leftSection={<Search size={16} />}
              value={reviewsSearch}
              onChange={(event) => setReviewsSearch(event.currentTarget.value)}
              mb="md"
            />
            <ScrollArea h={400}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Assignment</Table.Th>
                    <Table.Th>Extension</Table.Th>
                    <Table.Th>Reviewer</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Rating</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredAssignments().map((assignment) => (
                    <Table.Tr key={assignment.id}>
                      <Table.Td>
                        <Text fw={500}>#{assignment.assignment_number}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          size="sm"
                          component="a"
                          href={assignment.extension?.chrome_store_url}
                          target="_blank"
                          style={{ textDecoration: "none", color: "inherit" }}
                          className="hover:underline"
                        >
                          {assignment.extension?.name || "Unknown"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          size="sm"
                          component="button"
                          onClick={() =>
                            assignment.reviewer?.id &&
                            navigateToUserProfile(assignment.reviewer.id)
                          }
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--mantine-color-blue-6)",
                            textDecoration: "none",
                          }}
                          className="hover:underline"
                        >
                          {assignment.reviewer?.name || "Unknown"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            assignment.status === "assigned" ? "blue" : "green"
                          }
                          size="sm"
                        >
                          {assignment.status === "assigned"
                            ? "In Progress"
                            : "Completed"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {assignment.status === "approved" &&
                          assignment.submitted_at
                            ? `Completed: ${new Date(assignment.submitted_at).toLocaleDateString()}`
                            : `Due: ${new Date(assignment.due_at).toLocaleDateString()}`}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {assignment.rating ? (
                            <Group gap="xs">
                              {[...Array(assignment.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  fill="#ffd43b"
                                  color="#ffd43b"
                                />
                              ))}
                            </Group>
                          ) : (
                            "-"
                          )}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="credits" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Credit Transactions</Text>
              <Text size="sm" c="dimmed">
                {getFilteredTransactions().length} of {transactions.length}{" "}
                transactions
              </Text>
            </Group>
            <TextInput
              placeholder="Search transactions by user, amount, type, or description..."
              leftSection={<Search size={16} />}
              value={creditsSearch}
              onChange={(event) => setCreditsSearch(event.currentTarget.value)}
              mb="md"
            />
            <ScrollArea h={400}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>User</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredTransactions().map((transaction) => (
                    <Table.Tr key={transaction.id}>
                      <Table.Td>
                        <Text size="sm">{transaction.user_id}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          fw={600}
                          c={transaction.type === "earned" ? "green" : "red"}
                        >
                          {transaction.type === "earned" ? "+" : "-"}
                          {Math.abs(transaction.amount)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            transaction.type === "earned" ? "green" : "red"
                          }
                          size="sm"
                        >
                          {transaction.type}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" truncate maw={200}>
                          {transaction.description}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {new Date(
                            transaction.created_at,
                          ).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="problems" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Problem Reports</Text>
              <Group>
                <Button
                  size="xs"
                  variant="light"
                  onClick={fetchProblemReports}
                  leftSection={<RefreshCcw size={14} />}
                >
                  Refresh
                </Button>
                <Text size="sm" c="dimmed">
                  {getFilteredProblemReports().length} of{" "}
                  {problemReports.length} reports (
                  {
                    getFilteredProblemReports().filter(
                      (r) => r.status === "pending",
                    ).length
                  }{" "}
                  pending,{" "}
                  {
                    getFilteredProblemReports().filter(
                      (r) => r.status === "resolved",
                    ).length
                  }{" "}
                  resolved) • Click any row for details
                </Text>
              </Group>
            </Group>
            <TextInput
              placeholder="Search reports by subject, content, email, status, or error..."
              leftSection={<Search size={16} />}
              value={problemsSearch}
              onChange={(event) => setProblemsSearch(event.currentTarget.value)}
              mb="md"
            />
            <ScrollArea h={400}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Subject</Table.Th>
                    <Table.Th>Body Preview</Table.Th>
                    <Table.Th>Error</Table.Th>
                    <Table.Th>
                      <Group gap="xs">
                        <Eye size={14} />
                        <Text size="sm">Details</Text>
                      </Group>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredProblemReports().map((report) => (
                    <Table.Tr
                      key={report.id}
                      onClick={() => handleReportClick(report)}
                      style={{ cursor: "pointer" }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Table.Td>
                        <Text size="sm">
                          {new Date(report.created_at).toLocaleString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            report.status === "resolved"
                              ? "green"
                              : report.status === "pending"
                                ? "orange"
                                : report.status === "sent"
                                  ? "blue"
                                  : "red"
                          }
                          size="sm"
                        >
                          {report.status === "resolved"
                            ? "RESOLVED"
                            : report.status.toUpperCase()}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500} maw={300} truncate>
                          {report.subject}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed" maw={400} truncate>
                          {report.body
                            .replace(/<[^>]*>/g, "")
                            .substring(0, 100)}
                          ...
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {report.error_message ? (
                          <Text size="sm" c="red" maw={200} truncate>
                            {report.error_message}
                          </Text>
                        ) : (
                          <Text size="sm" c="dimmed">
                            —
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Eye size={14} />
                          <Text size="sm" c="blue">
                            View
                          </Text>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            {getFilteredProblemReports().length === 0 && (
              <Text ta="center" c="dimmed" py="xl">
                {problemsSearch.trim()
                  ? "No problem reports match your search"
                  : "No problem reports found"}
              </Text>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="sent-messages" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Sent Messages</Text>
              <Group gap="sm">
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<RefreshCcw size={14} />}
                  loading={sentMessagesLoading}
                  onClick={fetchSentMessages}
                >
                  Refresh
                </Button>
                <Text size="sm" c="dimmed">
                  {getFilteredSentMessages().length} of {sentMessages.length}{" "}
                  messages
                </Text>
              </Group>
            </Group>
            <TextInput
              placeholder="Search messages by subject, content, recipient, or priority..."
              leftSection={<Search size={16} />}
              value={messagesSearch}
              onChange={(event) => setMessagesSearch(event.currentTarget.value)}
              mb="md"
            />
            <ScrollArea h={400}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Recipient</Table.Th>
                    <Table.Th>Subject</Table.Th>
                    <Table.Th>Priority</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Read At</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {getFilteredSentMessages().map((message) => (
                    <Table.Tr
                      key={message.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleMessageClick(message)}
                      className="hover:bg-gray-50"
                    >
                      <Table.Td>
                        <Text size="sm">
                          {new Date(message.created_at).toLocaleDateString()}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <Text size="sm" fw={500}>
                            {message.recipient?.name || "Unknown User"}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {message.recipient?.email}
                          </Text>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" maw={200} truncate>
                          {message.subject}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            message.priority === "urgent"
                              ? "red"
                              : message.priority === "high"
                                ? "orange"
                                : message.priority === "medium"
                                  ? "yellow"
                                  : "gray"
                          }
                          size="sm"
                        >
                          {message.priority.toUpperCase()}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={message.is_read ? "green" : "blue"}
                          size="sm"
                        >
                          {message.is_read ? "READ" : "SENT"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {message.read_at ? (
                          <div>
                            <Text size="sm">
                              {new Date(message.read_at).toLocaleDateString()}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(message.read_at).toLocaleTimeString()}
                            </Text>
                          </div>
                        ) : (
                          <Text size="sm" c="dimmed">
                            Not read yet
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Eye size={14} />
                          <Text size="sm" c="blue">
                            View
                          </Text>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            {getFilteredSentMessages().length === 0 && (
              <Text ta="center" c="dimmed" py="xl">
                {messagesSearch.trim()
                  ? "No messages match your search"
                  : "No messages sent yet"}
              </Text>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Problem Report Detail Modal */}
      <Modal
        opened={reportModalOpened}
        onClose={() => setReportModalOpened(false)}
        title="Problem Report Details"
        size="lg"
      >
        {selectedReport && (
          <Stack gap="md">
            {/* Report Metadata */}
            <Card withBorder p="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600} size="lg">
                    Report Information
                  </Text>
                  <Badge
                    color={
                      selectedReport.status === "resolved"
                        ? "green"
                        : selectedReport.status === "pending"
                          ? "orange"
                          : selectedReport.status === "sent"
                            ? "blue"
                            : "red"
                    }
                    size="lg"
                  >
                    {selectedReport.status === "resolved"
                      ? "RESOLVED"
                      : selectedReport.status.toUpperCase()}
                  </Badge>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed">
                    Date:
                  </Text>
                  <Text size="sm">
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed">
                    Email To:
                  </Text>
                  <Text size="sm">{selectedReport.to_email}</Text>
                </Group>
                {selectedReport.error_message && (
                  <div>
                    <Text size="sm" c="red" fw={600}>
                      Error Message:
                    </Text>
                    <Text size="sm" c="red">
                      {selectedReport.error_message}
                    </Text>
                  </div>
                )}
              </Stack>
            </Card>

            {/* Problem Details */}
            {(() => {
              const parsed = parseReportBody(selectedReport.body);
              return (
                <Card withBorder p="md">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={600} size="lg">
                        Problem Report Details
                      </Text>
                      {parsed.assignmentCancelled && (
                        <Badge color="red" size="lg">
                          Assignment Cancelled
                        </Badge>
                      )}
                    </Group>

                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="sm">
                          <div>
                            <Text size="sm" c="dimmed" fw={600}>
                              Extension Name:
                            </Text>
                            <Text size="md" fw={500}>
                              {parsed.extensionName || "Not specified"}
                            </Text>
                          </div>

                          <div>
                            <Text size="sm" c="dimmed" fw={600}>
                              Assignment ID:
                            </Text>
                            <Text
                              size="sm"
                              ff="monospace"
                              bg="gray.8"
                              c="white"
                              p="xs"
                              style={{ borderRadius: "4px" }}
                            >
                              {parsed.assignmentId || "Not specified"}
                            </Text>
                          </div>

                          <div>
                            <Text size="sm" c="dimmed" fw={600}>
                              Reporter Email:
                            </Text>
                            <Text size="sm">
                              {parsed.reporterEmail || "Not specified"}
                            </Text>
                          </div>
                        </Stack>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="sm">
                          <div>
                            <Text size="sm" c="dimmed" fw={600}>
                              Issue Type:
                            </Text>
                            <Badge
                              color={
                                parsed.issueType
                                  .toLowerCase()
                                  .includes("removed")
                                  ? "red"
                                  : parsed.issueType
                                        .toLowerCase()
                                        .includes("access")
                                    ? "orange"
                                    : "blue"
                              }
                              size="md"
                            >
                              {parsed.issueType || "Not specified"}
                            </Badge>
                          </div>

                          <div>
                            <Text size="sm" c="dimmed" fw={600}>
                              Severity:
                            </Text>
                            <Badge
                              color={
                                parsed.severity === "high"
                                  ? "red"
                                  : parsed.severity === "medium"
                                    ? "orange"
                                    : "gray"
                              }
                              size="sm"
                            >
                              {parsed.severity?.toUpperCase() || "UNKNOWN"}
                            </Badge>
                          </div>

                          {parsed.timestamp && (
                            <div>
                              <Text size="sm" c="dimmed" fw={600}>
                                Reported At:
                              </Text>
                              <Text size="sm">
                                {new Date(parsed.timestamp).toLocaleString()}
                              </Text>
                            </div>
                          )}
                        </Stack>
                      </Grid.Col>
                    </Grid>

                    {parsed.description && (
                      <div>
                        <Text size="sm" c="dimmed" fw={600} mb="xs">
                          Reviewer Description:
                        </Text>
                        <Card bg="blue.0" p="md">
                          <Text
                            size="sm"
                            style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}
                          >
                            {parsed.description}
                          </Text>
                        </Card>
                      </div>
                    )}
                  </Stack>
                </Card>
              );
            })()}

            {/* Technical Details */}
            <Card withBorder p="md">
              <Stack gap="sm">
                <Text fw={600} size="lg">
                  Technical Details
                </Text>
                {(() => {
                  const parsed = parseReportBody(selectedReport.body);
                  return (
                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <div>
                            <Text size="sm" c="dimmed" fw={600}>
                              Extension ID:
                            </Text>
                            <Text
                              size="xs"
                              ff="monospace"
                              bg="gray.8"
                              c="white"
                              p="xs"
                              style={{ borderRadius: "4px" }}
                            >
                              {parsed.extensionId || "Not available"}
                            </Text>
                          </div>
                          <div>
                            <Text size="sm" c="dimmed" fw={600}>
                              Reporter ID:
                            </Text>
                            <Text
                              size="xs"
                              ff="monospace"
                              bg="gray.8"
                              c="white"
                              p="xs"
                              style={{ borderRadius: "4px" }}
                            >
                              {parsed.reporterId || "Not available"}
                            </Text>
                          </div>
                        </Stack>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Stack gap="xs">
                          <div>
                            <Text size="sm" c="dimmed" fw={600}>
                              Report Status:
                            </Text>
                            <Badge
                              color={
                                selectedReport.status === "resolved"
                                  ? "green"
                                  : selectedReport.status === "pending"
                                    ? "orange"
                                    : selectedReport.status === "sent"
                                      ? "blue"
                                      : "red"
                              }
                              size="sm"
                            >
                              {selectedReport.status === "resolved"
                                ? "RESOLVED"
                                : selectedReport.status.toUpperCase()}
                            </Badge>
                          </div>
                          {selectedReport.error_message && (
                            <div>
                              <Text size="sm" c="red" fw={600}>
                                Processing Error:
                              </Text>
                              <Text size="xs" c="red">
                                {selectedReport.error_message}
                              </Text>
                            </div>
                          )}
                        </Stack>
                      </Grid.Col>
                    </Grid>
                  );
                })()}
              </Stack>
            </Card>

            {/* Action Buttons */}
            <Group justify="space-between">
              <Group>
                {selectedReport.status === "pending" ? (
                  <Button
                    color="green"
                    loading={updatingReportStatus}
                    onClick={() =>
                      updateReportStatus(selectedReport.id, "resolved")
                    }
                    leftSection={<CheckCircle size={16} />}
                  >
                    Mark as Resolved
                  </Button>
                ) : (
                  <Button
                    color="orange"
                    loading={updatingReportStatus}
                    onClick={() =>
                      updateReportStatus(selectedReport.id, "pending")
                    }
                    leftSection={<Clock size={16} />}
                  >
                    Reopen as Pending
                  </Button>
                )}
              </Group>
              <Button
                variant="outline"
                onClick={() => setReportModalOpened(false)}
              >
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Extensions in Queue Modal */}
      <Modal
        opened={queueModalOpened}
        onClose={() => setQueueModalOpened(false)}
        title="Extensions in Queue"
        size="xl"
      >
        <Stack gap="md">
          {(() => {
            // Filter extensions with status "queued" and sort by newest first
            const queuedExtensions = extensions
              .filter((extension) => extension.status === "queued")
              .sort((a, b) => {
                const dateA = new Date(
                  a.submitted_to_queue_at || a.created_at,
                ).getTime();
                const dateB = new Date(
                  b.submitted_to_queue_at || b.created_at,
                ).getTime();
                return dateB - dateA; // Reverse chronological order (newest first)
              });

            if (queuedExtensions.length === 0) {
              return (
                <Card withBorder p="xl" bg="gray.0">
                  <Stack align="center" gap="md">
                    <Package size={48} color="#9ca3af" />
                    <Text size="lg" fw={600} c="dimmed">
                      No Extensions in Queue
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      There are currently no extensions waiting for review
                      assignment.
                    </Text>
                  </Stack>
                </Card>
              );
            }

            return (
              <div>
                <Group justify="space-between" mb="md">
                  <Text fw={600} size="lg">
                    {queuedExtensions.length} extension
                    {queuedExtensions.length !== 1 ? "s" : ""} waiting for
                    review
                  </Text>
                  <Badge color="orange" size="lg">
                    QUEUE
                  </Badge>
                </Group>

                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Extension</Table.Th>
                      <Table.Th>Owner</Table.Th>
                      <Table.Th>Plan</Table.Th>
                      <Table.Th>Submitted to Queue</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {queuedExtensions.map((extension) => (
                      <Table.Tr key={extension.id}>
                        <Table.Td>
                          <Group>
                            <Avatar size="sm" src={extension.logo_url} />
                            <div>
                              <Text
                                fw={500}
                                component="a"
                                href={extension.chrome_store_url}
                                target="_blank"
                                style={{
                                  textDecoration: "none",
                                  color: "inherit",
                                }}
                                className="hover:underline"
                              >
                                {extension.name}
                              </Text>
                              <Text size="sm" c="dimmed" truncate maw={200}>
                                {extension.description}
                              </Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            size="sm"
                            component="button"
                            onClick={() =>
                              extension.owner?.id &&
                              navigateToUserProfile(extension.owner.id)
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--mantine-color-blue-6)",
                              textDecoration: "none",
                            }}
                            className="hover:underline"
                          >
                            {extension.owner?.name || "Unknown"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              extension.owner?.subscription_status === "premium"
                                ? "green"
                                : "blue"
                            }
                            size="sm"
                          >
                            {extension.owner?.subscription_status === "premium"
                              ? "Premium"
                              : "Free"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <div>
                            <Text size="sm">
                              {extension.submitted_to_queue_at
                                ? new Date(
                                    extension.submitted_to_queue_at,
                                  ).toLocaleDateString()
                                : new Date(
                                    extension.created_at,
                                  ).toLocaleDateString()}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {extension.submitted_to_queue_at
                                ? new Date(
                                    extension.submitted_to_queue_at,
                                  ).toLocaleTimeString()
                                : new Date(
                                    extension.created_at,
                                  ).toLocaleTimeString()}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  extension.chrome_store_url,
                                  "_blank",
                                )
                              }
                            >
                              <Eye size={14} />
                            </ActionIcon>
                            {extension.owner?.id && (
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                onClick={() =>
                                  navigateToUserProfile(extension.owner.id)
                                }
                              >
                                <Users size={14} />
                              </ActionIcon>
                            )}
                            <ActionIcon
                              variant="filled"
                              color="red"
                              size="sm"
                              onClick={() =>
                                handleRemoveFromQueue(
                                  extension.id,
                                  extension.name,
                                )
                              }
                            >
                              <XCircle size={14} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            );
          })()}

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => setQueueModalOpened(false)}
            >
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Message Detail Modal */}
      <Modal
        opened={messageModalOpened}
        onClose={() => setMessageModalOpened(false)}
        title="Message Details"
        size="lg"
      >
        {selectedMessage && (
          <Stack gap="md">
            {/* Message Metadata */}
            <Card withBorder p="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600} size="lg">
                    Message Information
                  </Text>
                  <Badge
                    color={selectedMessage.is_read ? "green" : "blue"}
                    size="lg"
                  >
                    {selectedMessage.is_read ? "READ" : "SENT"}
                  </Badge>
                </Group>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <div>
                        <Text size="sm" c="dimmed" fw={600}>
                          Sent Date:
                        </Text>
                        <Text size="sm">
                          {new Date(
                            selectedMessage.created_at,
                          ).toLocaleString()}
                        </Text>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed" fw={600}>
                          Recipient:
                        </Text>
                        <Text size="sm" fw={500}>
                          {selectedMessage.recipient?.name || "Unknown User"}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {selectedMessage.recipient?.email}
                        </Text>
                      </div>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <div>
                        <Text size="sm" c="dimmed" fw={600}>
                          Priority:
                        </Text>
                        <Badge
                          color={
                            selectedMessage.priority === "urgent"
                              ? "red"
                              : selectedMessage.priority === "high"
                                ? "orange"
                                : selectedMessage.priority === "medium"
                                  ? "yellow"
                                  : "gray"
                          }
                          size="sm"
                        >
                          {selectedMessage.priority.toUpperCase()}
                        </Badge>
                      </div>
                      {selectedMessage.read_at && (
                        <div>
                          <Text size="sm" c="dimmed" fw={600}>
                            Read At:
                          </Text>
                          <Text size="sm">
                            {new Date(selectedMessage.read_at).toLocaleString()}
                          </Text>
                        </div>
                      )}
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>

            {/* Message Content */}
            <Card withBorder p="md">
              <Stack gap="md">
                <div>
                  <Text fw={600} size="lg" mb="xs">
                    Subject
                  </Text>
                  <Text size="md" fw={500}>
                    {selectedMessage.subject}
                  </Text>
                </div>

                <Divider />

                <div>
                  <Text fw={600} size="lg" mb="xs">
                    Message
                  </Text>
                  <Card bg="gray.0" p="md">
                    <Text
                      size="sm"
                      style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                    >
                      {selectedMessage.message}
                    </Text>
                  </Card>
                </div>
              </Stack>
            </Card>

            {/* Close Button */}
            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => setMessageModalOpened(false)}
              >
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Active Reviews Modal */}
      <Modal
        opened={activeReviewsModalOpened}
        onClose={() => setActiveReviewsModalOpened(false)}
        title="Active Reviews"
        size="xl"
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="lg">
              Reviews in Progress ({getActiveReviewsSorted().length})
            </Text>
            <Badge color="blue" size="lg">
              Sorted by Due Date
            </Badge>
          </Group>

          {getActiveReviewsSorted().length === 0 ? (
            <Card withBorder p="xl">
              <Stack align="center" gap="md">
                <Star size={48} color="#9ca3af" />
                <Text size="lg" fw={600} c="dimmed">
                  No Active Reviews
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  There are currently no reviews in progress.
                </Text>
              </Stack>
            </Card>
          ) : (
            <ScrollArea h={500}>
              <Stack gap="sm">
                {getActiveReviewsSorted().map((assignment, index) => (
                  <Card
                    key={assignment.id}
                    withBorder
                    p="md"
                    className="hover:bg-gray-50"
                  >
                    <Grid align="center">
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Group>
                          <Avatar
                            src={assignment.extension?.logo_url}
                            size="md"
                            radius="md"
                          />
                          <div>
                            <Text
                              fw={600}
                              component="a"
                              href={assignment.extension?.chrome_store_url}
                              target="_blank"
                              style={{
                                textDecoration: "none",
                                color: "inherit",
                              }}
                              className="hover:underline"
                            >
                              {assignment.extension?.name ||
                                "Unknown Extension"}
                            </Text>
                            <Text size="sm" c="dimmed">
                              Assignment #{assignment.assignment_number}
                            </Text>
                          </div>
                        </Group>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 3 }}>
                        <div>
                          <Text size="sm" c="dimmed" fw={600}>
                            Reviewer:
                          </Text>
                          <Text
                            size="sm"
                            component="button"
                            onClick={() =>
                              assignment.reviewer?.id &&
                              navigateToUserProfile(assignment.reviewer.id)
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--mantine-color-blue-6)",
                              textDecoration: "none",
                            }}
                            className="hover:underline"
                          >
                            {assignment.reviewer?.name || "Unknown"}
                          </Text>
                        </div>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 2 }}>
                        <div>
                          <Text size="sm" c="dimmed" fw={600}>
                            Due Date:
                          </Text>
                          <Text
                            size="sm"
                            fw={600}
                            c={
                              new Date(assignment.due_at) < new Date()
                                ? "red"
                                : new Date(assignment.due_at).getTime() -
                                      new Date().getTime() <
                                    24 * 60 * 60 * 1000
                                  ? "orange"
                                  : "green"
                            }
                          >
                            {new Date(assignment.due_at).toLocaleDateString()}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {(() => {
                              const now = new Date();
                              const dueDate = new Date(assignment.due_at);
                              const diffTime =
                                dueDate.getTime() - now.getTime();
                              const diffDays = Math.ceil(
                                diffTime / (1000 * 60 * 60 * 24),
                              );

                              if (diffDays < 0) {
                                return `${Math.abs(diffDays)} days overdue`;
                              } else if (diffDays === 0) {
                                return "Due today";
                              } else if (diffDays === 1) {
                                return "Due tomorrow";
                              } else {
                                return `${diffDays} days remaining`;
                              }
                            })()}
                          </Text>
                        </div>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 1 }}>
                        <Tooltip label="Cancel this assignment and put extension back in queue">
                          <Button
                            size="xs"
                            color="red"
                            variant="outline"
                            onClick={() =>
                              handleCancelAssignment(
                                assignment.id,
                                assignment.assignment_number.toString(),
                                assignment.extension?.name ||
                                  "Unknown Extension",
                                assignment.reviewer?.name || "Unknown Reviewer",
                              )
                            }
                            leftSection={<XCircle size={14} />}
                          >
                            Cancel
                          </Button>
                        </Tooltip>
                      </Grid.Col>
                    </Grid>
                  </Card>
                ))}
              </Stack>
            </ScrollArea>
          )}

          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => setActiveReviewsModalOpened(false)}
            >
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Drawer
        opened={statsDrawerOpened}
        onClose={() => setStatsDrawerOpened(false)}
        position="right"
        size="lg"
        title="Platform Stats"
      >
        <PlatformStatsPanel />
      </Drawer>
    </Container>
  );
}
