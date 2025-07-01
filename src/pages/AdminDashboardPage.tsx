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

  const handleReportClick = (report: EmailLog) => {
    setSelectedReport(report);
    setReportModalOpened(true);
  };

  const updateReportStatus = async (reportId: string, newStatus: 'pending' | 'resolved') => {
    try {
      setUpdatingReportStatus(true);

      const { data, error } = await supabase.functions.invoke(
        "update-problem-report-status",
        {
          body: { report_id: reportId, status: newStatus }
        }
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
      setProblemReports(prev => 
        prev.map(report => 
          report.id === reportId ? { ...report, status: newStatus } : report
        )
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
        assignmentId: reportData.assignment_id || '',
        extensionId: reportData.extension_id || '',
        extensionName: reportData.extension_name || '',
        reporterId: reportData.reporter_id || '',
        reporterEmail: reportData.reporter_email || '',
        issueType: reportData.issue_type || '',
        description: reportData.description || '',
        assignmentCancelled: reportData.cancel_assignment || false,
        timestamp: reportData.timestamp || '',
        severity: reportData.severity || 'medium',
        rawData: reportData
      };
    } catch (error) {
      console.error('Error parsing report body:', error);
      // Fallback for non-JSON content
      return {
        assignmentId: '',
        extensionId: '',
        extensionName: '',
        reporterId: '',
        reporterEmail: '',
        issueType: '',
        description: body.substring(0, 200) + '...',
        assignmentCancelled: false,
        timestamp: '',
        severity: 'unknown',
        rawData: body
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

  // NUCLEAR ADMIN DASHBOARD COLOR FORCING
  useEffect(() => {
    const forceAdminColors = () => {
      console.log(
        "🎨 NUCLEAR ADMIN DASHBOARD COLOR FORCING - JavaScript is running!",
      );

      // APPROACH 1: Target all cards by content
      const allCards = document.querySelectorAll(
        ".mantine-Card-root, .mantine-Paper-root",
      );
      console.log("Found all admin cards:", allCards.length);

      allCards.forEach((card, index) => {
        if (card instanceof HTMLElement) {
          const cardText = card.textContent || "";
          console.log(`Admin card ${index} text:`, cardText.substring(0, 80));

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
            console.log("🔵 NUCLEAR: FORCING BLUE for Total Users");
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
                console.log(`FORCED ${el.textContent} to BLUE`);
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
            console.log("🟢 NUCLEAR: FORCING GREEN for Total Extensions");
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
                console.log(`FORCED ${el.textContent} to GREEN`);
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
            console.log("🟠 NUCLEAR: FORCING ORANGE for Extensions in Queue");
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
                console.log(`FORCED ${el.textContent} to ORANGE`);
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
            console.log("🟣 NUCLEAR: FORCING PURPLE for Active Reviews");
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
                console.log(`FORCED ${el.textContent} to PURPLE`);
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
            console.log("🟡 NUCLEAR: FORCING YELLOW for Credits Issued");
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
                console.log(`FORCED ${el.textContent} to YELLOW`);
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
            console.log("🔵 NUCLEAR: FORCING CYAN for Avg Queue Time");
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
                console.log(`FORCED ${el.textContent} to CYAN`);
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
            console.log(
              `BRUTE FORCE: Setting ${color} for number ${el.textContent} (index ${index})`,
            );

            el.style.color = color;
            el.style.setProperty("color", color, "important");
            (el.style as any).webkitTextFillColor = color;
            el.style.setProperty("-webkit-text-fill-color", color, "important");
          }
        }
      });
    };

    // ULTRA AGGRESSIVE TIMING
    forceAdminColors();
    const timeout1 = setTimeout(forceAdminColors, 100);
    const timeout2 = setTimeout(forceAdminColors, 500);
    const timeout3 = setTimeout(forceAdminColors, 1000);
    const timeout4 = setTimeout(forceAdminColors, 2000);
    const timeout5 = setTimeout(forceAdminColors, 3000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      clearTimeout(timeout5);
    };
  }, [stats]);

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
              const pendingCount = problemReports.filter(report => report.status === 'pending').length;
              return pendingCount > 0 && (
                <Badge size="xs" color="red" ml="xs">
                  {pendingCount}
                </Badge>
              );
            })()}
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
              <Card withBorder>
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
              <Card withBorder>
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
            </Group>
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
                {extensions.slice(0, 20).map((extension) => (
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
                            style={{ textDecoration: "none", color: "inherit" }}
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
                      <Badge color={getStatusColor(extension.status)} size="sm">
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
                              onClick={() => navigateToUserProfile(reviewer.id)}
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
                          ? new Date(extension.created_at).toLocaleDateString()
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
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="users" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>User Management</Text>
              <Text size="sm" c="dimmed">
                {users.length} total users
              </Text>
            </Group>
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
                {users.slice(0, 20).map((user) => (
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
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="reviews" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Review Assignments</Text>
              <Group>
                <Badge color="blue">
                  {assignments.filter((a) => a.status === "assigned").length}{" "}
                  Active
                </Badge>
                <Badge color="green">
                  {assignments.filter((a) => a.status === "approved").length}{" "}
                  Completed
                </Badge>
              </Group>
            </Group>
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
                {assignments.slice(0, 20).map((assignment) => (
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
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="credits" pt="md">
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Credit Transactions</Text>
              <Text size="sm" c="dimmed">
                Recent activity
              </Text>
            </Group>
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
                {transactions.slice(0, 20).map((transaction) => (
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
                        color={transaction.type === "earned" ? "green" : "red"}
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
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
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
                  {problemReports.length} total reports ({problemReports.filter(r => r.status === 'pending').length} pending, {problemReports.filter(r => r.status === 'resolved').length} resolved) • Click any row for details
                </Text>
              </Group>
            </Group>
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
                {problemReports.slice(0, 50).map((report) => (
                  <Table.Tr 
                    key={report.id}
                    onClick={() => handleReportClick(report)}
                    style={{ cursor: 'pointer' }}
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
                        {report.status === "resolved" ? "RESOLVED" : report.status.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500} maw={300} truncate>
                        {report.subject}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" maw={400} truncate>
                        {report.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
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
                        <Text size="sm" c="blue">View</Text>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {problemReports.length === 0 && (
              <Text ta="center" c="dimmed" py="xl">
                No problem reports found
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
                  <Text fw={600} size="lg">Report Information</Text>
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
                     {selectedReport.status === "resolved" ? "RESOLVED" : selectedReport.status.toUpperCase()}
                   </Badge>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed">Date:</Text>
                  <Text size="sm">{new Date(selectedReport.created_at).toLocaleString()}</Text>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed">Email To:</Text>
                  <Text size="sm">{selectedReport.to_email}</Text>
                </Group>
                {selectedReport.error_message && (
                  <div>
                    <Text size="sm" c="red" fw={600}>Error Message:</Text>
                    <Text size="sm" c="red">{selectedReport.error_message}</Text>
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
                       <Text fw={600} size="lg">Problem Report Details</Text>
                       {parsed.assignmentCancelled && (
                         <Badge color="red" size="lg">Assignment Cancelled</Badge>
                       )}
                     </Group>
                     
                     <Grid>
                       <Grid.Col span={{ base: 12, md: 6 }}>
                         <Stack gap="sm">
                           <div>
                             <Text size="sm" c="dimmed" fw={600}>Extension Name:</Text>
                             <Text size="md" fw={500}>{parsed.extensionName || 'Not specified'}</Text>
                           </div>
                           
                           <div>
                             <Text size="sm" c="dimmed" fw={600}>Assignment ID:</Text>
                             <Text size="sm" ff="monospace" bg="gray.8" c="white" p="xs" style={{ borderRadius: '4px' }}>
                               {parsed.assignmentId || 'Not specified'}
                             </Text>
                           </div>
                           
                           <div>
                             <Text size="sm" c="dimmed" fw={600}>Reporter Email:</Text>
                             <Text size="sm">{parsed.reporterEmail || 'Not specified'}</Text>
                           </div>
                         </Stack>
                       </Grid.Col>
                       
                       <Grid.Col span={{ base: 12, md: 6 }}>
                         <Stack gap="sm">
                           <div>
                             <Text size="sm" c="dimmed" fw={600}>Issue Type:</Text>
                             <Badge 
                               color={
                                 parsed.issueType.toLowerCase().includes('removed') ? 'red' :
                                 parsed.issueType.toLowerCase().includes('access') ? 'orange' :
                                 'blue'
                               } 
                               size="md"
                             >
                               {parsed.issueType || 'Not specified'}
                             </Badge>
                           </div>
                           
                           <div>
                             <Text size="sm" c="dimmed" fw={600}>Severity:</Text>
                             <Badge 
                               color={parsed.severity === 'high' ? 'red' : parsed.severity === 'medium' ? 'orange' : 'gray'}
                               size="sm"
                             >
                               {parsed.severity?.toUpperCase() || 'UNKNOWN'}
                             </Badge>
                           </div>
                           
                           {parsed.timestamp && (
                             <div>
                               <Text size="sm" c="dimmed" fw={600}>Reported At:</Text>
                               <Text size="sm">{new Date(parsed.timestamp).toLocaleString()}</Text>
                             </div>
                           )}
                         </Stack>
                       </Grid.Col>
                     </Grid>
                     
                     {parsed.description && (
                       <div>
                         <Text size="sm" c="dimmed" fw={600} mb="xs">Reviewer Description:</Text>
                         <Card bg="blue.0" p="md">
                           <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
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
                 <Text fw={600} size="lg">Technical Details</Text>
                 {(() => {
                   const parsed = parseReportBody(selectedReport.body);
                   return (
                     <Grid>
                       <Grid.Col span={{ base: 12, md: 6 }}>
                         <Stack gap="xs">
                           <div>
                             <Text size="sm" c="dimmed" fw={600}>Extension ID:</Text>
                             <Text size="xs" ff="monospace" bg="gray.8" c="white" p="xs" style={{ borderRadius: '4px' }}>
                               {parsed.extensionId || 'Not available'}
                             </Text>
                           </div>
                           <div>
                             <Text size="sm" c="dimmed" fw={600}>Reporter ID:</Text>
                             <Text size="xs" ff="monospace" bg="gray.8" c="white" p="xs" style={{ borderRadius: '4px' }}>
                               {parsed.reporterId || 'Not available'}
                             </Text>
                           </div>
                         </Stack>
                       </Grid.Col>
                       <Grid.Col span={{ base: 12, md: 6 }}>
                         <Stack gap="xs">
                           <div>
                             <Text size="sm" c="dimmed" fw={600}>Report Status:</Text>
                             <Badge 
                               color={
                                 selectedReport.status === 'resolved' ? 'green' : 
                                 selectedReport.status === 'pending' ? 'orange' : 
                                 selectedReport.status === 'sent' ? 'blue' : 'red'
                               }
                               size="sm"
                             >
                               {selectedReport.status === 'resolved' ? 'RESOLVED' : selectedReport.status.toUpperCase()}
                             </Badge>
                           </div>
                           {selectedReport.error_message && (
                             <div>
                               <Text size="sm" c="red" fw={600}>Processing Error:</Text>
                               <Text size="xs" c="red">{selectedReport.error_message}</Text>
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
                 {selectedReport.status === 'pending' ? (
                   <Button 
                     color="green"
                     loading={updatingReportStatus}
                     onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                     leftSection={<CheckCircle size={16} />}
                   >
                     Mark as Resolved
                   </Button>
                 ) : (
                   <Button 
                     color="orange"
                     loading={updatingReportStatus}
                     onClick={() => updateReportStatus(selectedReport.id, 'pending')}
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
