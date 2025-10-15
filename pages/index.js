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
  ChakraProvider,
  useToast,
  Image,
  Grid,
  GridItem,
  Tooltip,
} from "@chakra-ui/react"
import { RiCameraFill, RiCameraOffFill, RiSave3Line } from "react-icons/ri"
import { FiRefreshCw, FiBook } from "react-icons/fi"
import { MdBackspace } from "react-icons/md"

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
  const SMOOTHING_FACTOR = 0.5 // 0 = no smoothing, 1 = max smoothing
  
  const toast = useToast()
  
  // Word building constants
  const CONFIRMATION_THRESHOLD = 15 // frames to confirm a letter
  const CONFIDENCE_THRESHOLD = 6.0
  const DETECTION_INTERVAL = 150 // Increased from 100ms to 150ms for stability

  // ASL Alphabet for guide
  const aslAlphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
    'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ]

  // Function to get image path for each letter from public folder
  function getHandSignImage(letter) {
    return `/handimages/${letter}hand.svg`
  }

  // Smooth landmarks using exponential moving average
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
    console.log("Handpose model loaded")
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
        // Apply smoothing to landmarks
        const smoothedLandmarks = smoothLandmarks(hand[0].landmarks)
        
        // Create new hand object with smoothed landmarks
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

        // Use smoothed landmarks for gesture estimation
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

        // Draw smoothed hand on canvas
        const ctx = canvasRef.current.getContext("2d")
        ctx.clearRect(0, 0, videoWidth, videoHeight)
        drawHand(smoothedHand, ctx)
      } else {
        // Reset smoothing when no hand detected
        previousLandmarksRef.current = null
        
        setIsDetecting(false)
        lastDetectedSignRef.current = ""
        consecutiveCountRef.current = 0
        setConsecutiveCount(0)
        setConfidenceScore(0)
        
        // Clear canvas
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

      console.log(`Counting ${letter}: ${consecutiveCountRef.current}/${CONFIRMATION_THRESHOLD} (confidence: ${confidenceScore.toFixed(2)})`)

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
      console.log(`New letter detected: ${letter} (confidence: ${confidenceScore.toFixed(2)})`)
    }
  }

  function addLetterToWord(letter) {
    setCurrentWord(prev => {
      const newWord = prev + letter
      console.log(`Letter confirmed: ${letter}, Word: ${newWord}`)

      toast({
        title: `Letter added: ${letter}`,
        status: "success",
        duration: 1000,
        position: "top",
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
        title: "Word added to sentence!",
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
    <ChakraProvider>
      <Box minH="100vh" bg="gray.900" color="white">
        {/* Header */}
        <Box bg="gray.800" borderBottom="1px" borderColor="gray.700" px={6} py={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Heading size="lg" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
                ASL Translator Dashboard
              </Heading>
              <Badge colorScheme={isDetecting ? "green" : "gray"} fontSize="sm">
                {isDetecting ? "Detecting" : "Ready"}
              </Badge>
              <Badge colorScheme={confidenceScore > CONFIDENCE_THRESHOLD ? "green" : "yellow"} fontSize="xs">
                Conf: {confidenceScore.toFixed(1)}
              </Badge>
            </HStack>
            <HStack spacing={3}>
              <Button
                onClick={() => setShowGuide(!showGuide)}
                leftIcon={<FiBook />}
                colorScheme="purple"
                size="sm"
                variant={showGuide ? "solid" : "outline"}
              >
                {showGuide ? "Hide" : "Show"} Guide
              </Button>
              <Button
                onClick={turnOffCamera}
                leftIcon={camState === "on" ? <RiCameraOffFill /> : <RiCameraFill />}
                colorScheme={camState === "on" ? "red" : "green"}
                size="sm"
              >
                {camState === "on" ? "Stop" : "Start"}
              </Button>
              <Button
                onClick={saveConversation}
                leftIcon={<RiSave3Line />}
                colorScheme="blue"
                size="sm"
                isDisabled={conversationHistory.length === 0}
              >
                Export
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* Main Content */}
        <Flex h="calc(100vh - 80px)">
          {/* Left Sidebar - ASL Guide */}
          {showGuide && (
            <Box w="280px" bg="gray.800" borderRight="1px" borderColor="gray.700" overflowY="auto">
              <VStack spacing={0} align="stretch">
                <Box bg="gray.900" p={3} position="sticky" top={0} zIndex={1} borderBottom="1px" borderColor="gray.700">
                  <Text fontSize="sm" fontWeight="bold" color="blue.300" textAlign="center">
                    ASL ALPHABET GUIDE
                  </Text>
                </Box>
                <Grid templateColumns="repeat(3, 1fr)" gap={3} p={3}>
                  {aslAlphabet.map((letter) => {
                    const isCurrentLetter = letter === currentLetter
                    const imageSrc = getHandSignImage(letter)
                    
                    return (
                      <Tooltip key={letter} label={`Letter ${letter} - ASL Hand Sign`} placement="right">
                        <GridItem>
                          <Box
                            bg={isCurrentLetter ? "blue.600" : "gray.700"}
                            p={2}
                            borderRadius="md"
                            textAlign="center"
                            cursor="pointer"
                            border="2px"
                            borderColor={isCurrentLetter ? "blue.400" : "transparent"}
                            transition="all 0.2s"
                            _hover={{ bg: isCurrentLetter ? "blue.700" : "gray.600", transform: "scale(1.05)" }}
                          >
                            <Image 
                              src={imageSrc}
                              alt={`${letter} hand sign`}
                              boxSize="60px"
                              objectFit="contain"
                              mx="auto"
                              mb={1}
                              fallback={
                                <Box h="60px" display="flex" alignItems="center" justifyContent="center">
                                  <Text fontSize="3xl" fontWeight="bold" color="gray.400">
                                    {letter}
                                  </Text>
                                </Box>
                              }
                              onError={(e) => {
                                console.log(`Failed to load: ${imageSrc}`)
                              }}
                            />
                            <Text fontSize="xs" fontWeight="bold" color={isCurrentLetter ? "white" : "gray.300"}>
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
          <Box flex="1" position="relative" bg="black">
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
                  right={4}
                  zIndex={10}
                >
                  <VStack align="stretch" spacing={3}>
                    <Box bg="blackAlpha.700" p={4} borderRadius="lg" backdropFilter="blur(10px)">
                      <Text fontSize="sm" color="gray.400" mb={2}>Current Detection</Text>
                      <Flex align="center" justify="space-between">
                        <Heading size="3xl" color="blue.400">
                          {currentLetter || "-"}
                        </Heading>
                        <Box>
                          <Text fontSize="xs" color="gray.500">Confirmation</Text>
                          <Text 
                            fontSize="2xl" 
                            fontWeight="bold" 
                            color={consecutiveCount >= CONFIRMATION_THRESHOLD ? "green.400" : consecutiveCount > 0 ? "yellow.400" : "gray.500"}
                          >
                            {consecutiveCount}/{CONFIRMATION_THRESHOLD}
                          </Text>
                          <Text fontSize="xs" color="gray.400" mt={1}>
                            Conf: {confidenceScore.toFixed(1)}
                          </Text>
                        </Box>
                      </Flex>
                    </Box>
                  </VStack>
                </Box>
              </>
            ) : (
              <Flex h="100%" align="center" justify="center">
                <VStack spacing={4}>
                  <RiCameraOffFill size={64} color="gray" />
                  <Text color="gray.500">Camera is off</Text>
                </VStack>
              </Flex>
            )}
          </Box>

          {/* Right Panel - Translation Dashboard */}
          <Box w="420px" bg="gray.800" borderLeft="1px" borderColor="gray.700" overflowY="auto">
            <VStack spacing={6} p={6} align="stretch">
              {/* Current Word Builder */}
              <Box bg="gray.900" p={5} borderRadius="lg" border="1px" borderColor="gray.700">
                <HStack justify="space-between" mb={3}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.400">
                    CURRENT WORD
                  </Text>
                  <HStack spacing={2}>
                    <IconButton
                      size="xs"
                      icon={<MdBackspace />}
                      colorScheme="orange"
                      variant="ghost"
                      onClick={deleteLastLetter}
                      isDisabled={currentWord.length === 0}
                      title="Delete last letter"
                    />
                    <IconButton
                      size="xs"
                      icon={<FiRefreshCw />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={clearWord}
                      isDisabled={currentWord.length === 0}
                      title="Clear word"
                    />
                  </HStack>
                </HStack>
                <Box
                  bg="gray.800"
                  p={4}
                  borderRadius="md"
                  minH="60px"
                  border="2px"
                  borderColor="blue.500"
                >
                  <Text fontSize="2xl" fontWeight="bold" color="blue.300">
                    {currentWord || "..."}
                  </Text>
                </Box>
                <Button
                  mt={3}
                  w="full"
                  colorScheme="blue"
                  size="sm"
                  onClick={completeWord}
                  isDisabled={currentWord.length === 0}
                >
                  Add Word to Sentence →
                </Button>
              </Box>

              {/* Current Sentence */}
              <Box bg="gray.900" p={5} borderRadius="lg" border="1px" borderColor="gray.700">
                <HStack justify="space-between" mb={3}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.400">
                    CURRENT SENTENCE
                  </Text>
                  <HStack spacing={2}>
                    <IconButton
                      size="xs"
                      icon={<MdBackspace />}
                      colorScheme="orange"
                      variant="ghost"
                      onClick={deleteLastWord}
                      isDisabled={sentence.length === 0}
                      title="Delete last word"
                    />
                    <IconButton
                      size="xs"
                      icon={<FiRefreshCw />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={clearSentence}
                      isDisabled={sentence.length === 0}
                      title="Clear sentence"
                    />
                  </HStack>
                </HStack>
                <Box
                  bg="gray.800"
                  p={4}
                  borderRadius="md"
                  minH="80px"
                  border="2px"
                  borderColor="purple.500"
                >
                  <Text fontSize="lg" color="purple.300">
                    {sentence || "..."}
                  </Text>
                </Box>
                <Button
                  mt={3}
                  w="full"
                  colorScheme="purple"
                  size="sm"
                  onClick={completeSentence}
                  isDisabled={!sentence && !currentWord}
                >
                  Save to History ✓
                </Button>
              </Box>

              <Divider borderColor="gray.700" />

              {/* Conversation History */}
              <Box>
                <HStack justify="space-between" mb={3}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.400">
                    CONVERSATION HISTORY
                  </Text>
                  <Badge colorScheme="green">{conversationHistory.length}</Badge>
                </HStack>
                <VStack spacing={3} align="stretch" maxH="280px" overflowY="auto">
                  {conversationHistory.length === 0 ? (
                    <Box
                      bg="gray.900"
                      p={4}
                      borderRadius="md"
                      textAlign="center"
                      color="gray.500"
                    >
                      No conversation yet. Start signing!
                    </Box>
                  ) : (
                    conversationHistory.map((item, index) => (
                      <Box
                        key={index}
                        bg="gray.900"
                        p={4}
                        borderRadius="md"
                        border="1px"
                        borderColor="gray.700"
                      >
                        <Text fontSize="md" mb={2}>{item.text}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {item.timestamp.toLocaleTimeString()}
                        </Text>
                      </Box>
                    ))
                  )}
                </VStack>
              </Box>

              {/* Instructions */}
              <Box bg="blue.900" p={4} borderRadius="lg" border="1px" borderColor="blue.700">
                <Text fontSize="xs" fontWeight="bold" color="blue.300" mb={2}>
                  HOW TO USE
                </Text>
                <VStack align="start" spacing={1} fontSize="xs" color="gray.400">
                  <Text>• Guide shows all ASL hand signs (3 columns)</Text>
                  <Text>• Hold sign for {CONFIRMATION_THRESHOLD} frames (2.25 sec)</Text>
                  <Text>• Landmarks are smoothed for stability</Text>
                  <Text>• Current letter highlights in blue</Text>
                  <Text>• Build words letter by letter</Text>
                  <Text>• Click buttons to add word/save sentence</Text>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Flex>
      </Box>
    </ChakraProvider>
  )
}
