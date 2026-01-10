import React from "react"
import { Box, Heading, Text, Button, VStack, HStack } from "@chakra-ui/react"
import Link from "next/link"
import { FiHome, FiArrowLeft } from "react-icons/fi"

const theme = {
  bg: "#FAFAF8",
  textPrimary: "#2D2D2D",
  textSecondary: "#6B6B6B",
  textMuted: "#9CA3AF",
  accent: "#E07A5F",
  accentHover: "#C96249",
  border: "#E8E6E1",
}

const NotFoundPage = () => (
  <Box
    minH="100vh"
    bg={theme.bg}
    display="flex"
    alignItems="center"
    justifyContent="center"
    p={8}
  >
    <VStack spacing={8} textAlign="center" maxW="500px">
      <Box>
        <Text
          fontSize="8xl"
          fontWeight="700"
          color={theme.accent}
          lineHeight="1"
          letterSpacing="-0.05em"
        >
          404
        </Text>
        <Text
          fontSize="xl"
          color={theme.textMuted}
          fontWeight="500"
          mt={2}
        >
          Page not found
        </Text>
      </Box>

      <Text color={theme.textSecondary} fontSize="md" lineHeight="1.7">
        Oops! It seems like the page you're looking for doesn't exist.
        Maybe it was moved or you typed the wrong URL.
      </Text>

      <HStack spacing={4}>
        <Link href="/" passHref>
          <Button
            as="a"
            leftIcon={<FiHome />}
            bg={theme.accent}
            color="white"
            size="lg"
            fontWeight="500"
            _hover={{ bg: theme.accentHover }}
            borderRadius="xl"
            px={8}
          >
            Go Home
          </Button>
        </Link>
        <Button
          onClick={() => window.history.back()}
          leftIcon={<FiArrowLeft />}
          bg="transparent"
          color={theme.textSecondary}
          border="1px"
          borderColor={theme.border}
          size="lg"
          fontWeight="500"
          _hover={{ bg: theme.border }}
          borderRadius="xl"
          px={8}
        >
          Go Back
        </Button>
      </HStack>

      <Box
        pt={8}
        borderTop="1px"
        borderColor={theme.border}
        w="full"
      >
        <Text fontSize="sm" color={theme.textMuted}>
          ASL Translator • Real-time Sign Language Detection
        </Text>
      </Box>
    </VStack>
  </Box>
)

export default NotFoundPage
