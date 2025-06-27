import React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Card,
  Grid,
  Badge,
  Avatar,
  Box,
  Center,
  Divider,
  List,
  ThemeIcon,
  Loader
} from '@mantine/core'
import { 
  Play, 
  Star, 
  TrendingUp, 
  Shield, 
  Users, 
  CheckCircle,
  ArrowRight,
  Quote,
  Lock,
  RefreshCcw,
  Code,
  DollarSign,
  XCircle,
  Zap,
  Crown
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { CookieConsentModal } from '../components/CookieConsentModal'
import { PlatformStatsPanel } from '../components/PlatformStatsPanel'

export function LandingPage() {
  const navigate = useNavigate()
  const { profile, updateCookiePreferences } = useAuth()
  const [showCookieModal, setShowCookieModal] = useState(false)

  // Check if we should show cookie consent modal
  useEffect(() => {
    // Only show for users who haven't set their cookie preferences
    // or for non-authenticated users (we'll handle this with localStorage)
    if (profile && profile.cookie_preferences === 'not_set') {
      setShowCookieModal(true)
    } else if (!profile) {
      // For non-authenticated users, check localStorage
      const hasSeenCookieConsent = localStorage.getItem('cookie_consent_shown')
      if (!hasSeenCookieConsent) {
        setShowCookieModal(true)
      }
    }
  }, [profile])

  const handleCookieAccept = async () => {
    console.log('🍪 handleCookieAccept called');
    try {
      console.log('🍪 Attempting to update cookie preferences...');
      console.log('🍪 Current profile state:', profile ? 'profile exists' : 'no profile');
      if (profile) {
        console.log('🍪 Profile exists, updating database...');
        // For authenticated users, update in database
        await updateCookiePreferences('accepted')
      } else {
        console.log('🍪 No profile, updating localStorage...');
        // For non-authenticated users, store in localStorage
        localStorage.setItem('cookie_consent_shown', 'true')
        localStorage.setItem('cookie_preference', 'accepted')
      }
      console.log('🍪 Setting showCookieModal to false (after success)');
      setShowCookieModal(false)
    } catch (error) {
      console.error('🍪 Error in handleCookieAccept:', error);
      console.error('Error updating cookie preferences:', error)
      // Still close the modal even if there's an error
      console.log('🍪 Setting showCookieModal to false (after error)');
      setShowCookieModal(false)
    }
  }

  const handleCookieDecline = async () => {
    console.log('🍪 handleCookieDecline called');
    try {
      console.log('🍪 Attempting to decline cookie preferences...');
      if (profile) {
        console.log('🍪 Profile exists, updating database with declined...');
        // For authenticated users, update in database
        await updateCookiePreferences('declined')
      } else {
        console.log('🍪 No profile, updating localStorage with declined...');
        // For non-authenticated users, store in localStorage
        localStorage.setItem('cookie_consent_shown', 'true')
        localStorage.setItem('cookie_preference', 'declined')
      }
      console.log('🍪 Setting showCookieModal to false (decline success)');
      setShowCookieModal(false)
    } catch (error) {
      console.error('🍪 Error in handleCookieDecline:', error);
      console.error('Error updating cookie preferences:', error)
      // Still close the modal even if there's an error
      console.log('🍪 Setting showCookieModal to false (decline error)');
      setShowCookieModal(false)
    }
  }

  const handleGetStarted = () => {
    navigate('/auth')
  }

  const handleLogin = () => {
    navigate('/auth');
  }

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Chrome Extension Developer",
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      content: "Went from 3 reviews to 47 reviews in just 2 weeks. My extension finally started showing up in search results and organic installs increased by 340%.",
      rating: 5,
      result: "340% increase in organic installs"
    },
    {
      name: "Marcus Rodriguez",
      role: "SaaS Founder & Extension Developer",
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      content: "The quality of reviews is incredible. These are developers who actually understand extensions, not random users. Got detailed feedback that helped improve my product too.",
      rating: 5,
      result: "47 high-quality reviews in 3 weeks"
    },
    {
      name: "Jennifer Park",
      role: "Productivity Tools Developer",
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      content: "Finally broke through the visibility barrier. My extension went from page 8 to page 1 in search results. The algorithm really does reward consistent review activity.",
      rating: 5,
      result: "Moved from page 8 to page 1 in search"
    }
  ]

  const trustBadges = [
    { icon: Shield, text: "100% Chrome Web Store Compliant" },
    { icon: Users, text: "Trusted by 2,500+ Developers" },
    { icon: CheckCircle, text: "30-Day Money-Back Guarantee" },
    { icon: Star, text: "4.9/5 Average Rating" }
  ]

  const stats = [
    { number: "2,500+", label: "Active Developers" },
    { number: "15,000+", label: "Reviews Exchanged" },
    { number: "340%", label: "Avg. Install Increase" },
    { number: "100%", label: "Policy Compliant" }
  ]

  return (
    <Box>
      {/* Hero Section */}
      <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
        <Container size="lg">
          {/* Logo Header */}
          <Group justify="space-between" mb="xl">
            <img 
              src="https://i.imgur.com/PL0Syo1.png" 
              alt="ChromeExDev Logo" 
              style={{ width: 300, height: 'auto' }}
            />
            <Group>
              <Button variant="subtle" color="white" onClick={handleLogin}>Login</Button>
            </Group>
          </Group>
          
          <Grid align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xl">
                {/*Removed Badge Component Here*/}
                <Title 
                  order={1} 
                  size="3rem" 
                  fw={800} 
                  lh={1.1} 
                  c="white"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                  Break the Zero-Review Trap! Get Steady Chrome Extension Installs, Ratings and Reviews in Days Instead of Months
                </Title>
                <Title order={2} size="1.5rem" fw={400} c="rgba(255,255,255,0.9)" lh={1.4}>
                  Stop watching your extension collect dust. Get quality reviews from fellow developers who actually understand Chrome extensions.

                </Title>
                <Button 
                  size="xl" 
                  radius="md" 
                  onClick={handleGetStarted}
                  rightSection={<ArrowRight size={20} />}
                  styles={{
                    root: {
                      background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                      border: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      padding: '16px 32px',
                      boxShadow: '0 8px 32px rgba(238, 90, 36, 0.3)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(238, 90, 36, 0.4)'
                      }
                    }
                  }}
                >
                  Start Getting Reviews Today - FREE
                </Button>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card 
                shadow="xl" 
                radius="lg" 
                p={0}
                style={{ 
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Center p="xl">
                  <Stack align="center" gap="md">
                    <Box 
                      w={80} 
                      h={80} 
                      bg="rgba(255,255,255,0.2)" 
                      style={{ borderRadius: '50%' }}
                      display="flex"
                      style={{ alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Play size={32} color="white" />
                    </Box>
                    <Text c="white" fw={600} size="lg">
                      Watch 3-Minute Demo
                    </Text>
                    <Text c="rgba(255,255,255,0.8)" size="sm" ta="center">
                      See how developers are getting 20+ reviews in their first month
                    </Text>
                  </Stack>
                </Center>
              </Card>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* Platform Stats Panel */}
      <PlatformStatsPanel />

      {/* Benefits Sections */}
      <Container size="lg" py={80}>
        <Stack gap={80}>
          {/* Section 1: Break the Visibility Barrier */}
          <Grid align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="lg">
                <Badge size="lg" variant="light" color="blue">
                  Visibility Problem Solved
                </Badge>
                <Title order={2} size="2.5rem" fw={700} c="dark.8">
                  Break the Visibility Barrier
                </Title>
                <Text size="lg" c="dimmed" lh={1.6}>
                  Instead of being buried on page 10 of search results with zero downloads... You'll get steady visibility as your review count and ratings climb, pushing your extension higher in Chrome Web Store rankings every week.
                </Text>
                <Text size="md" c="blue.6" fw={600} style={{ fontStyle: 'italic' }}>
                  "Watch your extension move from invisible to discoverable as authentic reviews from fellow developers signal quality to Google's algorithm."
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="lg" radius="lg" p="xl" bg="blue.0">
                <Stack align="center" gap="md">
                  <TrendingUp size={48} color="#2196f3" />
                  <Text fw={600} size="lg" ta="center">
                    Average Ranking Improvement
                  </Text>
                  <Text size="3rem" fw={800} c="blue.6">
                    8.3x
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Higher in search results within 30 days
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Section 2: Escape the Review Catch-22 */}
          <Grid align="center">
            <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
              <Card shadow="lg" radius="lg" p="xl" bg="green.0">
                <Stack align="center" gap="md">
                  <Star size={48} color="#10b981" />
                  <Text fw={600} size="lg" ta="center">
                    Reviews in First Month
                  </Text>
                  <Text size="3rem" fw={800} c="green.6">
                    20+
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Average for new extensions
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
              <Stack gap="lg">
                <Badge size="lg" variant="light" color="green">
                  Review Catch-22 Solved
                </Badge>
                <Title order={2} size="2.5rem" fw={700} c="dark.8">
                  Escape the Review Catch-22
                </Title>
                <Text size="lg" c="dimmed" lh={1.6}>
                  Instead of waiting months for users to maybe leave a review (if you're lucky)... You'll get a consistent stream of detailed, helpful reviews from developers who actually understand and use Chrome extensions.
                </Text>
                <Text size="md" c="green.6" fw={600} style={{ fontStyle: 'italic' }}>
                  "Finally get those crucial first 10-50 reviews that make new users trust your extension enough to install it."
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>

          {/* Section 3: Compete with Established Extensions */}
          <Grid align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="lg">
                <Badge size="lg" variant="light" color="purple">
                  Level Playing Field
                </Badge>
                <Title order={2} size="2.5rem" fw={700} c="dark.8">
                  Compete with Established Extensions
                </Title>
                <Text size="lg" c="dimmed" lh={1.6}>
                  Instead of being crushed by million-download giants in your category... You'll get the social proof and momentum needed to compete, as higher ratings and review velocity signal freshness to the algorithm.
                </Text>
                <Text size="md" c="purple.6" fw={600} style={{ fontStyle: 'italic' }}>
                  "Level the playing field with extensions that have been around for years - quality and recent activity matter more than age."
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="lg" radius="lg" p="xl" bg="purple.0">
                <Stack align="center" gap="md">
                  <Shield size={48} color="#8b5cf6" />
                  <Text fw={600} size="lg" ta="center">
                    Compete Successfully
                  </Text>
                  <Text size="3rem" fw={800} c="purple.6">
                    89%
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Of users outrank established competitors
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Section 4: Skip Risky Manual Outreach */}
          <Grid align="center">
            <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
              <Card shadow="lg" radius="lg" p="xl" bg="orange.0">
                <Stack align="center" gap="md">
                  <CheckCircle size={48} color="#f59e0b" />
                  <Text fw={600} size="lg" ta="center">
                    Time Saved Weekly
                  </Text>
                  <Text size="3rem" fw={800} c="orange.6">
                    15h
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    No more manual outreach needed
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
              <Stack gap="lg">
                <Badge size="lg" variant="light" color="orange">
                  No More Manual Work
                </Badge>
                <Title order={2} size="2.5rem" fw={700} c="dark.8">
                  Skip Risky Manual Outreach
                </Title>
                <Text size="lg" c="dimmed" lh={1.6}>
                  Instead of spending hours hunting down developers to beg for reviews (and risking policy violations)... You'll get automatic connections with motivated reviewers through our compliant algorithm - no awkward asks, no policy risks.
                </Text>
                <Text size="md" c="orange.6" fw={600} style={{ fontStyle: 'italic' }}>
                  "Focus on building great extensions while we handle getting them discovered safely and efficiently."
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>

          {/* Section 5: Build Unstoppable Momentum */}
          <Grid align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="lg">
                <Badge size="lg" variant="light" color="red">
                  Unstoppable Growth
                </Badge>
                <Title order={2} size="2.5rem" fw={700} c="dark.8">
                  Build Unstoppable Momentum
                </Title>
                <Text size="lg" c="dimmed" lh={1.6}>
                  Instead of watching your extension stagnate after initial excitement dies down... You'll get consistent growth that compounds - more reviews lead to more visibility, which leads to more organic installs and reviews.
                </Text>
                <Text size="md" c="red.6" fw={600} style={{ fontStyle: 'italic' }}>
                  "Create the upward spiral successful extensions need: steady reviews → better rankings → more organic discovery → sustained growth."
                </Text>
                <Button 
                  size="lg" 
                  radius="md" 
                  onClick={handleGetStarted}
                  rightSection={<ArrowRight size={18} />}
                  styles={{
                    root: {
                      background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 16px rgba(238, 90, 36, 0.3)',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(238, 90, 36, 0.4)'
                      }
                    }
                  }}
                >
                  Start Getting Reviews Today - FREE
                </Button>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="lg" radius="lg" p="xl" bg="red.0">
                <Stack align="center" gap="md">
                  <TrendingUp size={48} color="#ef4444" />
                  <Text fw={600} size="lg" ta="center">
                    Growth Momentum
                  </Text>
                  <Text size="3rem" fw={800} c="red.6">
                    340%
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Average install increase in 60 days
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>

      {/* How ChromeExDev.Reviews Works Section */}
      <Container size="lg" py={80}>
        <Stack gap={80}>
          {/* Section Header */}
          <Stack align="center" gap="md">
            <Title order={1} size="2.5rem" fw={700} ta="center" c="dark.8">
              How ChromeExDev.Reviews Works
            </Title>
            <Text size="lg" c="dimmed" ta="center" maw={600} style={{ fontStyle: 'italic' }}>
              Simple, compliant, and effective - get quality reviews from developers who actually understand extensions
            </Text>
          </Stack>

          <Divider size="md" />

          {/* The Process - 3 Steps */}
          <div>
            <Title order={2} size="2rem" fw={700} ta="center" mb="xl" c="dark.8">
              The Process
            </Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card shadow="lg" radius="lg" p="xl" h="100%">
                  <Stack align="center" gap="lg">
                    <ThemeIcon size={60} radius="xl" color="blue">
                      <Lock size={30} />
                    </ThemeIcon>
                    <Title order={3} size="1.25rem" ta="center">
                      Step 1: Join the Developer Network
                    </Title>
                    <Text ta="center" c="dimmed" lh={1.6}>
                      <strong>Sign up free</strong> and add your Chrome extension to our developer network. Connect with a community of extension developers who understand the challenges you face.
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card shadow="lg" radius="lg" p="xl" h="100%">
                  <Stack align="center" gap="lg">
                    <ThemeIcon size={60} radius="xl" color="green">
                      <RefreshCcw size={30} />
                    </ThemeIcon>
                    <Title order={3} size="1.25rem" ta="center">
                      Step 2: Trade Quality Reviews
                    </Title>
                    <Text ta="center" c="dimmed" lh={1.6}>
                      <strong>Review to earn credits.</strong> Write thoughtful reviews for other developers' extensions to earn credits. Each quality review earns you a credit to get your own extension reviewed.
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card shadow="lg" radius="lg" p="xl" h="100%">
                  <Stack align="center" gap="lg">
                    <ThemeIcon size={60} radius="xl" color="orange">
                      <Star size={30} />
                    </ThemeIcon>
                    <Title order={3} size="1.25rem" ta="center">
                      Step 3: Get Authentic Reviews
                    </Title>
                    <Text ta="center" c="dimmed" lh={1.6}>
                      <strong>Watch your reviews grow.</strong> Our algorithm matches your extension with qualified reviewers who actually install, test, and provide detailed feedback.
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </div>

          <Divider size="md" />

          {/* Why It's Different */}
          <div>
            <Title order={2} size="2rem" fw={700} ta="center" mb="xl" c="dark.8">
              Why It's Different
            </Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="xl" h="100%">
                  <Group gap="md" align="flex-start">
                    <ThemeIcon color="blue" size={40} radius="xl">
                      <Shield size={20} />
                    </ThemeIcon>
                    <Stack gap="sm" flex={1}>
                      <Title order={4} size="1.1rem">100% Chrome Web Store Compliant</Title>
                      <Text size="sm" c="dimmed" lh={1.5}>
                        <strong>No direct 1-for-1 exchanges.</strong> Our smart algorithm prevents the direct trading patterns that Google prohibits. You review extensions, earn credits, then use credits to get reviewed - creating a compliant community ecosystem.
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="xl" h="100%">
                  <Group gap="md" align="flex-start">
                    <ThemeIcon color="green" size={40} radius="xl">
                      <Code size={20} />
                    </ThemeIcon>
                    <Stack gap="sm" flex={1}>
                      <Title order={4} size="1.1rem">Reviews from Real Developers</Title>
                      <Text size="sm" c="dimmed" lh={1.5}>
                        <strong>Quality over quantity.</strong> Every reviewer is a Chrome extension developer who understands the ecosystem. No random users, no fake accounts - just developers helping developers.
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="xl" h="100%">
                  <Group gap="md" align="flex-start">
                    <ThemeIcon color="purple" size={40} radius="xl">
                      <TrendingUp size={20} />
                    </ThemeIcon>
                    <Stack gap="sm" flex={1}>
                      <Title order={4} size="1.1rem">Algorithm-Friendly Growth</Title>
                      <Text size="sm" c="dimmed" lh={1.5}>
                        <strong>Consistent review activity signals quality to Google's ranking algorithm.</strong> Regular, authentic reviews help your extension climb search results and attract organic users.
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="xl" h="100%">
                  <Group gap="md" align="flex-start">
                    <ThemeIcon color="orange" size={40} radius="xl">
                      <DollarSign size={20} />
                    </ThemeIcon>
                    <Stack gap="sm" flex={1}>
                      <Title order={4} size="1.1rem">Free to Test</Title>
                      <Text size="sm" c="dimmed" lh={1.5}>
                        <strong>Start immediately with no risk.</strong> Test the platform, see the quality of reviews, and experience the growth before deciding if you want to upgrade.
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>
          </div>

          <Divider size="md" />

          {/* Choose Your Growth Speed */}
          <div>
            <Title order={2} size="2rem" fw={700} ta="center" mb="xl" c="dark.8">
              Choose Your Growth Speed
            </Title>
            <Grid>
              {/* Free Tier */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card shadow="lg" radius="lg" p="xl" h="100%" withBorder>
                  <Stack gap="lg">
                    <Stack align="center" gap="md">
                      <Badge size="lg" color="blue" variant="light">
                        Free Tier - Perfect for Testing
                      </Badge>
                      <Group align="baseline" gap="xs">
                        <Text size="2.5rem" fw={800} c="blue.6">
                          $0
                        </Text>
                        <Text size="lg" c="dimmed">
                          /month
                        </Text>
                      </Group>
                      <Text fw={600} ta="center" c="blue">
                        Start Today
                      </Text>
                    </Stack>

                    <div>
                      <Text fw={600} mb="sm">What's Included:</Text>
                      <List
                        spacing="xs"
                        size="sm"
                        icon={
                          <ThemeIcon color="green" size={16} radius="xl">
                            <CheckCircle size={10} />
                          </ThemeIcon>
                        }
                      >
                        <List.Item><strong>1 extension</strong> in the network</List.Item>
                        <List.Item><strong>4 reviews per month</strong> (28-day cycle)</List.Item>
                        <List.Item><strong>Standard queue</strong> processing (2-3 day average)</List.Item>
                        <List.Item><strong>Credit-based system</strong> (review others to earn credits)</List.Item>
                        <List.Item><strong>Full platform access</strong> to test quality</List.Item>
                      </List>
                    </div>

                    <div>
                      <Text fw={600} mb="sm">Perfect For:</Text>
                      <List spacing="xs" size="sm">
                        <List.Item>Developers testing the platform</List.Item>
                        <List.Item>Single-extension developers</List.Item>
                        <List.Item>Occasional review needs</List.Item>
                      </List>
                    </div>

                    <Button 
                      size="lg" 
                      variant="light" 
                      fullWidth
                      onClick={handleGetStarted}
                    >
                      Start Free - No Credit Card Required
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Review Fast Track */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card 
                  shadow="xl" 
                  radius="lg" 
                  p="xl" 
                  h="100%"
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    position: 'relative'
                  }}
                >
                  <Badge 
                    size="lg" 
                    variant="white" 
                    color="dark"
                    style={{ 
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  >
                    Most Popular
                  </Badge>
                  
                  <Stack gap="lg">
                    <Stack align="center" gap="md">
                      <Badge size="lg" color="yellow" variant="light">
                        Review Fast Track - For Serious Growth
                      </Badge>
                      <Group align="baseline" gap="xs">
                        <Text size="2.5rem" fw={800} c="white">
                          $19.99
                        </Text>
                        <Text size="lg" c="rgba(255,255,255,0.8)">
                          /month
                        </Text>
                      </Group>
                      <Text size="sm" c="rgba(255,255,255,0.8)" ta="center">
                        or $149.99/year - save $90
                      </Text>
                    </Stack>

                    <div>
                      <Text fw={600} mb="sm" c="white">Everything in Free, Plus:</Text>
                      <List
                        spacing="xs"
                        size="sm"
                        icon={
                          <ThemeIcon color="yellow" size={16} radius="xl">
                            <Zap size={10} />
                          </ThemeIcon>
                        }
                      >
                        <List.Item><strong>Unlimited extensions</strong> in your portfolio</List.Item>
                        <List.Item><strong>Unlimited reviews per month</strong></List.Item>
                        <List.Item><strong>Priority queue processing</strong> (under 24 hours)</List.Item>
                        <List.Item><strong>Skip the credit system</strong> (no need to review first)</List.Item>
                        <List.Item><strong>Premium support</strong> (direct email access)</List.Item>
                      </List>
                    </div>

                    <Card withBorder p="md" bg="rgba(255,255,255,0.1)">
                      <Text fw={600} mb="xs" c="white">The Fast Track Advantage:</Text>
                      <Text size="sm" c="rgba(255,255,255,0.9)" lh={1.4}>
                        While free users wait 2-3 days in the standard queue, Review Fast Track members skip to the front and usually get reviewed in under 24 hours.
                      </Text>
                    </Card>

                    <Button 
                      size="lg" 
                      variant="white"
                      color="dark"
                      fullWidth
                      onClick={() => navigate('/upgrade')}
                      leftSection={<Crown size={20} />}
                    >
                      Join Review Fast Track
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </div>

          <Divider size="md" />

          {/* Risk-Free Guarantee */}
          <Card withBorder p="xl" bg="green.0">
            <Stack gap="lg">
              <Title order={2} size="1.5rem" fw={700} ta="center" c="dark.8">
                Risk-Free Guarantee
              </Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Group gap="md" align="flex-start">
                    <ThemeIcon color="green" size={40} radius="xl">
                      <CheckCircle size={20} />
                    </ThemeIcon>
                    <Stack gap="xs" flex={1}>
                      <Text fw={600}>30-Day Money-Back Promise</Text>
                      <Text size="sm" c="dimmed">
                        Try Review Fast Track risk-free. If you're not satisfied with the speed and quality, we'll refund your first month - no questions asked.
                      </Text>
                    </Stack>
                  </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Group gap="md" align="flex-start">
                    <ThemeIcon color="blue" size={40} radius="xl">
                      <XCircle size={20} />
                    </ThemeIcon>
                    <Stack gap="xs" flex={1}>
                      <Text fw={600}>Cancel Anytime</Text>
                      <Text size="sm" c="dimmed">
                        No contracts, no commitments. Upgrade or downgrade anytime. Your free tier access remains forever.
                      </Text>
                    </Stack>
                  </Group>
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>

          {/* Getting Started */}
          <div>
            <Title order={2} size="2rem" fw={700} ta="center" mb="xl" c="dark.8">
              Getting Started
            </Title>
            <Card withBorder p="xl">
              <Stack gap="lg">
                <div>
                  <Text fw={600} mb="md">Immediate Next Steps:</Text>
                  <List
                    spacing="sm"
                    size="md"
                    icon={
                      <ThemeIcon color="blue" size={20} radius="xl">
                        <CheckCircle size={12} />
                      </ThemeIcon>
                    }
                  >
                    <List.Item><strong>Sign up free</strong> - No credit card required</List.Item>
                    <List.Item><strong>Add your first extension</strong> to the network</List.Item>
                    <List.Item><strong>Write 1-2 quality reviews</strong> to earn your first credits</List.Item>
                    <List.Item><strong>Submit for review</strong> and watch the quality feedback roll in</List.Item>
                    <List.Item><strong>Upgrade to Fast Track</strong> when you're ready for unlimited speed</List.Item>
                  </List>
                </div>

                <div>
                  <Text fw={600} mb="md" ta="center" size="lg">
                    Ready to Break the Zero-Review Trap?
                  </Text>
                  <Group justify="center" gap="md">
                    <Button 
                      size="lg"
                      onClick={handleGetStarted}
                    >
                      Start Free Today
                    </Button>
                    <Button 
                      size="lg" 
                      variant="gradient"
                      gradient={{ from: 'yellow', to: 'orange' }}
                      leftSection={<Crown size={18} />}
                      onClick={() => navigate('/upgrade')}
                    >
                      Skip the Wait - Join Fast Track
                    </Button>
                  </Group>
                  <Text size="sm" c="dimmed" ta="center" mt="md" style={{ fontStyle: 'italic' }}>
                    Join a fast growing community of extension developers who refuse to let great extensions stay invisible
                  </Text>
                </div>
              </Stack>
            </Card>
          </div>
        </Stack>
      </Container>

      {/* Testimonials Section */}
      <Box py={80} bg="gray.0" className="hidden">
        <Container size="lg">
          <Stack gap="xl" align="center">
            <Stack gap="md" align="center">
              <Title order={2} size="2.5rem" fw={700} ta="center">
                Real Results from Real Beta Developers
              </Title>
              <Text size="lg" c="dimmed" ta="center" maw={600}>
                See how Chrome extension developers are breaking through the visibility barrier and growing their user base
              </Text>
            </Stack>
            <Grid>
              {testimonials.map((testimonial, index) => (
                <Grid.Col key={index} span={{ base: 12, md: 4 }}>
                  <Card shadow="md" radius="lg" p="xl" h="100%">
                    <Stack gap="md">
                      <Group gap="xs">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={16} fill="#ffd43b" color="#ffd43b" />
                        ))}
                      </Group>
                      <Quote size={24} color="#e9ecef" />
                      <Text size="md" lh={1.6}>
                        {testimonial.content}
                      </Text>
                      <Badge variant="light" color="green" size="sm">
                        {testimonial.result}
                      </Badge>
                      <Group gap="sm" mt="auto">
                        <Avatar src={testimonial.avatar} size="md" radius="xl" />
                        <Stack gap={0}>
                          <Text fw={600} size="sm">
                            {testimonial.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {testimonial.role}
                          </Text>
                        </Stack>
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* Final CTA Section */}
      <Box py={80} bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
        <Container size="md">
          <Stack align="center" gap="xl">
            <Stack align="center" gap="md">
              <Title order={2} size="2.5rem" fw={700} c="white" ta="center">
                Ready to Break Through the Visibility Barrier?
              </Title>
              <Text size="lg" c="rgba(255,255,255,0.9)" ta="center" maw={500}>
                Join a fast growing community of Chrome extension developers who are getting steady reviews and growing their user base every week.
              </Text>
            </Stack>
            <Button 
              size="xl" 
              radius="md" 
              onClick={handleGetStarted}
              rightSection={<ArrowRight size={20} />}
              styles={{
                root: {
                  background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                  border: 'none',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  padding: '20px 40px',
                  boxShadow: '0 8px 32px rgba(238, 90, 36, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(238, 90, 36, 0.4)'
                  }
                }
              }}
            >
              Start Getting Reviews Today - FREE
            </Button>
            <Group gap="xl" c="rgba(255,255,255,0.8)">
              <Text size="sm">✓ 30-Day Money-Back Guarantee</Text>
              <Text size="sm">✓ Setup in Under 3 Minutes</Text>
              <Text size="sm">✓ 100% Policy Compliant</Text>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={40} bg="gray.9">
        <Container size="lg">
          <Stack align="center" gap="md">
            {/* Footer Image */}
            <Group gap="xl" justify="center" align="center">
              <a 
                href="https://bolt.new/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <img 
                  src="https://i.imgur.com/0aNDCFP.png" 
                  alt="ChromeExDev Footer" 
                  style={{ 
                    width: 'auto', 
                    height: '60px',
                    objectFit: 'contain',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease',
                  }}
                  className="hover:opacity-80"
                />
              </a>
              <img 
                src="https://i.imgur.com/wjfokMi.png" 
                alt="Partner Logo 2"
                style={{ 
                  width: 'auto', 
                  height: '60px',
                  objectFit: 'contain'
                }}
              />
              <img 
                src="https://i.imgur.com/FxUHtNU.png" 
                alt="Supabase Logo" 
                style={{ 
                  width: 'auto', 
                  height: '60px',
                  objectFit: 'contain'
                }}
              />
            </Group>
            
            <Group gap="xl" justify="center">
              <Text 
                component="a" 
                href="/terms" 
                size="sm" 
                c="gray.4"
                style={{ textDecoration: 'none' }}
                className="hover:text-white transition-colors"
              >
                Terms and Conditions
              </Text>
              <Text 
                component="a" 
                href="/privacy" 
                size="sm" 
                c="gray.4"
                style={{ textDecoration: 'none' }}
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Text>
            </Group>
            <Text size="sm" c="gray.5" ta="center">
              © 2025 El Barrial Devs | ChromeExDev.Reviews. All rights reserved.
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Cookie Consent Modal */}
      <CookieConsentModal
        opened={showCookieModal}
        onAccept={handleCookieAccept}
        onDecline={handleCookieDecline}
      />
    </Box>
  )
}