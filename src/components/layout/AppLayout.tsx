import React, { useEffect, useState } from 'react'
import { AppShell, Modal, Card, Text, Group, Badge, Button, Stack, ScrollArea, ActionIcon } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { MessageSquare, Eye } from 'lucide-react'
import { SideNav } from './SideNav'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface AppLayoutProps {
  children: React.ReactNode
}

interface UserMessage {
  id: string
  subject: string
  message: string
  priority: 'normal' | 'high' | 'urgent'
  popup_on_login: boolean
  is_read: boolean
  created_at: string
  sender_name?: string
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<UserMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMessagesModal, setShowMessagesModal] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState<UserMessage | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Fetch messages on profile load
  useEffect(() => {
    if (profile?.id) {
      fetchUserMessages()
    }
  }, [profile?.id])

  const fetchUserMessages = async () => {
    if (!profile?.id) return

    try {
      setLoadingMessages(true)
      console.log('Fetching user messages...')
      
      const { data, error } = await supabase.functions.invoke('fetch-user-messages', {
        body: { user_id: profile.id }
      })

      if (error) throw error

      if (data?.success) {
        setMessages(data.messages || [])
        
        // Count unread messages
        const unread = (data.messages || []).filter((msg: UserMessage) => !msg.is_read).length
        setUnreadCount(unread)
        
        // Check for popup messages on login
        const popupMessages = (data.messages || []).filter(
          (msg: UserMessage) => msg.popup_on_login && !msg.is_read
        )
        
        if (popupMessages.length > 0) {
          // Show the most recent popup message
          const latestPopup = popupMessages.sort((a: UserMessage, b: UserMessage) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          setPopupMessage(latestPopup)
          setShowLoginPopup(true)
        }
      }
    } catch (error) {
      console.error('Error fetching user messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('mark-message-read', {
        body: { message_id: messageId }
      })

      if (error) throw error

      if (data?.success) {
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const handlePopupClose = async () => {
    if (popupMessage) {
      await markMessageAsRead(popupMessage.id)
    }
    setShowLoginPopup(false)
    setPopupMessage(null)
  }

  const handleShowAllMessages = () => {
    setShowMessagesModal(true)
    // Mark all unread as read when viewing
    const unreadMessages = messages.filter(msg => !msg.is_read)
    unreadMessages.forEach(msg => markMessageAsRead(msg.id))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red'
      case 'high': return 'orange'
      default: return 'blue'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'URGENT'
      case 'high': return 'HIGH'
      default: return 'NORMAL'
    }
  }

  return (
    <AppShell
      navbar={{ width: 280, breakpoint: 'sm' }}
      padding="md"
    >
      <SideNav 
        unreadMessageCount={unreadCount}
        onMessagesClick={handleShowAllMessages}
      />
      <AppShell.Main>{children}</AppShell.Main>

      {/* Login Popup Message */}
      <Modal
        opened={showLoginPopup}
        onClose={handlePopupClose}
        title={
          <Group gap="xs">
            <MessageSquare size={20} />
            <Text fw={600}>New Message from Admin</Text>
            {popupMessage && (
              <Badge color={getPriorityColor(popupMessage.priority)} size="sm">
                {getPriorityLabel(popupMessage.priority)}
              </Badge>
            )}
          </Group>
        }
        size="md"
        centered
      >
        {popupMessage && (
          <Stack>
            <Card withBorder p="md" bg="blue.0">
              <Text fw={600} mb="xs">{popupMessage.subject}</Text>
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {popupMessage.message}
              </Text>
            </Card>
            
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Sent: {new Date(popupMessage.created_at).toLocaleString()}
              </Text>
              <Group>
                <Button variant="light" onClick={() => setShowMessagesModal(true)}>
                  View All Messages
                </Button>
                <Button onClick={handlePopupClose}>
                  Got it
                </Button>
              </Group>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* All Messages Modal */}
      <Modal
        opened={showMessagesModal}
        onClose={() => setShowMessagesModal(false)}
        title={
          <Group gap="xs">
            <MessageSquare size={20} />
            <Text fw={600}>Messages</Text>
            {unreadCount > 0 && (
              <Badge color="red" size="sm">
                {unreadCount} unread
              </Badge>
            )}
          </Group>
        }
        size="lg"
      >
        <ScrollArea h={400}>
          <Stack>
            {messages.length === 0 ? (
              <Card withBorder p="xl">
                <Text ta="center" c="dimmed">
                  No messages yet
                </Text>
              </Card>
            ) : (
              messages
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((message) => (
                  <Card 
                    key={message.id} 
                    withBorder 
                    p="md"
                    bg={message.is_read ? undefined : 'blue.0'}
                  >
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <Text fw={600} size="sm">{message.subject}</Text>
                        {!message.is_read && (
                          <Badge color="blue" size="xs">NEW</Badge>
                        )}
                        <Badge color={getPriorityColor(message.priority)} size="xs">
                          {getPriorityLabel(message.priority)}
                        </Badge>
                      </Group>
                      {!message.is_read && (
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={() => markMessageAsRead(message.id)}
                        >
                          <Eye size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                    
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} mb="xs">
                      {message.message}
                    </Text>
                    
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        From: Admin
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(message.created_at).toLocaleString()}
                      </Text>
                    </Group>
                  </Card>
                ))
            )}
          </Stack>
        </ScrollArea>
        
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={() => setShowMessagesModal(false)}>
            Close
          </Button>
        </Group>
      </Modal>
    </AppShell>
  )
}