import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Stack,
  Container,
  Tabs,
  Alert
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Package, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>('signin')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const signInForm = useForm({
    initialValues: {
      email: '',
      password: ''
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null)
    }
  })

  const signUpForm = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must be at least 2 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null
    }
  })

  const handleSignIn = async (values: typeof signInForm.values) => {
    setLoading(true)
    try {
      await signIn(values.email, values.password)
      notifications.show({
        title: 'Welcome back!',
        message: 'Successfully signed in',
        color: 'green'
      })
    } catch (error: any) {
      notifications.show({
        title: 'Sign in failed',
        message: error.message || 'An error occurred',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (values: typeof signUpForm.values) => {
    setLoading(true)
    try {
      await signUp(values.email, values.password, values.name)
      notifications.show({
        title: 'Account created!',
        message: 'Welcome to ChromeExDev.reviews',
        color: 'green'
      })
    } catch (error: any) {
      notifications.show({
        title: 'Sign up failed',
        message: error.message || 'An error occurred',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} my={40}>
      <Group justify="center" mb={30}>
        <img 
          src="https://i.imgur.com/PL0Syo1.png" 
          alt="ChromeExDev Logo" 
          style={{ width: 180, height: 'auto' }}
        />
      </Group>

      <Paper withBorder shadow="xl" p="xl" radius="lg">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow>
            <Tabs.Tab value="signin">Sign In</Tabs.Tab>
            <Tabs.Tab value="signup">Sign Up</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="signin" pt="md">
            <form onSubmit={signInForm.onSubmit(handleSignIn)}>
              <Stack gap="lg">
                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  required
                  radius="md"
                  {...signInForm.getInputProps('email')}
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  required
                  {...signInForm.getInputProps('password')}
                  radius="md"
                />
                <Button type="submit" fullWidth loading={loading} radius="md" size="md">
                  Sign In
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="signup" pt="md">
            <Alert
              icon={<AlertCircle size={16} />}
              title="Developer Community"
              color="blue"
              mb="md"
            >
              Join our trusted community of Chrome extension developers for authentic review exchanges.
            </Alert>
            
            <form onSubmit={signUpForm.onSubmit(handleSignUp)}>
              <Stack gap="lg">
                <TextInput
                  label="First Name"
                  placeholder="John Doe"
                  required
                  radius="md"
                  {...signUpForm.getInputProps('name')}
                />
                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  required
                  {...signUpForm.getInputProps('email')}
                  radius="md"
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  required
                  radius="md"
                  {...signUpForm.getInputProps('password')}
                />
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  required
                  {...signUpForm.getInputProps('confirmPassword')}
                  radius="md"
                />
                <Button type="submit" fullWidth loading={loading} radius="md" size="md">
                  Create Account
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  )
}