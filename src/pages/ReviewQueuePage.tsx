import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Grid,
  Avatar,
  Progress,
  Alert,
  Modal,
  Textarea,
  Rating,
  TextInput,
  Divider,
  ActionIcon,
  Tooltip,
  Box,
  Checkbox,
  ThemeIcon,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  Clock,
  Star,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Timer,
  Package,
  Eye,
  MessageSquare,
  Upload,
  Award,
  Plus,
  Loader,
  Crown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
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

type ReviewAssignment =
  Database["public"]["Tables"]["review_assignments"]["Row"];
type Extension = Database["public"]["Tables"]["extensions"]["Row"];

interface AssignmentWithExtension extends ReviewAssignment {
  extension?: Extension | null;
}

interface CountdownTimers {
  [assignmentId: string]: number; // milliseconds remaining
}

export function ReviewQueuePage() {
  const { profile, refreshProfile } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentWithExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentWithExtension | null>(null);
  const [requestingAssignment, setRequestingAssignment] = useState(false);
  const [countdownTimers, setCountdownTimers] = useState<CountdownTimers>({});
  const [reviewDetailsModalOpen, setReviewDetailsModalOpen] = useState(false);
  const [selectedReviewAssignment, setSelectedReviewAssignment] =
    useState<AssignmentWithExtension | null>(null);

  const submissionForm = useForm({
    initialValues: {
      submitted_date: new Date(),
      review_text: "",
      rating: 5,
      confirmed_submission: false,
    },
    validate: {
      review_text: (value) =>
        value.length < 25 ? "Review must be at least 25 characters" : null,
      rating: (value) =>
        value < 1 || value > 5 ? "Rating must be between 1 and 5" : null,
      confirmed_submission: (value) =>
        !value
          ? "You must confirm that the review was submitted to the Chrome Web Store"
          : null,
    },
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const activeAssignments = assignments.filter(
      (a) =>
        a.status === "assigned" &&
        a.installed_at &&
        a.earliest_review_time &&
        new Date(a.earliest_review_time) > new Date(),
    );

    if (activeAssignments.length === 0) {
      setCountdownTimers({});
      return;
    }

    // Initialize countdown timers
    const initialTimers: CountdownTimers = {};
    activeAssignments.forEach((assignment) => {
      if (assignment.earliest_review_time) {
        const timeRemaining =
          new Date(assignment.earliest_review_time).getTime() - Date.now();
        if (timeRemaining > 0) {
          initialTimers[assignment.id] = timeRemaining;
        }
      }
    });

    setCountdownTimers(initialTimers);

    // Set up interval to update timers every second
    const interval = setInterval(() => {
      setCountdownTimers((prevTimers) => {
        const updatedTimers: CountdownTimers = {};
        let hasChanges = false;

        Object.keys(prevTimers).forEach((assignmentId) => {
          const newTime = prevTimers[assignmentId] - 1000;
          if (newTime > 0) {
            updatedTimers[assignmentId] = newTime;
          } else {
            hasChanges = true;
          }
        });

        // If any timer reached zero, refresh assignments to update UI
        if (
          hasChanges &&
          Object.keys(updatedTimers).length < Object.keys(prevTimers).length
        ) {
          setTimeout(() => fetchAssignments(), 100);
        }

        return updatedTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [assignments]);

  const fetchAssignments = async () => {
    try {
      if (!profile?.id) {
        console.log("No profile ID available yet");
        return;
      }

      console.log("Fetching assignments for user:", profile.id);

      // Use Edge Function to bypass RLS and prevent infinite recursion
      const { data, error } = await withTimeout(
        supabase.functions.invoke("fetch-review-assignments-for-reviewer", {
          body: { user_id: profile.id },
        }),
        10000, // 10 second timeout for edge function calls
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to fetch assignments");
      }

      setAssignments(data.data || []);
      console.log("Assignments fetch completed");
    } catch (error) {
      console.error("Error fetching assignments:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load review assignments",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkInstalled = async (assignment: AssignmentWithExtension) => {
    try {
      const { error } = await supabase
        .from("review_assignments")
        .update({
          installed_at: new Date().toISOString(),
          earliest_review_time: new Date(
            Date.now() + 60 * 60 * 1000,
          ).toISOString(), // 60 minutes from now
        })
        .eq("id", assignment.id);

      if (error) throw error;

      notifications.show({
        title: "Success",
        message:
          "Extension marked as installed. You can submit your review in 60 minutes.",
        color: "green",
      });
      fetchAssignments();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to mark extension as installed",
        color: "red",
      });
    }
  };

  const handleRequestAssignment = async () => {
    if (!profile?.id) return;

    setRequestingAssignment(true);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke("request-review-assignment", {
          body: { user_id: profile.id },
        }),
        10000, // 10 second timeout for edge function calls
      );

      if (error) {
        console.error("Assignment request error:", error);
        throw error;
      }

      // Check if the function returned a success message without an actual assignment
      if (data?.success && !data?.assignment) {
        notifications.show({
          title: "No Assignments Available",
          message: data.message,
          color: "blue", // Changed color to blue for informational message
          icon: <AlertTriangle size={16} />, // Changed icon to AlertTriangle
        });
      } else if (!data?.success) {
        throw new Error(data?.error || "Failed to request assignment");
      } else {
        notifications.show({
          title: "Assignment Received!",
          message: data.message,
          color: "green",
          icon: <Star size={16} />,
        });
      }

      // Refresh assignments to show the new one
      fetchAssignments();
    } catch (error: any) {
      console.error("Assignment request failed:", error);
      notifications.show({
        title: "Assignment Request Failed",
        message: error.message || "Failed to request assignment",
        color: "red",
      });
    } finally {
      setRequestingAssignment(false);
    }
  };

  const handleSubmitReview = async (values: typeof submissionForm.values) => {
    if (!selectedAssignment) return;

    try {
      // Call the process-submitted-review Edge Function
      const { data, error } = await supabase.functions.invoke(
        "process-submitted-review",
        {
          body: {
            assignment_id: selectedAssignment.id,
            submitted_date: values.submitted_date.toISOString(),
            review_text: values.review_text,
            rating: values.rating,
            confirmed_submission: values.confirmed_submission,
          },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to process review submission");
      }

      notifications.show({
        title: "Review Submitted and Approved!",
        message: `Your review has been approved and you've earned ${data.credits_earned || 1} credit!`,
        color: "green",
      });

      setSubmissionModalOpen(false);
      setSelectedAssignment(null);
      submissionForm.reset();
      fetchAssignments();

      // Refresh profile to update credit balance display
      await refreshProfile();
    } catch (error: any) {
      console.error("Review submission error:", error);
      notifications.show({
        title: "Error",
        message: error.message || "Failed to process review submission",
        color: "red",
      });
    }
  };

  const openSubmissionModal = (assignment: AssignmentWithExtension) => {
    setSelectedAssignment(assignment);
    submissionForm.reset();
    setSubmissionModalOpen(true);
  };

  const getStatusColor = (assignment: AssignmentWithExtension) => {
    if (assignment.status === "submitted") return "orange";
    if (assignment.status === "approved") return "green";
    if (!assignment.installed_at) return "blue";
    if (
      assignment.earliest_review_time &&
      new Date(assignment.earliest_review_time) > new Date()
    )
      return "yellow";
    return "purple";
  };

  const getStatusLabel = (assignment: AssignmentWithExtension) => {
    if (assignment.status === "submitted") return "Review Submitted";
    if (assignment.status === "approved") return "Review Approved";
    if (!assignment.installed_at) return "Install Required";
    if (
      assignment.earliest_review_time &&
      new Date(assignment.earliest_review_time) > new Date()
    )
      return "Waiting Period";
    return "Ready to Review";
  };

  const canSubmitReview = (assignment: AssignmentWithExtension) => {
    // Check if countdown timer exists and is greater than 0
    if (countdownTimers[assignment.id] && countdownTimers[assignment.id] > 0) {
      return false;
    }

    return (
      assignment.installed_at &&
      assignment.earliest_review_time &&
      new Date(assignment.earliest_review_time) <= new Date() &&
      assignment.status === "assigned"
    );
  };

  const getDaysUntilDue = (dueDate: string) => {
    const timeUntilDue = new Date(dueDate).getTime() - Date.now();
    const hours = Math.ceil(timeUntilDue / (1000 * 60 * 60));

    if (hours <= 0) return "Overdue";
    if (hours < 24) return `${hours}h`;

    const days = Math.ceil(hours / 24);
    return `${days}d`;
  };

  const formatCountdownTime = (milliseconds: number): string => {
    if (milliseconds <= 0) return "Ready now";

    const totalSeconds = Math.ceil(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getTimeUntilReviewable = (assignment: AssignmentWithExtension) => {
    // Use countdown timer if available
    if (countdownTimers[assignment.id]) {
      return formatCountdownTime(countdownTimers[assignment.id]);
    }

    // Fallback to static calculation
    if (!assignment.earliest_review_time) return "Now";

    const timeUntilReview =
      new Date(assignment.earliest_review_time).getTime() - Date.now();
    if (timeUntilReview <= 0) return "Now";

    return formatCountdownTime(timeUntilReview);
  };

  // Helper to open review details modal
  const openReviewDetailsModal = (assignment: AssignmentWithExtension) => {
    setSelectedReviewAssignment(assignment);
    setReviewDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <Container size="lg">
        <Text>Loading review assignments...</Text>
      </Container>
    );
  }

  const activeAssignments = assignments.filter((a) => a.status === "assigned");
  const submittedAssignments = assignments.filter(
    (a) => a.status === "submitted",
  );
  const approvedAssignments = assignments.filter(
    (a) => a.status === "approved",
  );

  return (
    <Container size="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Review Queue</Title>
          <Text c="dimmed" size="lg">
            Complete your assigned reviews to earn credits
          </Text>
        </div>
        <Group>
          {profile?.has_completed_qualification &&
            activeAssignments.length < 2 && (
              <Button
                leftSection={
                  requestingAssignment ? (
                    <Loader size={16} />
                  ) : (
                    <Plus size={16} />
                  )
                }
                onClick={handleRequestAssignment}
                loading={requestingAssignment}
                disabled={activeAssignments.length >= 1}
              >
                Request Assignment
              </Button>
            )}
          <Badge size="lg" variant="light" color="blue">
            {activeAssignments.length} Active
          </Badge>
          <Badge size="lg" variant="light" color="orange">
            {submittedAssignments.length} Pending
          </Badge>
        </Group>
      </Group>

      {assignments.length === 0 ? (
        <Card withBorder p="xl" radius="lg" shadow="sm">
          <Stack align="center" gap="xl" py="xl">
            <ThemeIcon size={80} radius="xl" variant="light" color="blue">
              <Package size={40} />
            </ThemeIcon>
            <Stack align="center" gap="md">
              <Title order={2} ta="center">
                No Review Assignments
              </Title>
              <Text c="dimmed" size="lg" ta="center" maw={500}>
                {!profile?.has_completed_qualification
                  ? "Complete your reviewer qualification to start receiving assignments and earning credits."
                  : "You don't have any review assignments yet. Click 'Request Assignment' to get your next review task and start earning credits!"}
              </Text>
            </Stack>
            {!profile?.has_completed_qualification ? (
              <Button
                component="a"
                href="/qualification"
                variant="filled"
                size="lg"
                radius="md"
                leftSection={<CheckCircle size={20} />}
              >
                Complete Qualification
              </Button>
            ) : (
              <Button
                leftSection={
                  requestingAssignment ? (
                    <Loader size={20} />
                  ) : (
                    <Plus size={20} />
                  )
                }
                onClick={handleRequestAssignment}
                loading={requestingAssignment}
                size="lg"
                radius="md"
                disabled={activeAssignments.length >= 1}
              >
                Request Assignment
              </Button>
            )}
          </Stack>
        </Card>
      ) : (
        <Stack gap="xl">
          {/* Active Assignments */}
          {activeAssignments.length > 0 && (
            <div>
              <Title order={2} size="h3" mb="md">
                Active Assignments ({activeAssignments.length})
              </Title>
              <Grid>
                {activeAssignments.map((assignment) => (
                  <Grid.Col key={assignment.id} span={{ base: 12, md: 6 }}>
                    <Card withBorder h="100%" p="xl" radius="lg" shadow="sm">
                      <Stack gap="lg">
                        <Group justify="space-between" align="flex-start">
                          <Group>
                            <Avatar
                              src={assignment.extension?.logo_url}
                              size="md"
                              radius="md"
                            />
                            <div>
                              <Text fw={600} size="lg">
                                {assignment.extension?.name ||
                                  "Unknown Extension"}
                              </Text>
                            </div>
                          </Group>
                          <Badge color={getStatusColor(assignment)} size="sm">
                            {getStatusLabel(assignment)}
                          </Badge>
                        </Group>

                        <Text size="sm" lineClamp={2} c="dimmed">
                          {assignment.extension?.description ||
                            "No description available"}
                        </Text>

                        <Group gap="xs" wrap="wrap">
                          {assignment.extension?.category?.map((cat) => (
                            <Badge
                              key={cat}
                              size="sm"
                              variant="light"
                              radius="md"
                            >
                              {cat}
                            </Badge>
                          ))}
                        </Group>

                        <Divider />

                        <Group justify="space-between" align="center">
                          <Group gap="xs">
                            <Calendar size={14} />
                            <Text size="xs" c="dimmed">
                              Due in {getDaysUntilDue(assignment.due_at)}
                            </Text>
                          </Group>
                          {assignment.earliest_review_time &&
                            new Date(assignment.earliest_review_time) >
                              new Date() && (
                              <Group gap="xs">
                                <Timer size={14} />
                                <Text size="xs" c="dimmed" fw={600}>
                                  Review in {getTimeUntilReviewable(assignment)}
                                </Text>
                              </Group>
                            )}
                        </Group>

                        <Group justify="space-between">
                          <Button
                            variant="light"
                            size="md"
                            radius="md"
                            leftSection={<ExternalLink size={16} />}
                            onClick={() =>
                              assignment.extension?.chrome_store_url &&
                              window.open(
                                assignment.extension.chrome_store_url,
                                "_blank",
                              )
                            }
                            disabled={!assignment.extension?.chrome_store_url}
                          >
                            View Extension
                          </Button>

                          {!assignment.installed_at ? (
                            <Button
                              size="md"
                              radius="md"
                              onClick={() => handleMarkInstalled(assignment)}
                            >
                              Mark as Installed
                            </Button>
                          ) : (
                            <Tooltip
                              label={
                                !canSubmitReview(assignment)
                                  ? `Complete ${getTimeUntilReviewable(assignment)} waiting period before reviewing`
                                  : ""
                              }
                            >
                              <Button
                                size="md"
                                radius="md"
                                color={
                                  canSubmitReview(assignment) ? "green" : ""
                                }
                                leftSection={<MessageSquare size={16} />}
                                onClick={() =>
                                  canSubmitReview(assignment) &&
                                  openSubmissionModal(assignment)
                                }
                                disabled={!canSubmitReview(assignment)}
                              >
                                Submit Review
                              </Button>
                            </Tooltip>
                          )}
                        </Group>

                        {new Date(assignment.due_at).getTime() - Date.now() <=
                          24 * 60 * 60 * 1000 && (
                          <Alert
                            icon={<AlertTriangle size={16} />}
                            color="orange"
                            size="sm"
                            radius="md"
                          >
                            Due within 24 hours! Complete this review to avoid
                            penalties.
                          </Alert>
                        )}
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            </div>
          )}

          {/* Submitted Assignments */}
          {submittedAssignments.length > 0 && (
            <div>
              <Title order={2} size="h3" mb="md">
                Submitted Reviews ({submittedAssignments.length})
              </Title>
              <Stack gap="sm">
                {submittedAssignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    withBorder
                    p="lg"
                    radius="lg"
                    shadow="sm"
                  >
                    <Group justify="space-between">
                      <Group>
                        <Avatar
                          src={assignment.extension?.logo_url}
                          size="sm"
                          radius="md"
                        />
                        <div>
                          <Text fw={500}>
                            {assignment.extension?.name || "Unknown Extension"}
                          </Text>
                          <Text size="sm" c="dimmed">
                            Submitted{" "}
                            {assignment.submitted_at
                              ? new Date(
                                  assignment.submitted_at,
                                ).toLocaleDateString()
                              : "Recently"}
                          </Text>
                        </div>
                      </Group>
                      <Group>
                        <Group gap="xs">
                          {[...Array(assignment.rating || 0)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill="#ffd43b"
                              color="#ffd43b"
                            />
                          ))}
                        </Group>
                        <Badge color="orange" size="sm">
                          Pending Approval
                        </Badge>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </div>
          )}

          {/* Approved Assignments */}
          {approvedAssignments.length > 0 && (
            <div>
              <Title order={2} size="h3" mb="md">
                Completed Reviews ({approvedAssignments.length})
              </Title>
              <Stack gap="sm">
                {approvedAssignments
                  .sort((a, b) => {
                    // Sort by submitted_at in reverse chronological order (newest first)
                    const dateA = a.submitted_at
                      ? new Date(a.submitted_at).getTime()
                      : 0;
                    const dateB = b.submitted_at
                      ? new Date(b.submitted_at).getTime()
                      : 0;
                    return dateB - dateA;
                  })
                  .map((assignment) => (
                    <Card
                      key={assignment.id}
                      withBorder
                      p="lg"
                      radius="lg"
                      shadow="sm"
                    >
                      <Group justify="space-between">
                        <Group>
                          <Avatar
                            src={assignment.extension?.logo_url}
                            size="sm"
                            radius="md"
                          />
                          <div>
                            <Text
                              fw={500}
                              component="button"
                              type="button"
                              onClick={() => openReviewDetailsModal(assignment)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                margin: 0,
                                textAlign: "left",
                                textDecoration: "underline",
                                color: "var(--mantine-color-blue-6)",
                                cursor: "pointer",
                                font: "inherit",
                              }}
                            >
                              {assignment.extension?.name ||
                                "Unknown Extension"}
                            </Text>
                            <Text size="sm" c="dimmed">
                              Completed{" "}
                              {assignment.submitted_at
                                ? new Date(
                                    assignment.submitted_at,
                                  ).toLocaleDateString()
                                : "Recently"}
                            </Text>
                          </div>
                        </Group>
                        <Group>
                          <Group gap="xs">
                            {[...Array(assignment.rating || 0)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill="#ffd43b"
                                color="#ffd43b"
                              />
                            ))}
                          </Group>
                          <Badge
                            color="green"
                            size="sm"
                            leftSection={<Award size={12} />}
                          >
                            Credits Earned
                          </Badge>
                        </Group>
                      </Group>
                    </Card>
                  ))}
              </Stack>
            </div>
          )}
        </Stack>
      )}

      {!isPremium && (
        <Alert
          icon={<Crown size={16} />}
          title="Join Review Fast Track for More Reviews"
          color="blue"
          mb="xl"
        >
          Review Fast Track members get 3x faster reviews and priority access to
          review assignments. Join now to unlock unlimited review opportunities!
          <Button
            variant="light"
            size="sm"
            mt="sm"
            leftSection={<Crown size={14} />}
            onClick={() => navigate("/upgrade")}
          >
            Join Review Fast Track
          </Button>
        </Alert>
      )}

      {/* Review Submission Modal */}
      <Modal
        opened={submissionModalOpen}
        onClose={() => setSubmissionModalOpen(false)}
        title="Submit Review"
        size="lg"
        radius="lg"
        shadow="xl"
      >
        {selectedAssignment && (
          <form onSubmit={submissionForm.onSubmit(handleSubmitReview)}>
            <Stack gap="lg">
              <Card withBorder p="lg" radius="md">
                <Group>
                  <Avatar
                    src={selectedAssignment.extension?.logo_url}
                    size="md"
                    radius="md"
                  />
                  <div>
                    <Text fw={600}>
                      {selectedAssignment.extension?.name ||
                        "Unknown Extension"}
                    </Text>
                  </div>
                </Group>
              </Card>

              <DatePickerInput
                label="Review Submission Date"
                placeholder="Select the date you submitted the review"
                value={submissionForm.values.submitted_date}
                onChange={(value) =>
                  submissionForm.setFieldValue(
                    "submitted_date",
                    value || new Date(),
                  )
                }
                required
                radius="md"
                maxDate={new Date()}
                description="When did you submit this review to the Chrome Web Store?"
              />

              <div>
                <Text fw={500} mb="xs">
                  Rating
                </Text>
                <Rating
                  value={submissionForm.values.rating}
                  onChange={(value) =>
                    submissionForm.setFieldValue("rating", value)
                  }
                  size="lg"
                />
              </div>

              <Textarea
                label="Review Text"
                placeholder="Write your detailed review here... (minimum 25 characters)"
                required
                rows={6}
                radius="md"
                {...submissionForm.getInputProps("review_text")}
              />

              <Checkbox
                label="I confirm this review was submitted to the Google Chrome Web Store"
                required
                {...submissionForm.getInputProps("confirmed_submission", {
                  type: "checkbox",
                })}
              />

              <Alert icon={<CheckCircle size={16} />} color="blue" radius="md">
                Make sure your review follows Chrome Web Store guidelines and
                provides genuine feedback about the extension.
              </Alert>

              <Group justify="flex-end" gap="md" pt="md">
                <Button
                  variant="light"
                  onClick={() => setSubmissionModalOpen(false)}
                  radius="md"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  leftSection={<Upload size={16} />}
                  radius="md"
                >
                  Submit Review
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

      {/* Review Details Modal */}
      <Modal
        opened={reviewDetailsModalOpen}
        onClose={() => setReviewDetailsModalOpen(false)}
        title="Review Details"
        size="lg"
        radius="lg"
        shadow="xl"
      >
        {selectedReviewAssignment && (
          <Stack gap="lg">
            <Card withBorder p="lg" radius="md">
              <Group>
                <Avatar
                  src={selectedReviewAssignment.extension?.logo_url}
                  size="md"
                  radius="md"
                />
                <div>
                  <Text fw={600}>
                    {selectedReviewAssignment.extension?.name ||
                      "Unknown Extension"}
                  </Text>
                </div>
              </Group>
            </Card>
            <Text size="sm" c="dimmed">
              Submitted:{" "}
              {selectedReviewAssignment.submitted_at
                ? new Date(
                    selectedReviewAssignment.submitted_at,
                  ).toLocaleString()
                : "Unknown"}
            </Text>
            <div>
              <Text fw={500} mb="xs">
                Rating
              </Text>
              <Rating
                value={selectedReviewAssignment.rating || 0}
                readOnly
                size="lg"
              />
            </div>
            <Textarea
              label="Review Text"
              value={selectedReviewAssignment.review_text || ""}
              readOnly
              minRows={4}
              radius="md"
            />
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
