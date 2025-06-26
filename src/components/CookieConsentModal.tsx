import React from 'react'
import {
  Modal,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Card,
  Divider,
  List,
  ThemeIcon,
  Box
} from '@mantine/core'
import { Shield, CheckCircle, AlertTriangle, Cookie } from 'lucide-react'

interface CookieConsentModalProps {
  opened: boolean
  onAccept: () => void
  onDecline: () => void
}

export function CookieConsentModal({ opened, onAccept, onDecline }: CookieConsentModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={() => {}} // Prevent closing without making a choice
      title=""
      size="lg"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      styles={{
        content: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none'
        },
        header: {
          background: 'transparent',
          borderBottom: 'none'
        }
      }}
    >
      <Box p="md">
        <Card 
          shadow="xl" 
          radius="lg" 
          p="xl"
          style={{ 
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Stack gap="xl">
            {/* Header */}
            <Stack align="center" gap="md">
              <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'purple' }}>
                <Cookie size={30} />
              </ThemeIcon>
              
              <Title order={2} ta="center" c="dark.8" size="1.5rem">
                Cookie Preferences
              </Title>
              
              <Text size="md" ta="center" c="dimmed" lh={1.6}>
                We use cookies to enhance your experience and improve our service. 
                Please choose your preference below.
              </Text>
            </Stack>

            <Divider />

            {/* Cookie Information */}
            <Stack gap="md">
              <Title order={3} size="1.1rem" c="dark.8">
                How We Use Cookies
              </Title>
              
              <List
                spacing="sm"
                size="sm"
                icon={
                  <ThemeIcon color="blue" size={20} radius="xl">
                    <CheckCircle size={12} />
                  </ThemeIcon>
                }
              >
                <List.Item>
                  <Text size="sm">
                    <strong>Essential Cookies:</strong> Required for basic website functionality, 
                    user authentication, and security
                  </Text>
                </List.Item>
                <List.Item>
                  <Text size="sm">
                    <strong>Analytics Cookies:</strong> Help us understand how you use our service 
                    to improve performance and user experience
                  </Text>
                </List.Item>
                <List.Item>
                  <Text size="sm">
                    <strong>Preference Cookies:</strong> Remember your settings and preferences 
                    for a personalized experience
                  </Text>
                </List.Item>
              </List>
            </Stack>

            <Divider />

            {/* Privacy Information */}
            <Card withBorder p="md" bg="blue.0">
              <Group gap="md" align="flex-start">
                <ThemeIcon color="blue" size={30} radius="xl">
                  <Shield size={16} />
                </ThemeIcon>
                <Stack gap="xs" flex={1}>
                  <Text fw={600} size="sm">Your Privacy Matters</Text>
                  <Text size="xs" c="dimmed" lh={1.4}>
                    We respect your privacy and are committed to protecting your personal data. 
                    You can change your cookie preferences at any time in your account settings.
                  </Text>
                </Stack>
              </Group>
            </Card>

            {/* Important Note */}
            <Card withBorder p="md" bg="orange.0">
              <Group gap="md" align="flex-start">
                <ThemeIcon color="orange" size={30} radius="xl">
                  <AlertTriangle size={16} />
                </ThemeIcon>
                <Stack gap="xs" flex={1}>
                  <Text fw={600} size="sm">Important Note</Text>
                  <Text size="xs" c="dimmed" lh={1.4}>
                    Declining cookies may limit some features of our service. Essential cookies 
                    will still be used for basic functionality and security.
                  </Text>
                </Stack>
              </Group>
            </Card>

            {/* Privacy Policy Link */}
            <Text size="xs" c="dimmed" ta="center">
              For more information about how we handle your data, please read our{' '}
              <Text 
                component="a" 
                href="/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                c="blue.6" 
                fw={600}
                style={{ textDecoration: 'none' }}
                className="hover:underline"
              >
                Privacy Policy
              </Text>
              .
            </Text>

            {/* Action Buttons */}
            <Group justify="center" gap="md" pt="md">
              <Button 
                variant="light" 
                size="lg"
                onClick={onDecline}
                styles={{
                  root: {
                    minWidth: '140px'
                  }
                }}
              >
                Decline Optional
              </Button>
              
              <Button 
                size="lg" 
                onClick={onAccept}
                styles={{
                  root: {
                    background: 'linear-gradient(45deg, #10b981, #059669)',
                    minWidth: '140px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                    }
                  }
                }}
              >
                Accept All
              </Button>
            </Group>

            <Text size="xs" c="dimmed" ta="center" style={{ fontStyle: 'italic' }}>
              You can update your cookie preferences anytime in your account settings
            </Text>
          </Stack>
        </Card>
      </Box>
    </Modal>
  )
}