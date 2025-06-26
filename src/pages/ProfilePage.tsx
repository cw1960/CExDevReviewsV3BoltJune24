import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Title,
  Card,
  TextInput,
  Button,
  Stack,
  Group,
  Text,
  Badge,
  Grid
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { User, Mail, Globe, Star, Crown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

export function ProfilePage() {
  const { profile, updateProfile } = useAuth()
  const { planName, isPremium } = useSubscription()
  const navigate = useNavigate()

  const form = useForm({
    initialValues: {
      name: profile?.name || ''
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must be at least 2 characters' : null)
    }
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await withTimeout(updateProfile(values), 5000) // 5 second timeout
      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green'
      })
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update profile',
        color: 'red'
      })
    }
  }

  return (
    <Container size="md">
      <Title order={1} mb="xl">Profile Settings</Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder p="xl" radius="lg" shadow="sm">
            <Title order={3} mb="lg">
              Personal Information
            </Title>
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="lg">
                <TextInput
                  label="Full Name"
                  placeholder="Your full name"
                  leftSection={<User size={16} />}
                  required
                  radius="md"
                  {...form.getInputProps('name')}
                />
                <TextInput
                  label="Email"
                  value={profile?.email || ''}
                  leftSection={<Mail size={16} />}
                  disabled
                  radius="md"
                  description="Email cannot be changed"
                />
                <Group justify="flex-end" pt="md">
                  <Button type="submit" radius="md">
                    Update Profile
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Card withBorder p="xl" radius="lg" shadow="sm">
              <Group justify="space-between" mb="md">
                <Text fw={700} size="lg">Account Status</Text>
                <Badge color="green">Active</Badge>
              </Group>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm">Member Since</Text>
                  <Text size="sm" c="dimmed">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Role</Text>
                  <Badge size="sm" variant="light">
                    {profile?.role || 'user'}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Qualification</Text>
                  <Badge 
                    size="sm" 
                    color={profile?.has_completed_qualification ? 'green' : 'yellow'}
                  >
                    {profile?.has_completed_qualification ? 'Completed' : 'Pending'}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Subscription</Text>
                  <Badge 
                    size="sm" 
                    color={planName === 'Premium' ? 'green' : 'blue'}
                  >
                    {planName}
                  </Badge>
                </Group>
              </Stack>
            </Card>

            <Card withBorder p="xl" radius="lg" shadow="sm">
              <Group justify="space-between" mb="md">
                <Text fw={700} size="lg">Credits</Text>
                <Star size={20} />
              </Group>
              <Text size="2.5rem" fw={800} c="blue.6">
                {profile?.credit_balance || 0}
              </Text>
              <Text size="sm" c="dimmed">
                Available credits for queue submissions
              </Text>
            </Card>

            <Card withBorder p="xl" radius="lg" shadow="sm">
              <Text fw={700} size="lg" mb="lg">Quick Actions</Text>
              <Stack gap="md">
                {!isPremium && (
                  <Button 
                    variant="gradient"
                    gradient={{ from: 'yellow', to: 'orange' }}
                    fullWidth 
                    leftSection={<Crown size={16} />}
                    onClick={() => navigate('/upgrade')}
                    radius="md"
                  >
                    Join Review Fast Track
                  </Button>
                )}
                <Button variant="light" fullWidth component="a" href="/extensions" radius="md">
                  Manage Extensions
                </Button>
                <Button variant="light" fullWidth component="a" href="/reviews" radius="md">
                  View Reviews
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  )
}