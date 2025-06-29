import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Card,
  Group,
  Badge,
  List,
  ThemeIcon,
  Box,
  Progress
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { 
  CheckCircle, 
  Star, 
  Shield, 
  Users, 
  Package,
  ArrowRight,
  Sparkles,
  Plus,
  SkipForward
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AddExtensionModal } from '../components/AddExtensionModal'
import type { Database } from '../types/database'

type Extension = Database['public']['Tables']['extensions']['Row']

export function OnboardingPage() {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<'welcome' | 'add-extension'>('welcome')
  const [extensionModalOpen, setExtensionModalOpen] = useState(false)

  const handleContinueToExtensionStep = () => {
    setCurrentStep('add-extension')
  }

  const handleAddExtension = () => {
    setExtensionModalOpen(true)
  }

  const handleSkipExtension = async () => {
    setLoading(true)
    try {
      await updateProfile({ onboarding_complete: true })
      notifications.show({
        title: 'Setup Complete!',
        message: 'You can add your extensions later from your dashboard. Next, complete your reviewer qualification.',
        color: 'green',
        icon: <Sparkles size={16} />
      })
      navigate('/qualification')
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to complete onboarding',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExtensionSuccess = async (extension: Extension) => {
    setExtensionModalOpen(false)
    
    // Complete onboarding
    try {
      await updateProfile({ onboarding_complete: true })
      notifications.show({
        title: 'Extension Added Successfully!',
        message: 'Great! You can submit it to the review queue to get authentic reviews. Next, complete your reviewer qualification.',
        color: 'green',
        icon: <Package size={16} />
      })
      navigate('/qualification')
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to complete onboarding',
        color: 'red'
      })
    }
  }

  const features = [
    {
      icon: Package,
      title: 'Add Your Extensions',
      description: 'Upload your Chrome extensions to our secure library and manage them easily.'
    },
    {
      icon: Star,
      title: 'Get Authentic Reviews',
      description: 'Receive genuine reviews from fellow developers who understand Chrome extensions.'
    },
    {
      icon: Users,
      title: 'Review Others',
      description: 'Help other developers by reviewing their extensions and earn credits.'
    },
    {
      icon: Shield,
      title: '100% Policy Compliant',
      description: 'All reviews follow Chrome Web Store policies - no risk to your account.'
    }
  ]

  const steps = [
    'Create your developer profile',
    'Add your first Chrome extension',
    'Complete reviewer qualification',
    'Start exchanging reviews with the community'
  ]

  const getProgressValue = () => {
    if (currentStep === 'welcome') return 25
    if (currentStep === 'add-extension') return 50
    return 25
  }

  const getProgressText = () => {
    if (currentStep === 'welcome') return '1 of 4 steps'
    if (currentStep === 'add-extension') return '2 of 4 steps'
    return '1 of 4 steps'
  }

  // FORCE ONBOARDING COLORS WITH JAVASCRIPT
  useEffect(() => {
    const forceOnboardingColors = () => {
      console.log('🎨 FORCING ONBOARDING COLORS - JavaScript is running!');
      
      // Force progress bar to be more vibrant
      const progressBars = document.querySelectorAll('.mantine-Progress-bar');
      console.log('Found Onboarding progress bars:', progressBars.length);
      
      progressBars.forEach((bar) => {
        if (bar instanceof HTMLElement) {
          console.log('Setting BRIGHT GRADIENT for progress bar');
          bar.style.background = 'linear-gradient(90deg, #3b82f6, #8b5cf6)';
          bar.style.setProperty('background', 'linear-gradient(90deg, #3b82f6, #8b5cf6)', 'important');
        }
      });

      // Force badges to be more vibrant
      const badges = document.querySelectorAll('.mantine-Badge-root');
      badges.forEach((badge) => {
        if (badge instanceof HTMLElement && badge.textContent?.includes('Welcome')) {
          console.log('Setting BRIGHT BLUE for Welcome badge');
          badge.style.backgroundColor = '#2563eb';
          badge.style.color = '#ffffff';
          badge.style.setProperty('background-color', '#2563eb', 'important');
          badge.style.setProperty('color', '#ffffff', 'important');
        }
      });

      // Force ThemeIcon elements to be more vibrant
      const themeIcons = document.querySelectorAll('.mantine-ThemeIcon-root');
      console.log('Found Onboarding theme icons:', themeIcons.length);
      
      themeIcons.forEach((icon, index) => {
        if (icon instanceof HTMLElement) {
          const colors = ['#2563eb', '#059669', '#f59e0b', '#8b5cf6', '#06b6d4'];
          const color = colors[index % colors.length];
          console.log(`Setting vibrant color ${color} for icon ${index}`);
          icon.style.backgroundColor = color;
          icon.style.setProperty('background-color', color, 'important');
        }
      });

      // Force any star icons to be bright yellow
      const starIcons = document.querySelectorAll('svg[data-icon="star"]');
      starIcons.forEach((star) => {
        if (star instanceof SVGElement) {
          star.style.color = '#fbbf24';
          star.style.setProperty('color', '#fbbf24', 'important');
        }
      });
    };

    // Run immediately and also with a small delay to ensure DOM is ready
    forceOnboardingColors();
    const timeout = setTimeout(forceOnboardingColors, 100);
    
    return () => clearTimeout(timeout);
  }, [currentStep]);

  return (
    <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" mih="100vh">
      <Container size="md" py={60}>
        <Stack align="center" gap="xl">
          {/* Logo */}
          <Group mb="xl">
            <img 
              src="https://i.imgur.com/PL0Syo1.png" 
              alt="ChromeExDev Logo" 
              style={{ width: 200, height: 'auto' }}
            />
          </Group>

          {currentStep === 'welcome' && (
            <>
              {/* Welcome Card */}
              <Card 
                shadow="xl" 
                radius="lg" 
                p="xl" 
                maw={600}
                style={{ 
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Stack align="center" gap="lg">
                  <Badge size="lg" variant="light" color="blue">
                    Welcome to the Community
                  </Badge>
                  
                  <Title order={1} ta="center" c="dark.8">
                    Welcome, {profile?.name}! 🎉
                  </Title>
                  
                  <Text size="lg" ta="center" c="dimmed" lh={1.6}>
                    You're now part of an exclusive community of Chrome extension developers 
                    who help each other grow through authentic review exchanges.
                  </Text>

                  {/* Progress */}
                  <Box w="100%">
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={600}>Setup Progress</Text>
                      <Text size="sm" c="dimmed">{getProgressText()}</Text>
                    </Group>
                    <Progress value={getProgressValue()} size="lg" radius="xl" />
                  </Box>
                </Stack>
              </Card>

              {/* How It Works */}
              <Card 
                shadow="lg" 
                radius="lg" 
                p="xl" 
                maw={600}
                style={{ 
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Stack gap="lg">
                  <Title order={2} ta="center" c="dark.8">
                    How ChromeExDev.reviews Works
                  </Title>
                  
                  <List
                    spacing="md"
                    size="md"
                    center
                    icon={
                      <ThemeIcon color="blue" size={24} radius="xl">
                        <CheckCircle size={16} />
                      </ThemeIcon>
                    }
                  >
                    {steps.map((step, index) => (
                      <List.Item key={index}>
                        <Text fw={500}>{step}</Text>
                      </List.Item>
                    ))}
                  </List>
                </Stack>
              </Card>

              {/* Features Grid */}
              <Card 
                shadow="lg" 
                radius="lg" 
                p="xl" 
                maw={600}
                style={{ 
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Stack gap="lg">
                  <Title order={2} ta="center" c="dark.8">
                    What You Get Access To
                  </Title>
                  
                  <Stack gap="md">
                    {features.map((feature, index) => (
                      <Group key={index} align="flex-start" gap="md">
                        <ThemeIcon color="blue" size={40} radius="xl">
                          <feature.icon size={20} />
                        </ThemeIcon>
                        <Stack gap={4} flex={1}>
                          <Text fw={600} size="md">{feature.title}</Text>
                          <Text size="sm" c="dimmed" lh={1.4}>
                            {feature.description}
                          </Text>
                        </Stack>
                      </Group>
                    ))}
                  </Stack>
                </Stack>
              </Card>

              {/* CTA */}
              <Card 
                shadow="lg" 
                radius="lg" 
                p="xl" 
                maw={600}
                style={{ 
                  background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                  color: 'white'
                }}
              >
                <Stack align="center" gap="lg">
                  <Title order={2} ta="center" c="white">
                    Ready to Get Started?
                  </Title>
                  
                  <Text ta="center" c="rgba(255,255,255,0.9)" lh={1.6}>
                    Complete your setup to join our community of developers who are 
                    growing their Chrome extensions through authentic reviews.
                  </Text>
                  
                  <Button 
                    size="xl" 
                    variant="white"
                    color="dark"
                    radius="md"
                    rightSection={<ArrowRight size={20} />}
                    onClick={handleContinueToExtensionStep}
                    styles={{
                      root: {
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        padding: '16px 32px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                        }
                      }
                    }}
                  >
                    Continue Setup
                  </Button>
                  
                  <Group gap="xl" c="rgba(255,255,255,0.8)">
                    <Text size="sm">✓ Free to Start</Text>
                    <Text size="sm">✓ 1 Welcome Credit</Text>
                    <Text size="sm">✓ Quick Qualification</Text>
                  </Group>
                </Stack>
              </Card>
            </>
          )}

          {currentStep === 'add-extension' && (
            <>
              {/* Progress Card */}
              <Card 
                shadow="xl" 
                radius="lg" 
                p="xl" 
                maw={600}
                style={{ 
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Stack align="center" gap="lg">
                  <Badge size="lg" variant="light" color="green">
                    Add Your First Extension
                  </Badge>
                  
                  <Title order={1} ta="center" c="dark.8">
                    Let's Add Your Extension! 🚀
                  </Title>
                  
                  <Text size="lg" ta="center" c="dimmed" lh={1.6}>
                    Adding your first extension now gets you ready 
                    to start receiving authentic reviews from fellow developers immediately.
                  </Text>

                  {/* Progress */}
                  <Box w="100%">
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={600}>Setup Progress</Text>
                      <Text size="sm" c="dimmed">{getProgressText()}</Text>
                    </Group>
                    <Progress value={getProgressValue()} size="lg" radius="xl" />
                  </Box>
                </Stack>
              </Card>

              {/* Add Extension Options */}
              <Card 
                shadow="lg" 
                radius="lg" 
                p="xl" 
                maw={600}
                style={{ 
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Stack gap="xl">
                  <Stack align="center" gap="md">
                    <Package size={48} color="#2196f3" />
                    <Title order={2} ta="center" c="dark.8">
                      Add Your Chrome Extension
                    </Title>
                    <Text ta="center" c="dimmed" lh={1.6}>
                      Get started by adding your first Chrome extension to our platform. 
                      You can submit it to the review queue right away from your dashboard to get authentic reviews.
                    </Text>
                  </Stack>

                  <Group justify="center" gap="md">
                    <Button 
                      size="lg" 
                      leftSection={<Plus size={20} />}
                      onClick={handleAddExtension}
                      styles={{
                        root: {
                          background: 'linear-gradient(45deg, #10b981, #059669)',
                          fontSize: '1rem',
                          fontWeight: 600,
                          padding: '12px 24px',
                          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                          }
                        }
                      }}
                    >
                      Add My First Extension
                    </Button>

                    <Button 
                      size="lg" 
                      variant="light"
                      leftSection={<SkipForward size={20} />}
                      onClick={handleSkipExtension}
                      loading={loading}
                      styles={{
                        root: {
                          fontSize: '1rem',
                          fontWeight: 600,
                          padding: '12px 24px'
                        }
                      }}
                    >
                      Skip for Now
                    </Button>
                  </Group>

                  <Text size="sm" c="dimmed" ta="center">
                    Don't worry - you can always add extensions later from your dashboard if you skip this step.
                  </Text>
                </Stack>
              </Card>
            </>
          )}

          <AddExtensionModal
            opened={extensionModalOpen}
            onClose={() => setExtensionModalOpen(false)}
            onSuccess={handleExtensionSuccess}
          />
        </Stack>
      </Container>
    </Box>
  )
}