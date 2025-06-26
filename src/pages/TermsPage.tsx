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

export function TermsPage() {
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
              Terms and Conditions
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
                Welcome to ChromeExDev.Reviews. These Terms and Conditions ("Terms") govern your access to and use of the ChromeExDev.Reviews website (the "Service"). The Service is owned and operated by El Barrial Devs ("we," "us," or "our"), a company located in Monterrey, Mexico.
              </Text>
              <Text lh={1.6} mt="md">
                By accessing our website, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Service.
              </Text>
            </div>

            <Divider />

            {/* 2. Definitions */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                2. Definitions
              </Title>
              <List spacing="sm">
                <List.Item><strong>Service:</strong> The ChromeExDev.Reviews website</List.Item>
                <List.Item><strong>User:</strong> Any individual who accesses or uses the Service</List.Item>
                <List.Item><strong>Content:</strong> Any information, data, text, software, graphics, or other materials displayed or available through the Service</List.Item>
              </List>
            </div>

            <Divider />

            {/* 3. Use of Service */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                3. Use of Service
              </Title>
              
              <Title order={3} size="1.25rem" fw={600} mb="sm">
                3.1 Eligibility
              </Title>
              <Text lh={1.6} mb="md">
                You must be at least 13 years of age to use the Service. By agreeing to these Terms, you represent and warrant that you are at least 13 years old.
              </Text>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                3.2 User Account
              </Title>
              <Text lh={1.6} mb="md">
                Some features of the Service may require you to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </Text>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                3.3 Acceptable Use
              </Title>
              <Text lh={1.6} mb="sm">
                When using our Service, you agree not to:
              </Text>
              <List spacing="xs" size="sm">
                <List.Item>Use the Service in any way that violates any applicable local, national, or international law or regulation</List.Item>
                <List.Item>Use the Service to send, knowingly receive, upload, download, or use any material that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</List.Item>
                <List.Item>Attempt to gain unauthorized access to any portion of the Service or any other systems or networks connected to the Service</List.Item>
                <List.Item>Use the Service to collect or harvest any personally identifiable information</List.Item>
                <List.Item>Use the Service for any commercial purposes without our prior written consent</List.Item>
                <List.Item>Interfere with or disrupt the Service or servers or networks connected to the Service</List.Item>
              </List>
            </div>

            <Divider />

            {/* 4. Intellectual Property */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                4. Intellectual Property
              </Title>
              
              <Title order={3} size="1.25rem" fw={600} mb="sm">
                4.1 Our Intellectual Property
              </Title>
              <Text lh={1.6} mb="md">
                The Service and its original content, features, and functionality are and will remain the exclusive property of El Barrial Devs and its licensors. The Service is protected by copyright, trademark, and other laws of both Mexico and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of El Barrial Devs.
              </Text>

              <Title order={3} size="1.25rem" fw={600} mb="sm">
                4.2 User Content
              </Title>
              <Text lh={1.6}>
                You retain any and all of your rights to any content you submit, post, or display on or through the Service and you are responsible for protecting those rights. By uploading or sharing content through the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute such content in connection with providing and promoting the Service.
              </Text>
            </div>

            <Divider />

            {/* 5. Third-Party Links and Services */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                5. Third-Party Links and Services
              </Title>
              <Text lh={1.6}>
                The Service may contain links to third-party websites or services that are not owned or controlled by El Barrial Devs. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services. You further acknowledge and agree that we shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any such websites or services.
              </Text>
            </div>

            <Divider />

            {/* 6. Privacy Policy */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                6. Privacy Policy
              </Title>
              <Text lh={1.6}>
                Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices regarding your personal information.
              </Text>
            </div>

            <Divider />

            {/* 7. Termination */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                7. Termination
              </Title>
              <Text lh={1.6}>
                We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
              </Text>
            </div>

            <Divider />

            {/* 8. Limitation of Liability */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                8. Limitation of Liability
              </Title>
              <Text lh={1.6} mb="sm">
                In no event shall El Barrial Devs, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
              </Text>
              <List spacing="xs" size="sm">
                <List.Item>Your access to or use of or inability to access or use the Service</List.Item>
                <List.Item>Any conduct or content of any third party on the Service</List.Item>
                <List.Item>Any content obtained from the Service</List.Item>
                <List.Item>Unauthorized access, use, or alteration of your transmissions or content</List.Item>
              </List>
            </div>

            <Divider />

            {/* 9. Disclaimer of Warranties */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                9. Disclaimer of Warranties
              </Title>
              <Text lh={1.6} mb="sm">
                The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance. El Barrial Devs, its subsidiaries, affiliates, and licensors do not warrant that:
              </Text>
              <List spacing="xs" size="sm">
                <List.Item>The Service will function uninterrupted, secure, or available at any particular time or location</List.Item>
                <List.Item>Any errors or defects will be corrected</List.Item>
                <List.Item>The Service is free of viruses or other harmful components</List.Item>
                <List.Item>The results of using the Service will meet your requirements</List.Item>
              </List>
            </div>

            <Divider />

            {/* 10. Changes to Terms */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                10. Changes to Terms
              </Title>
              <Text lh={1.6}>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </Text>
            </div>

            <Divider />

            {/* 11. Governing Law */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                11. Governing Law
              </Title>
              <Text lh={1.6}>
                These Terms shall be governed and construed in accordance with the laws of Mexico, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </Text>
            </div>

            <Divider />

            {/* 12. Dispute Resolution */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                12. Dispute Resolution
              </Title>
              <Text lh={1.6}>
                Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with the laws of Mexico. The arbitration shall take place in Monterrey, Mexico.
              </Text>
            </div>

            <Divider />

            {/* 13. Severability */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                13. Severability
              </Title>
              <Text lh={1.6}>
                If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
              </Text>
            </div>

            <Divider />

            {/* 14. Contact Us */}
            <div>
              <Title order={2} size="1.5rem" fw={700} mb="md">
                14. Contact Us
              </Title>
              <Text lh={1.6} mb="sm">
                If you have any questions about these Terms, please contact us at:
              </Text>
              <List spacing="xs" size="sm">
                <List.Item><strong>Email:</strong> cristo@cristolopez.com</List.Item>
                <List.Item><strong>Address:</strong> El Barrial Devs, Monterrey, Mexico</List.Item>
              </List>
            </div>

            <Divider />

            {/* Final Statement */}
            <Box bg="blue.0" p="lg" style={{ borderRadius: '8px' }}>
              <Text fw={600} ta="center" lh={1.6}>
                By using the ChromeExDev.Reviews website you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
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