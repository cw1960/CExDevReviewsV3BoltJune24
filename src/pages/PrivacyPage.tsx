import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Box,
  Divider,
  List
} from '@mantine/core'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <Box>
      {/* Header */}
      <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" py={60}>
        <Container size="lg">
          <Group mb="xl">
            <img 
              src="https://i.imgur.com/PL0Syo1.png" 
              alt="ChromeExDev Logo" 
              style={{ width: 200, height: 'auto' }}
            />
          </Group>
          <Stack align="center" gap="md">
            <Title order={1} size="2.5rem" fw={700} c="white" ta="center">
              Privacy Policy
            </Title>
            <Text size="lg" c="rgba(255,255,255,0.9)" ta="center">
              Last Updated: June 24, 2025
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Content */}
      <Container size="md" py={60}>
        <Stack gap="xl">
          <Button 
            variant="light" 
            leftSection={<ArrowLeft size={16} />}
            onClick={() => navigate('/')}
            w="fit-content"
          >
            Back to Home
          </Button>

          <Stack gap="lg">
            {/* 1. Introduction */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                1. Introduction
              </Title>
              <Text lh={1.6}>
                Welcome to ChromeExDev.Reviews. This Privacy Policy explains how El Barrial Devs ("we," "us," or "our"), located in Monterrey, Mexico, collects, uses, discloses, and safeguards your information when you visit our website and use our application ChromeExDev.Reviews (the "Service").
              </Text>
              <Text lh={1.6} mt="md">
                Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Service.
              </Text>
            </div>

            <Divider />

            {/* 2. Information We Collect */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                2. Information We Collect
              </Title>
              
              <Title order={3} size="1.25rem" fw={600} mb="sm">
                2.1 Personal Information
              </Title>
              <Text lh={1.6} mb="sm">
                We may collect personal information that you voluntarily provide to us when you:
              </Text>
              <List spacing="xs" size="sm" mb="md">
                <List.Item>Register for an account</List.Item>
                <List.Item>Use our Service</List.Item>
                <List.Item>Contact us for support</List.Item>
                <List.Item>Subscribe to our newsletter or communications</List.Item>
                <List.Item>Participate in surveys or promotions</List.Item>
              </List>
              <Text lh={1.6} mb="sm">
                This personal information may include:
              </Text>
              <List spacing="xs" size="sm" mb="md">
                <List.Item>Name</List.Item>
                <List.Item>Email address</List.Item>
                <List.Item>Username</List.Item>
                <List.Item>Profile information</List.Item>
                <List.Item>Communication preferences</List.Item>
                <List.Item>Any other information you choose to provide</List.Item>
              </List>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                2.2 Automatically Collected Information
              </Title>
              <Text lh={1.6} mb="sm">
                When you access our Service, we may automatically collect certain information about your device and usage, including:
              </Text>
              <List spacing="xs" size="sm" mb="md">
                <List.Item>IP address</List.Item>
                <List.Item>Browser type and version</List.Item>
                <List.Item>Operating system</List.Item>
                <List.Item>Referring website</List.Item>
                <List.Item>Pages visited and time spent on our Service</List.Item>
                <List.Item>Date and time of visits</List.Item>
                <List.Item>Device identifiers</List.Item>
                <List.Item>Location data (general geographic location)</List.Item>
              </List>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                2.3 Cookies and Tracking Technologies
              </Title>
              <Text lh={1.6}>
                We use cookies, web beacons, and similar tracking technologies to collect and store information about your preferences and activities. You can control cookie settings through your browser preferences, though disabling cookies may limit some functionality of our Service.
              </Text>
            </div>

            <Divider />

            {/* 3. How We Use Your Information */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                3. How We Use Your Information
              </Title>
              <Text lh={1.6} mb="sm">
                We use the information we collect for various purposes, including:
              </Text>
              <List spacing="xs" size="sm">
                <List.Item><strong>Service Provision:</strong> To provide, maintain, and improve our Service</List.Item>
                <List.Item><strong>Account Management:</strong> To create and manage your account</List.Item>
                <List.Item><strong>Communication:</strong> To send you updates, notifications, and respond to your inquiries</List.Item>
                <List.Item><strong>Personalization:</strong> To customize your experience and provide relevant content</List.Item>
                <List.Item><strong>Analytics:</strong> To analyze usage patterns and improve our Service</List.Item>
                <List.Item><strong>Security:</strong> To protect against fraud, unauthorized access, and other security issues</List.Item>
                <List.Item><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</List.Item>
                <List.Item><strong>Marketing:</strong> To send promotional materials (with your consent where required)</List.Item>
              </List>
            </div>

            <Divider />

            {/* 4. How We Share Your Information */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                4. How We Share Your Information
              </Title>
              <Text lh={1.6} mb="md">
                We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
              </Text>
              
              <Title order={3} size="1.25rem" fw={600} mb="sm">
                4.1 Service Providers
              </Title>
              <Text lh={1.6} mb="sm">
                We may share your information with trusted third-party service providers who assist us in operating our Service, such as:
              </Text>
              <List spacing="xs" size="sm" mb="md">
                <List.Item>Web hosting providers</List.Item>
                <List.Item>Analytics services</List.Item>
                <List.Item>Email service providers</List.Item>
                <List.Item>Customer support tools</List.Item>
              </List>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                4.2 Legal Requirements
              </Title>
              <Text lh={1.6} mb="sm">
                We may disclose your information if required by law or in response to:
              </Text>
              <List spacing="xs" size="sm" mb="md">
                <List.Item>Valid legal process (court orders, subpoenas)</List.Item>
                <List.Item>Government requests</List.Item>
                <List.Item>Protection of our rights and property</List.Item>
                <List.Item>Prevention of fraud or illegal activities</List.Item>
              </List>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                4.3 Business Transfers
              </Title>
              <Text lh={1.6} mb="md">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity, subject to the same privacy protections.
              </Text>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                4.4 Consent
              </Title>
              <Text lh={1.6}>
                We may share your information with your explicit consent for specific purposes not covered in this policy.
              </Text>
            </div>

            <Divider />

            {/* 5. Data Security */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                5. Data Security
              </Title>
              <Text lh={1.6} mb="sm">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </Text>
              <List spacing="xs" size="sm" mb="md">
                <List.Item>Encryption of data in transit and at rest</List.Item>
                <List.Item>Regular security assessments</List.Item>
                <List.Item>Access controls and authentication</List.Item>
                <List.Item>Secure data storage practices</List.Item>
              </List>
              <Text lh={1.6}>
                However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </Text>
            </div>

            <Divider />

            {/* 6. Data Retention */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                6. Data Retention
              </Title>
              <Text lh={1.6}>
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your personal information, we will securely delete or anonymize it.
              </Text>
            </div>

            <Divider />

            {/* 7. Your Rights and Choices */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                7. Your Rights and Choices
              </Title>
              <Text lh={1.6} mb="md">
                Depending on your location, you may have certain rights regarding your personal information:
              </Text>
              
              <Title order={3} size="1.25rem" fw={600} mb="sm">
                7.1 Access and Correction
              </Title>
              <Text lh={1.6} mb="md">
                You have the right to access and update your personal information through your account settings or by contacting us.
              </Text>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                7.2 Data Portability
              </Title>
              <Text lh={1.6} mb="md">
                You may request a copy of your personal information in a portable format.
              </Text>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                7.3 Deletion
              </Title>
              <Text lh={1.6} mb="md">
                You may request deletion of your personal information, subject to certain legal limitations.
              </Text>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                7.4 Opt-Out
              </Title>
              <Text lh={1.6} mb="md">
                You can opt out of receiving promotional communications by following the unsubscribe instructions in our emails or contacting us directly.
              </Text>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                7.5 Cookie Control
              </Title>
              <Text lh={1.6}>
                You can manage cookie preferences through your browser settings.
              </Text>
            </div>

            <Divider />

            {/* 8. International Data Transfers */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                8. International Data Transfers
              </Title>
              <Text lh={1.6}>
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
              </Text>
            </div>

            <Divider />

            {/* 9. Children's Privacy */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                9. Children's Privacy
              </Title>
              <Text lh={1.6}>
                Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided personal information to us, please contact us immediately.
              </Text>
            </div>

            <Divider />

            {/* 10. Third-Party Links */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                10. Third-Party Links
              </Title>
              <Text lh={1.6}>
                Our Service may contain links to third-party websites or services. This Privacy Policy does not apply to those third-party sites. We encourage you to review the privacy policies of any third-party sites you visit.
              </Text>
            </div>

            <Divider />

            {/* 11. Changes to This Privacy Policy */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                11. Changes to This Privacy Policy
              </Title>
              <Text lh={1.6} mb="sm">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </Text>
              <List spacing="xs" size="sm" mb="md">
                <List.Item>Posting the updated Privacy Policy on our website</List.Item>
                <List.Item>Sending you an email notification (if you have provided your email address)</List.Item>
                <List.Item>Displaying a prominent notice on our Service</List.Item>
              </List>
              <Text lh={1.6}>
                Your continued use of the Service after the effective date of the revised Privacy Policy constitutes your acceptance of the changes.
              </Text>
            </div>

            <Divider />

            {/* 12. Contact Us */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                12. Contact Us
              </Title>
              <Text lh={1.6} mb="sm">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
              </Text>
              <List spacing="xs" size="sm" mb="md">
                <List.Item><strong>El Barrial Devs</strong></List.Item>
                <List.Item><strong>Email:</strong> cristo@cristolopez.com</List.Item>
                <List.Item><strong>Address:</strong> Monterrey, Mexico</List.Item>
              </List>
              <Text lh={1.6}>
                For data protection inquiries, please include "Privacy Policy" in the subject line of your email.
              </Text>
            </div>

            <Divider />

            {/* 13. Governing Law */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                13. Governing Law
              </Title>
              <Text lh={1.6}>
                This Privacy Policy is governed by the laws of Mexico. Any disputes arising from this Privacy Policy will be resolved in accordance with Mexican law.
              </Text>
            </div>

            <Divider />

            {/* Final Statement */}
            <Box bg="blue.0" p="lg" style={{ borderRadius: '8px' }}>
              <Text fw={600} ta="center" lh={1.6}>
                By using ChromeExDev.Reviews, you acknowledge that you have read, understood, and agree to this Privacy Policy.
              </Text>
            </Box>
          </Stack>
        </Stack>
      </Container>

      {/* Footer */}
      <Box py={40} bg="gray.9">
        <Container size="lg">
          <Stack align="center" gap="md">
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
    </Box>
  )
}