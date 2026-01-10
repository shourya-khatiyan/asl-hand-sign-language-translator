import React, { useRef, useState, useEffect } from "react"
import * as tf from "@tensorflow/tfjs"
import * as handpose from "@tensorflow-models/handpose"
import Webcam from "react-webcam"
import { drawHand } from "../components/handposeutil"
import * as fp from "fingerpose"
import Handsigns from "../components/handsigns"
import {
  Text,
  Heading,
  Button,
  Box,
  VStack,
  HStack,
  Flex,
  Badge,
  IconButton,
  Divider,
  useToast,
  Image,
  Grid,
  GridItem,
  Tooltip,
  Progress,
} from "@chakra-ui/react"
import { RiCameraFill, RiCameraOffFill, RiSave3Line } from "react-icons/ri"
import { FiRefreshCw, FiBook } from "react-icons/fi"
import { MdBackspace } from "react-icons/md"

// Professional Light Theme Colors
const theme = {
  bg: "#FAFAF8",
  surface: "#F5F3EF",
  card: "#FFFFFF",
  textPrimary: "#2D2D2D",
  textSecondary: "#6B6B6B",
  textMuted: "#9CA3AF",
  accent: "#E07A5F",
  accentHover: "#C96249",
  success: "#81B29A",
  warning: "#F2CC8F",
  border: "#E8E6E1",
  borderLight: "#F0EFEA",
}

export default function Home() {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const [camState, setCamState] = useState("on")
  const [sign, setSign] = useState(null)

  // Conversation state
  const [currentLetter, setCurrentLetter] = useState("")
  const [currentWord, setCurrentWord] = useState("")
  const [sentence, setSentence] = useState("")
  const [conversationHistory, setConversationHistory] = useState([])
  const [consecutiveCount, setConsecutiveCount] = useState(0)
  const [isDetecting, setIsDetecting] = useState(false)
  const [confidenceScore, setConfidenceScore] = useState(0)
  const [showGuide, setShowGuide] = useState(true)

  // Use refs to track values that need to be accessed synchronously
  const lastDetectedSignRef = useRef("")
  const consecutiveCountRef = useRef(0)

  // Smoothing for landmarks - store previous landmarks
  const previousLandmarksRef = useRef(null)
  const SMOOTHING_FACTOR = 0.5

  const toast = useToast()

  // Word building constants
  const CONFIRMATION_THRESHOLD = 15
  const CONFIDENCE_THRESHOLD = 6.0
  const DETECTION_INTERVAL = 150

  // ASL Alphabet for guide
  const aslAlphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
    'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ]

  function getHandSignImage(letter) {
    return `/handimages/${letter}hand.svg`
  }

  function smoothLandmarks(currentLandmarks) {
    if (!previousLandmarksRef.current) {
      previousLandmarksRef.current = currentLandmarks
      return currentLandmarks
    }

    const smoothed = currentLandmarks.map((point, i) => {
      const prevPoint = previousLandmarksRef.current[i]
      return [
        prevPoint[0] * SMOOTHING_FACTOR + point[0] * (1 - SMOOTHING_FACTOR),
        prevPoint[1] * SMOOTHING_FACTOR + point[1] * (1 - SMOOTHING_FACTOR),
        prevPoint[2] * SMOOTHING_FACTOR + point[2] * (1 - SMOOTHING_FACTOR),
      ]
    })

    previousLandmarksRef.current = smoothed
    return smoothed
  }

  async function runHandpose() {
    const net = await handpose.load()
    setInterval(() => {
      detect(net)
    }, DETECTION_INTERVAL)
  }

  async function detect(net) {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video
      const videoWidth = webcamRef.current.video.videoWidth
      const videoHeight = webcamRef.current.video.videoHeight

      webcamRef.current.video.width = videoWidth
      webcamRef.current.video.height = videoHeight

      canvasRef.current.width = videoWidth
      canvasRef.current.height = videoHeight

      const hand = await net.estimateHands(video)

      if (hand.length > 0) {
        const smoothedLandmarks = smoothLandmarks(hand[0].landmarks)

        const smoothedHand = [{
          ...hand[0],
          landmarks: smoothedLandmarks
        }]

        const GE = new fp.GestureEstimator([
          Handsigns.aSign,
          Handsigns.bSign,
          Handsigns.cSign,
          Handsigns.dSign,
          Handsigns.eSign,
          Handsigns.fSign,
          Handsigns.gSign,
          Handsigns.hSign,
          Handsigns.iSign,
          Handsigns.jSign,
          Handsigns.kSign,
          Handsigns.lSign,
          Handsigns.mSign,
          Handsigns.nSign,
          Handsigns.oSign,
          Handsigns.pSign,
          Handsigns.qSign,
          Handsigns.rSign,
          Handsigns.sSign,
          Handsigns.tSign,
          Handsigns.uSign,
          Handsigns.vSign,
          Handsigns.wSign,
          Handsigns.xSign,
          Handsigns.ySign,
          Handsigns.zSign,
        ])

        const estimatedGestures = await GE.estimate(smoothedLandmarks, 6.5)

        if (
          estimatedGestures.gestures !== undefined &&
          estimatedGestures.gestures.length > 0
        ) {
          const confidence = estimatedGestures.gestures.map(p => p.confidence)
          const maxConfidence = confidence.indexOf(
            Math.max.apply(undefined, confidence)
          )

          const detectedSign = estimatedGestures.gestures[maxConfidence].name
          const detectedConfidence = estimatedGestures.gestures[maxConfidence].confidence

          setConfidenceScore(detectedConfidence)
          setSign(detectedSign)
          setIsDetecting(true)

          if (detectedConfidence > CONFIDENCE_THRESHOLD) {
            processDetectedSign(detectedSign)
          } else {
            lastDetectedSignRef.current = ""
            consecutiveCountRef.current = 0
            setConsecutiveCount(0)
          }
        } else {
          setIsDetecting(false)
          lastDetectedSignRef.current = ""
          consecutiveCountRef.current = 0
          setConsecutiveCount(0)
        }

        const ctx = canvasRef.current.getContext("2d")
        ctx.clearRect(0, 0, videoWidth, videoHeight)
        drawHand(smoothedHand, ctx)
      } else {
        previousLandmarksRef.current = null

        setIsDetecting(false)
        lastDetectedSignRef.current = ""
        consecutiveCountRef.current = 0
        setConsecutiveCount(0)
        setConfidenceScore(0)

        const ctx = canvasRef.current.getContext("2d")
        ctx.clearRect(0, 0, videoWidth, videoHeight)
      }
    }
  }

  function processDetectedSign(detectedSign) {
    const letter = detectedSign.replace("_sign", "").replace("Sign", "").toUpperCase()

    setCurrentLetter(letter)

    if (letter === lastDetectedSignRef.current) {
      consecutiveCountRef.current = consecutiveCountRef.current + 1
      setConsecutiveCount(consecutiveCountRef.current)

      if (consecutiveCountRef.current >= CONFIRMATION_THRESHOLD) {
        addLetterToWord(letter)
        consecutiveCountRef.current = 0
        setConsecutiveCount(0)
        lastDetectedSignRef.current = ""
      }
    } else {
      lastDetectedSignRef.current = letter
      consecutiveCountRef.current = 1
      setConsecutiveCount(1)
    }
  }

  function addLetterToWord(letter) {
    setCurrentWord(prev => {
      const newWord = prev + letter

      toast({
        title: `Letter added: ${letter}`,
        status: "success",
        duration: 1000,
        position: "top",
        containerStyle: {
          background: theme.success,
          borderRadius: "12px",
        }
      })

      return newWord
    })
  }

  function completeWord() {
    if (currentWord.length > 0) {
      setSentence(prev => {
        const newSentence = prev + (prev ? " " : "") + currentWord
        return newSentence
      })

      toast({
        title: "Word added to sentence",
        description: `Added: "${currentWord}"`,
        status: "info",
        duration: 2000,
        position: "top",
      })

      setCurrentWord("")
    }
  }

  function completeSentence() {
    if (sentence.length > 0) {
      setConversationHistory(prev => [
        ...prev,
        { text: sentence, timestamp: new Date() }
      ])

      setSentence("")

      toast({
        title: "Sentence saved!",
        description: "Added to conversation history",
        status: "success",
        duration: 2000,
        position: "top",
      })
    } else if (currentWord.length > 0) {
      setConversationHistory(prev => [
        ...prev,
        { text: currentWord, timestamp: new Date() }
      ])

      setCurrentWord("")

      toast({
        title: "Word saved as sentence!",
        status: "success",
        duration: 2000,
        position: "top",
      })
    }
  }

  function deleteLastLetter() {
    if (currentWord.length > 0) {
      setCurrentWord(prev => prev.slice(0, -1))

      toast({
        title: "Letter deleted",
        status: "warning",
        duration: 500,
        position: "top",
      })
    }
  }

  function deleteLastWord() {
    if (sentence.length > 0) {
      setSentence(prev => {
        const words = prev.trim().split(" ")
        words.pop()
        return words.join(" ")
      })

      toast({
        title: "Word deleted from sentence",
        status: "warning",
        duration: 1000,
        position: "top",
      })
    }
  }

  function clearWord() {
    setCurrentWord("")
    setCurrentLetter("")
    setConsecutiveCount(0)
    consecutiveCountRef.current = 0
    lastDetectedSignRef.current = ""
  }

  function clearSentence() {
    setSentence("")
  }

  function saveConversation() {
    const text = conversationHistory.map(item => item.text).join("\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `asl-conversation-${Date.now()}.txt`
    a.click()

    toast({
      title: "Conversation saved!",
      status: "success",
      duration: 2000,
    })
  }

  function turnOffCamera() {
    setCamState(camState === "on" ? "off" : "on")
  }

  useEffect(() => {
    runHandpose()
  }, [])

  return (
    <Box minH="100vh" bg={theme.bg}>
      {/* Header */}
      <Box
        bg={theme.card}
        borderBottom="1px"
        borderColor={theme.border}
        px={6}
        py={4}
        boxShadow="0 1px 3px rgba(0,0,0,0.05)"
      >
        <Flex justify="space-between" align="center" maxW="1800px" mx="auto">
          <HStack spacing={4}>
            <Heading
              size="lg"
              color={theme.textPrimary}
              fontWeight="600"
              letterSpacing="-0.02em"
            >
              ASL Translator
            </Heading>
            <Badge
              bg={isDetecting ? theme.success : theme.surface}
              color={isDetecting ? "white" : theme.textSecondary}
              fontSize="xs"
              px={3}
              py={1}
              borderRadius="full"
              fontWeight="500"
            >
              {isDetecting ? "● Detecting" : "○ Ready"}
            </Badge>
          </HStack>
          <HStack spacing={3}>
            <Button
              onClick={() => setShowGuide(!showGuide)}
              leftIcon={<FiBook />}
              bg={showGuide ? theme.accent : "transparent"}
              color={showGuide ? "white" : theme.textSecondary}
              border="1px"
              borderColor={showGuide ? theme.accent : theme.border}
              size="sm"
              fontWeight="500"
              _hover={{
                bg: showGuide ? theme.accentHover : theme.surface,
                borderColor: showGuide ? theme.accentHover : theme.textMuted
              }}
              borderRadius="lg"
            >
              {showGuide ? "Hide" : "Show"} Guide
            </Button>
            <Button
              onClick={turnOffCamera}
              leftIcon={camState === "on" ? <RiCameraOffFill /> : <RiCameraFill />}
              bg={camState === "on" ? theme.accent : theme.success}
              color="white"
              size="sm"
              fontWeight="500"
              _hover={{
                bg: camState === "on" ? theme.accentHover : "#6A9A7F"
              }}
              borderRadius="lg"
            >
              {camState === "on" ? "Stop" : "Start"}
            </Button>
            <Button
              onClick={saveConversation}
              leftIcon={<RiSave3Line />}
              bg="transparent"
              color={theme.textSecondary}
              border="1px"
              borderColor={theme.border}
              size="sm"
              fontWeight="500"
              isDisabled={conversationHistory.length === 0}
              _hover={{ bg: theme.surface, borderColor: theme.textMuted }}
              borderRadius="lg"
            >
              Export
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Main Content */}
      <Flex h="calc(100vh - 73px)">
        {/* Left Sidebar - ASL Guide */}
        {showGuide && (
          <Box
            w="300px"
            bg={theme.surface}
            borderRight="1px"
            borderColor={theme.border}
            overflowY="auto"
            boxShadow="1px 0 3px rgba(0,0,0,0.03)"
          >
            <VStack spacing={0} align="stretch">
              <Box
                bg={theme.surface}
                p={4}
                position="sticky"
                top={0}
                zIndex={1}
                borderBottom="1px"
                borderColor={theme.border}
              >
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color={theme.textMuted}
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  ASL Alphabet Reference
                </Text>
              </Box>
              <Grid templateColumns="repeat(3, 1fr)" gap={3} p={4}>
                {aslAlphabet.map((letter) => {
                  const isCurrentLetter = letter === currentLetter
                  const imageSrc = getHandSignImage(letter)

                  return (
                    <Tooltip
                      key={letter}
                      label={`Letter ${letter}`}
                      placement="right"
                      bg={theme.textPrimary}
                      color="white"
                      borderRadius="md"
                      fontSize="xs"
                    >
                      <GridItem>
                        <Box
                          bg={isCurrentLetter ? theme.accent : "#F0EFEA"}
                          p={2}
                          borderRadius="xl"
                          textAlign="center"
                          cursor="pointer"
                          border="1px"
                          borderColor={isCurrentLetter ? theme.accent : "#E0DED8"}
                          transition="all 0.2s ease"
                          boxShadow={isCurrentLetter ? "0 4px 12px rgba(224, 122, 95, 0.3)" : "0 2px 4px rgba(0,0,0,0.06)"}
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            borderColor: isCurrentLetter ? theme.accent : theme.textMuted
                          }}
                        >
                          <Image
                            src={imageSrc}
                            alt={`${letter} hand sign`}
                            boxSize="50px"
                            objectFit="contain"
                            mx="auto"
                            mb={1}
                            opacity={isCurrentLetter ? 1 : 0.8}
                            filter={isCurrentLetter ? "brightness(10)" : "none"}
                            fallback={
                              <Box h="50px" display="flex" alignItems="center" justifyContent="center">
                                <Text fontSize="2xl" fontWeight="bold" color={isCurrentLetter ? "white" : theme.textMuted}>
                                  {letter}
                                </Text>
                              </Box>
                            }
                          />
                          <Text
                            fontSize="xs"
                            fontWeight="600"
                            color={isCurrentLetter ? "white" : theme.textSecondary}
                          >
                            {letter}
                          </Text>
                        </Box>
                      </GridItem>
                    </Tooltip>
                  )
                })}
              </Grid>
            </VStack>
          </Box>
        )}

        {/* Center - Video Feed */}
        <Box flex="1" position="relative" bg={theme.textPrimary}>
          {camState === "on" ? (
            <>
              <Webcam
                ref={webcamRef}
                id="webcam"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <canvas
                ref={canvasRef}
                id="gesture-canvas"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  zIndex: 9,
                }}
              />

              {/* Detection Overlay */}
              <Box
                position="absolute"
                top={4}
                left={4}
                zIndex={10}
              >
                <Box
                  bg="rgba(255,255,255,0.95)"
                  p={5}
                  borderRadius="2xl"
                  backdropFilter="blur(20px)"
                  boxShadow="0 8px 32px rgba(0,0,0,0.12)"
                  minW="200px"
                >
                  <Text
                    fontSize="xs"
                    color={theme.textMuted}
                    mb={2}
                    fontWeight="500"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                  >
                    Current Detection
                  </Text>
                  <Flex align="center" justify="space-between" gap={6}>
                    <Heading
                      size="3xl"
                      color={currentLetter ? theme.accent : theme.textMuted}
                      fontWeight="700"
                    >
                      {currentLetter || "—"}
                    </Heading>
                    <Box textAlign="right">
                      <Text
                        fontSize="xs"
                        color={theme.textMuted}
                        fontWeight="500"
                        mb={1}
                      >
                        Progress
                      </Text>
                      <Progress
                        value={(consecutiveCount / CONFIRMATION_THRESHOLD) * 100}
                        size="sm"
                        borderRadius="full"
                        bg={theme.border}
                        w="80px"
                        sx={{
                          '& > div': {
                            background: consecutiveCount >= CONFIRMATION_THRESHOLD
                              ? theme.success
                              : theme.accent,
                            transition: 'width 0.15s ease'
                          }
                        }}
                      />
                      <Text
                        fontSize="xs"
                        color={theme.textSecondary}
                        mt={1}
                        fontWeight="500"
                      >
                        {consecutiveCount}/{CONFIRMATION_THRESHOLD}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </Box>
            </>
          ) : (
            <Flex h="100%" align="center" justify="center" bg={theme.surface}>
              <VStack spacing={4}>
                <Box
                  p={6}
                  borderRadius="full"
                  bg={theme.border}
                >
                  <RiCameraOffFill size={48} color={theme.textMuted} />
                </Box>
                <Text color={theme.textSecondary} fontWeight="500">Camera is paused</Text>
                <Button
                  onClick={turnOffCamera}
                  bg={theme.accent}
                  color="white"
                  size="md"
                  fontWeight="500"
                  _hover={{ bg: theme.accentHover }}
                  borderRadius="lg"
                >
                  Start Camera
                </Button>
              </VStack>
            </Flex>
          )}
        </Box>

        {/* Right Panel - Translation Dashboard */}
        <Box
          w="400px"
          bg={theme.surface}
          borderLeft="1px"
          borderColor={theme.border}
          overflowY="auto"
        >
          <VStack spacing={5} p={5} align="stretch">
            {/* Current Word Builder */}
            <Box
              bg={theme.card}
              p={5}
              borderRadius="2xl"
              border="1px"
              borderColor={theme.border}
              boxShadow="0 1px 3px rgba(0,0,0,0.04)"
            >
              <HStack justify="space-between" mb={4}>
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color={theme.textMuted}
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  Current Word
                </Text>
                <HStack spacing={1}>
                  <IconButton
                    size="sm"
                    icon={<MdBackspace />}
                    bg="transparent"
                    color={theme.warning}
                    onClick={deleteLastLetter}
                    isDisabled={currentWord.length === 0}
                    title="Delete last letter"
                    _hover={{ bg: theme.surface }}
                    borderRadius="lg"
                  />
                  <IconButton
                    size="sm"
                    icon={<FiRefreshCw />}
                    bg="transparent"
                    color={theme.accent}
                    onClick={clearWord}
                    isDisabled={currentWord.length === 0}
                    title="Clear word"
                    _hover={{ bg: theme.surface }}
                    borderRadius="lg"
                  />
                </HStack>
              </HStack>
              <Box
                bg={theme.surface}
                p={4}
                borderRadius="xl"
                minH="60px"
                border="2px"
                borderColor={currentWord ? theme.accent : theme.borderLight}
                transition="border-color 0.2s ease"
              >
                <Text
                  fontSize="2xl"
                  fontWeight="600"
                  color={currentWord ? theme.textPrimary : theme.textMuted}
                >
                  {currentWord || "Start signing..."}
                </Text>
              </Box>
              <Button
                mt={4}
                w="full"
                bg={theme.accent}
                color="white"
                size="md"
                fontWeight="500"
                onClick={completeWord}
                isDisabled={currentWord.length === 0}
                _hover={{ bg: theme.accentHover }}
                _disabled={{ bg: theme.border, color: theme.textMuted }}
                borderRadius="xl"
              >
                Add Word to Sentence →
              </Button>
            </Box>

            {/* Current Sentence */}
            <Box
              bg={theme.card}
              p={5}
              borderRadius="2xl"
              border="1px"
              borderColor={theme.border}
              boxShadow="0 1px 3px rgba(0,0,0,0.04)"
            >
              <HStack justify="space-between" mb={4}>
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color={theme.textMuted}
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  Current Sentence
                </Text>
                <HStack spacing={1}>
                  <IconButton
                    size="sm"
                    icon={<MdBackspace />}
                    bg="transparent"
                    color={theme.warning}
                    onClick={deleteLastWord}
                    isDisabled={sentence.length === 0}
                    title="Delete last word"
                    _hover={{ bg: theme.surface }}
                    borderRadius="lg"
                  />
                  <IconButton
                    size="sm"
                    icon={<FiRefreshCw />}
                    bg="transparent"
                    color={theme.accent}
                    onClick={clearSentence}
                    isDisabled={sentence.length === 0}
                    title="Clear sentence"
                    _hover={{ bg: theme.surface }}
                    borderRadius="lg"
                  />
                </HStack>
              </HStack>
              <Box
                bg={theme.surface}
                p={4}
                borderRadius="xl"
                minH="80px"
                border="2px"
                borderColor={sentence ? theme.success : theme.borderLight}
                transition="border-color 0.2s ease"
              >
                <Text
                  fontSize="lg"
                  color={sentence ? theme.textPrimary : theme.textMuted}
                  fontWeight="500"
                >
                  {sentence || "Words will appear here..."}
                </Text>
              </Box>
              <Button
                mt={4}
                w="full"
                bg={theme.success}
                color="white"
                size="md"
                fontWeight="500"
                onClick={completeSentence}
                isDisabled={!sentence && !currentWord}
                _hover={{ bg: "#6A9A7F" }}
                _disabled={{ bg: theme.border, color: theme.textMuted }}
                borderRadius="xl"
              >
                Save to History ✓
              </Button>
            </Box>

            <Divider borderColor={theme.border} />

            {/* Conversation History */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color={theme.textMuted}
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                >
                  Conversation History
                </Text>
                <Badge
                  bg={theme.success}
                  color="white"
                  borderRadius="full"
                  px={2}
                  fontSize="xs"
                >
                  {conversationHistory.length}
                </Badge>
              </HStack>
              <VStack spacing={3} align="stretch" maxH="240px" overflowY="auto">
                {conversationHistory.length === 0 ? (
                  <Box
                    bg={theme.card}
                    p={5}
                    borderRadius="xl"
                    textAlign="center"
                    color={theme.textMuted}
                    border="1px"
                    borderColor={theme.border}
                  >
                    <Text fontSize="sm">No conversation yet.</Text>
                    <Text fontSize="xs" mt={1}>Start signing to begin!</Text>
                  </Box>
                ) : (
                  conversationHistory.map((item, index) => (
                    <Box
                      key={index}
                      bg={theme.card}
                      p={4}
                      borderRadius="xl"
                      border="1px"
                      borderColor={theme.border}
                      boxShadow="0 1px 3px rgba(0,0,0,0.04)"
                    >
                      <Text fontSize="md" color={theme.textPrimary} fontWeight="500" mb={2}>
                        {item.text}
                      </Text>
                      <Text fontSize="xs" color={theme.textMuted}>
                        {item.timestamp.toLocaleTimeString()}
                      </Text>
                    </Box>
                  ))
                )}
              </VStack>
            </Box>

            {/* Instructions */}
            <Box
              bg={theme.card}
              p={5}
              borderRadius="2xl"
              border="1px"
              borderColor={theme.border}
              boxShadow="0 1px 3px rgba(0,0,0,0.04)"
            >
              <Text
                fontSize="xs"
                fontWeight="600"
                color={theme.accent}
                mb={3}
                textTransform="uppercase"
                letterSpacing="0.05em"
              >
                How to Use
              </Text>
              <VStack align="start" spacing={2} fontSize="xs" color={theme.textSecondary}>
                <Text>• Show ASL hand signs to the camera</Text>
                <Text>• Hold each sign steady for ~2 seconds</Text>
                <Text>• Build words letter by letter</Text>
                <Text>• Click buttons to add words to sentences</Text>
                <Text>• Export your conversation anytime</Text>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Flex>
    </Box>
  )
}
