import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Title,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Table,
  Grid,
  Avatar,
  Divider,
  Modal,
  NumberInput,
  Select,
  Switch,
  Alert,
  ActionIcon,
  Tooltip,
  Box,
  Tabs,
  Textarea,
  Checkbox
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  ArrowLeft,
  User,
  Package,
  Star,
  CreditCard,
  Edit,
  ExternalLink,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Mail,
  Shield,
  Send
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type User = Database['public']['Tables']['users']['Row']
type Extension = Database['public']['Tables']['extensions']['Row']
type ReviewAssignment = Database['public']['Tables']['review_assignments']['Row']
type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row']
type ReviewRelationship = Database['public']['Tables']['review_relationships']['Row']

interface ExtensionWithDetails extends Extension {
  // Extension already has all needed fields
}

interface ReviewAssignmentWithExtension extends ReviewAssignment {
  extension?: Extension | null
}

interface ReviewRelationshipWithDetails extends ReviewRelationship {
  extension?: Extension | null
  reviewed_owner?: User | null
}

interface UserProfileData {
  user: User | null
  extensions: ExtensionWithDetails[]
  reviewAssignments: ReviewAssignmentWithExtension[]
  creditTransactions: CreditTransaction[]
  reviewRelationships: ReviewRelationshipWithDetails[]
  stats: {
    totalExtensions: number
    totalReviews: number
    activeReviews: number
    totalCreditsEarned: number
    totalCreditsSpent: number
    currentBalance: number
  }
}

export function AdminUserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserProfileData | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>('overview')

  const editForm = useForm({
    initialValues: {
      credit_balance: 0,
      role: 'user' as 'admin' | 'moderator' | 'user',
      has_completed_qualification: false
    }
  })

  const messageForm = useForm({
    initialValues: {
      subject: '',
      message: '',
      priority: 'normal' as 'normal' | 'high' | 'urgent',
      popup_on_login: false
    },
    validate: {
      subject: (value) => (value.trim() ? null : 'Subject is required'),
      message: (value) => (value.trim() ? null : 'Message is required')
    }
  })

  useEffect(() => {
    if (userId && profile?.role === 'admin') {
      fetchUserProfileData()
    }
  }, [userId, profile?.role])

  const fetchUserProfileData = async () => {
    try {
      setLoading(true)
      console.log('Fetching user profile data via Edge Function...')
      
      const { data, error } = await supabase.functions.invoke('fetch-user-profile-data', {
        body: { userId }
      })

      if (error) {
        console.error('Edge function error:', error)
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch user profile data')
      }

      setUserData(data.data)
      console.log('User profile data fetch completed successfully')

    } catch (error) {
      console.error('Error fetching user profile data:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load user profile data. Please try again.',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = () => {
    if (!userData?.user) return
    
    editForm.setValues({
      credit_balance: userData.user.credit_balance,
      role: userData.user.role,
      has_completed_qualification: userData.user.has_completed_qualification
    })
    setEditModalOpen(true)
  }

  const handleSendMessage = () => {
    messageForm.reset()
    setMessageModalOpen(true)
  }

  const handleSubmitMessage = async (values: typeof messageForm.values) => {
    if (!userData?.user) return

    try {
      setSendingMessage(true)
      console.log('📤 Sending admin message with admin key authentication...')
      
      // Use admin key authentication - no JWT needed
      const { data, error } = await supabase.functions.invoke('admin-send-message', {
        body: {
          recipient_id: userData.user.id,
          subject: values.subject.trim(),
          message: values.message.trim(),
          priority: values.priority,
          popup_on_login: values.popup_on_login,
          admin_key: 'chrome_ex_dev_admin_2025'
        }
      })

      if (error) {
        console.log('Edge Function error details:', error)
        throw error
      }

      if (!data?.success) {
        console.log('Edge Function response:', data)
        throw new Error(data?.error || 'Failed to send message')
      }

      notifications.show({
        title: 'Message Sent',
        message: `Message sent successfully to ${userData.user.name || userData.user.email}`,
        color: 'green'
      })

      setMessageModalOpen(false)
      messageForm.reset()
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to send message',
        color: 'red'
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleUpdateUser = async (values: typeof editForm.values) => {
    if (!userData?.user) return

    try {
      console.log('Updating user profile via Edge Function...')
      
      const { data, error } = await supabase.functions.invoke('update-user-profile-admin', {
        body: {
          userId: userData.user.id,
          updates: {
            credit_balance: values.credit_balance,
            role: values.role,
            has_completed_qualification: values.has_completed_qualification
          },
          current_credit_balance: userData.user.credit_balance
        }
      })

      if (error) throw error

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to update user profile')
      }

      notifications.show({
        title: 'Success',
        message: data.message || 'User updated successfully',
        color: 'green'
      })

      setEditModalOpen(false)
      editForm.reset()
      fetchUserProfileData()
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update user profile',
        color: 'red'
      })
    }
  }

  const getStatusColor = (status: Extension['status']) => {
    switch (status) {
      case 'verified': return 'green'
      case 'library': return 'green'
      case 'queued': return 'blue'
      case 'assigned': return 'purple'
      case 'reviewed': return 'orange'
      case 'completed': return 'green'
      case 'rejected': return 'red'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status: Extension['status']) => {
    switch (status) {
      case 'verified': 
      case 'library': return 'In Library'
      case 'queued': return 'In Review Queue'
      case 'assigned': return 'Selected for Review'
      case 'reviewed': return 'Review Submitted'
      case 'completed': return 'Completed'
      case 'rejected': return 'Rejected'
      default: return 'Unknown'
    }
  }

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'red'
      case 'moderator': return 'blue'
      default: return 'gray'
    }
  }

  // FORCE ADMIN USER PROFILE COLORS WITH JAVASCRIPT
  useEffect(() => {
    const forceAdminUserProfileColors = () => {
      console.log('🎨 FORCING ADMIN USER PROFILE COLORS - JavaScript is running!');
      
      // Force main stats cards to be more vibrant
      const statsCards = document.querySelectorAll('.mantine-Card-root');
      console.log('Found Admin User Profile cards:', statsCards.length);
      
      statsCards.forEach((card) => {
        if (card instanceof HTMLElement) {
          const titleElement = card.querySelector('div[class*="c-dimmed"]') as HTMLElement;
          const numberElement = card.querySelector('div[class*="xl"][class*="fw-700"]') as HTMLElement;
          const iconElement = card.querySelector('svg') as SVGElement;
          
          if (titleElement && numberElement) {
            const title = titleElement.textContent?.trim();
            console.log('Processing admin user profile card:', title);
            
            switch (title) {
              case 'Extensions':
                console.log('Setting CYAN color for Extensions');
                numberElement.style.color = '#06b6d4';
                numberElement.style.setProperty('color', '#06b6d4', 'important');
                if (iconElement) iconElement.style.color = '#06b6d4';
                break;
              case 'Reviews Completed':
                console.log('Setting PURPLE color for Reviews Completed');
                numberElement.style.color = '#8b5cf6';
                numberElement.style.setProperty('color', '#8b5cf6', 'important');
                if (iconElement) iconElement.style.color = '#8b5cf6';
                break;
              case 'Active Reviews':
                console.log('Setting BRIGHT BLUE color for Active Reviews');
                numberElement.style.color = '#2563eb';
                numberElement.style.setProperty('color', '#2563eb', 'important');
                if (iconElement) iconElement.style.color = '#2563eb';
                break;
              case 'Credits Earned':
                console.log('Setting BRIGHT GREEN color for Credits Earned');
                numberElement.style.color = '#059669';
                numberElement.style.setProperty('color', '#059669', 'important');
                if (iconElement) iconElement.style.color = '#059669';
                break;
              case 'Credits Spent':
                console.log('Setting BRIGHT ORANGE color for Credits Spent');
                numberElement.style.color = '#ea580c';
                numberElement.style.setProperty('color', '#ea580c', 'important');
                if (iconElement) iconElement.style.color = '#ea580c';
                break;
              case 'Current Balance':
                console.log('Setting BRIGHT BLUE color for Current Balance');
                numberElement.style.color = '#2563eb';
                numberElement.style.setProperty('color', '#2563eb', 'important');
                if (iconElement) iconElement.style.color = '#2563eb';
                break;
            }
          }
        }
      });

      // Force user badges to be more vibrant
      const badges = document.querySelectorAll('.mantine-Badge-root');
      badges.forEach((badge) => {
        if (badge instanceof HTMLElement) {
          const text = badge.textContent?.trim();
          
          if (text === 'admin') {
            badge.style.backgroundColor = '#dc2626';
            badge.style.setProperty('background-color', '#dc2626', 'important');
          } else if (text === 'Qualified') {
            badge.style.backgroundColor = '#059669';
            badge.style.setProperty('background-color', '#059669', 'important');
          } else if (text === 'Premium') {
            badge.style.backgroundColor = '#7c3aed';
            badge.style.setProperty('background-color', '#7c3aed', 'important');
          }
        }
      });
    };

    // Run immediately and also with a small delay to ensure DOM is ready
    forceAdminUserProfileColors();
    const timeout = setTimeout(forceAdminUserProfileColors, 100);
    
    return () => clearTimeout(timeout);
  }, [userData]);

  if (profile?.role !== 'admin') {
    return (
      <Container size="md">
        <Alert
          icon={<Shield size={16} />}
          title="Access Denied"
          color="red"
        >
          You don't have permission to access user profiles.
        </Alert>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container size="lg">
        <Text>Loading user profile...</Text>
      </Container>
    )
  }

  if (!userData?.user) {
    return (
      <Container size="md">
        <Alert
          icon={<AlertTriangle size={16} />}
          title="User Not Found"
          color="orange"
        >
          The requested user profile could not be found.
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Group>
          <ActionIcon
            variant="light"
            size="lg"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Title order={1}>User Profile</Title>
            <Text c="dimmed" size="lg">
              Comprehensive view of {userData.user.name || 'this user'}'s account
            </Text>
          </div>
        </Group>
        <Group>
          <Button
            variant="light"
            leftSection={<Send size={16} />}
            onClick={handleSendMessage}
          >
            Send Message
          </Button>
          <Button
            leftSection={<Edit size={16} />}
            onClick={handleEditUser}
          >
            Edit User
          </Button>
        </Group>
      </Group>

      {/* User Header Card */}
      <Card withBorder mb="xl" p="xl">
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Group align="flex-start">
              <Avatar size="xl" radius="md">
                <User size={32} />
              </Avatar>
              <Stack gap="xs">
                <Group gap="md">
                  <Title order={2}>{userData.user.name || 'No name'}</Title>
                  <Badge color={getRoleColor(userData.user.role)} size="lg">
                    {userData.user.role}
                  </Badge>
                  <Badge 
                    color={userData.user.has_completed_qualification ? 'green' : 'yellow'}
                    size="lg"
                  >
                    {userData.user.has_completed_qualification ? 'Qualified' : 'Pending'}
                  </Badge>
                  <Badge 
                    color={userData.user.subscription_status === 'premium' ? 'green' : 'blue'}
                  >
                    {userData.user.subscription_status === 'premium' ? 'Premium' : 'Free'}
                  </Badge>
                </Group>
                <Group gap="md">
                  <Group gap="xs">
                    <Mail size={16} />
                    <Text size="sm" c="dimmed">{userData.user.email}</Text>
                  </Group>
                  <Group gap="xs">
                    <Calendar size={16} />
                    <Text size="sm" c="dimmed">
                      Joined {new Date(userData.user.created_at).toLocaleDateString()}
                    </Text>
                  </Group>
                </Group>
                <Group gap="xs">
                  <CreditCard size={16} />
                  <Text size="sm" fw={600}>
                    {userData.user.credit_balance} Credits Available
                  </Text>
                </Group>
              </Stack>
            </Group>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Card withBorder p="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">Extensions</Text>
                  <Package size={16} />
                </Group>
                <Text size="xl" fw={700}>{userData.stats.totalExtensions}</Text>
              </Card>
              <Card withBorder p="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">Reviews Completed</Text>
                  <Star size={16} />
                </Group>
                <Text size="xl" fw={700}>{userData.stats.totalReviews}</Text>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </Card>

      {/* Stats Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Card withBorder p="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Active Reviews</Text>
              <Clock size={16} />
            </Group>
            <Text size="xl" fw={700} c={userData.stats.activeReviews > 0 ? 'blue' : 'gray'}>
              {userData.stats.activeReviews}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Card withBorder p="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Credits Earned</Text>
              <TrendingUp size={16} />
            </Group>
            <Text size="xl" fw={700} c="green">
              {userData.stats.totalCreditsEarned}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Card withBorder p="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Credits Spent</Text>
              <CreditCard size={16} />
            </Group>
            <Text size="xl" fw={700} c="orange">
              {userData.stats.totalCreditsSpent}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Card withBorder p="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Current Balance</Text>
              <Award size={16} />
            </Group>
            <Text size="xl" fw={700} c="blue">
              {userData.stats.currentBalance}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Detailed Information Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<User size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="extensions" leftSection={<Package size={16} />}>
            Extensions ({userData.extensions.length})
          </Tabs.Tab>
          <Tabs.Tab value="reviews" leftSection={<Star size={16} />}>
            Review Assignments ({userData.reviewAssignments.length})
          </Tabs.Tab>
          <Tabs.Tab value="transactions" leftSection={<CreditCard size={16} />}>
            Credit History ({userData.creditTransactions.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder>
                <Title order={3} mb="md">Recent Extensions</Title>
                <Stack gap="sm">
                  {userData.extensions.slice(0, 5).map((extension) => (
                    <Group key={extension.id} justify="space-between">
                      <Group>
                        <Avatar size="sm" src={extension.logo_url} />
                        <div>
                          <Text fw={500} size="sm">{extension.name}</Text>
                          <Badge color={getStatusColor(extension.status)} size="xs">
                            {getStatusLabel(extension.status)}
                          </Badge>
                        </div>
                      </Group>
                      <ActionIcon
                        variant="light"
                        size="sm"
                        onClick={() => window.open(extension.chrome_store_url, '_blank')}
                      >
                        <ExternalLink size={14} />
                      </ActionIcon>
                    </Group>
                  ))}
                  {userData.extensions.length === 0 && (
                    <Text size="sm" c="dimmed">No extensions yet</Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder>
                <Title order={3} mb="md">Recent Review Activity</Title>
                <Stack gap="sm">
                  {userData.reviewAssignments.slice(0, 5).map((assignment) => (
                    <Group key={assignment.id} justify="space-between">
                      <div>
                        <Text fw={500} size="sm">
                          #{assignment.assignment_number}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {assignment.extension?.name || 'Unknown Extension'}
                        </Text>
                      </div>
                      <Badge 
                        color={assignment.status === 'assigned' ? 'blue' : 'green'} 
                        size="xs"
                      >
                        {assignment.status === 'assigned' ? 'In Progress' : 'Completed'}
                      </Badge>
                    </Group>
                  ))}
                  {userData.reviewAssignments.length === 0 && (
                    <Text size="sm" c="dimmed">No review assignments yet</Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="extensions" pt="md">
          <Card withBorder>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Extension</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {userData.extensions.map((extension) => (
                  <Table.Tr key={extension.id}>
                    <Table.Td>
                      <Group>
                        <Avatar size="sm" src={extension.logo_url} />
                        <div>
                          <Text fw={500}>{extension.name}</Text>
                          <Text size="sm" c="dimmed" truncate maw={200}>
                            {extension.description}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(extension.status)} size="sm">
                        {getStatusLabel(extension.status)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {extension.category?.join(', ') || 'No category'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(extension.created_at).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="light"
                        size="sm"
                        onClick={() => window.open(extension.chrome_store_url, '_blank')}
                      >
                        <ExternalLink size={14} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {userData.extensions.length === 0 && (
              <Box p="md">
                <Text size="sm" c="dimmed" ta="center">
                  This user hasn't added any extensions yet.
                </Text>
              </Box>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="reviews" pt="md">
          <Card withBorder>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Assignment</Table.Th>
                  <Table.Th>Extension</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Rating</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {userData.reviewAssignments.map((assignment) => (
                  <Table.Tr key={assignment.id}>
                    <Table.Td>
                      <Text fw={500}>#{assignment.assignment_number}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group>
                        <Avatar size="sm" src={assignment.extension?.logo_url} />
                        <Text size="sm">{assignment.extension?.name || 'Unknown'}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={assignment.status === 'assigned' ? 'blue' : 'green'} 
                        size="sm"
                      >
                        {assignment.status === 'assigned' ? 'In Progress' : 'Completed'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {assignment.rating ? (
                        <Group gap="xs">
                          {[...Array(assignment.rating)].map((_, i) => (
                            <Star key={i} size={12} fill="#ffd43b" color="#ffd43b" />
                          ))}
                        </Group>
                      ) : (
                        <Text size="sm" c="dimmed">-</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {assignment.submitted_at 
                          ? new Date(assignment.submitted_at).toLocaleDateString()
                          : new Date(assignment.assigned_at).toLocaleDateString()
                        }
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {assignment.extension?.chrome_store_url && (
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={() => window.open(assignment.extension?.chrome_store_url, '_blank')}
                        >
                          <ExternalLink size={14} />
                        </ActionIcon>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {userData.reviewAssignments.length === 0 && (
              <Box p="md">
                <Text size="sm" c="dimmed" ta="center">
                  This user hasn't received any review assignments yet.
                </Text>
              </Box>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="transactions" pt="md">
          <Card withBorder>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {userData.creditTransactions.map((transaction) => (
                  <Table.Tr key={transaction.id}>
                    <Table.Td>
                      <Text 
                        fw={600} 
                        c={transaction.type === 'earned' ? 'green' : 'red'}
                      >
                        {transaction.type === 'earned' ? '+' : '-'}{Math.abs(transaction.amount)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={transaction.type === 'earned' ? 'green' : 'red'} 
                        size="sm"
                      >
                        {transaction.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" truncate maw={300}>
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
            {userData.creditTransactions.length === 0 && (
              <Box p="md">
                <Text size="sm" c="dimmed" ta="center">
                  No credit transactions found for this user.
                </Text>
              </Box>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Edit User Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User"
        size="md"
      >
        <form onSubmit={editForm.onSubmit(handleUpdateUser)}>
          <Stack>
            <Card withBorder p="md" mb="md">
              <div>
                <Text fw={600}>{userData.user.name}</Text>
                <Text size="sm" c="dimmed">{userData.user.email}</Text>
                <Text size="xs" c="dimmed">
                  Joined: {new Date(userData.user.created_at).toLocaleDateString()}
                </Text>
              </div>
            </Card>
            
            <NumberInput
              label="Credit Balance"
              min={0}
              {...editForm.getInputProps('credit_balance')}
            />
            
            <Select
              label="Role"
              data={[
                { value: 'user', label: 'User' },
                { value: 'moderator', label: 'Moderator' },
                { value: 'admin', label: 'Administrator' }
              ]}
              {...editForm.getInputProps('role')}
            />
            
            <Switch
              label="Has Completed Qualification"
              {...editForm.getInputProps('has_completed_qualification', { type: 'checkbox' })}
            />
            
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update User
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Send Message Modal */}
      <Modal
        opened={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        title={`Send Message to ${userData.user.name || userData.user.email}`}
        size="lg"
      >
        <form onSubmit={messageForm.onSubmit(handleSubmitMessage)}>
          <Stack>
            <Card withBorder p="md" bg="blue.0">
              <Group gap="xs">
                <Mail size={16} />
                <Text size="sm" fw={500}>
                  Sending to: {userData.user.name || userData.user.email}
                </Text>
              </Group>
            </Card>
            
            <Textarea
              label="Subject"
              placeholder="Enter message subject..."
              {...messageForm.getInputProps('subject')}
              required
            />
            
            <Textarea
              label="Message"
              placeholder="Type your message here..."
              minRows={6}
              {...messageForm.getInputProps('message')}
              required
            />
            
            <Select
              label="Priority"
              data={[
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent (Red notification)' }
              ]}
              {...messageForm.getInputProps('priority')}
            />
            
            <Checkbox
              label="Show as popup on next login"
              description="Message will appear as a popup when the user logs in"
              {...messageForm.getInputProps('popup_on_login', { type: 'checkbox' })}
            />
            
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setMessageModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={sendingMessage}
                leftSection={<Send size={16} />}
              >
                Send Message
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      
    </Container>
  )
}