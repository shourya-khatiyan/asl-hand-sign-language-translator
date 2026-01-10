import React from "react"
import handImages from "../public/handImages.svg"
import {
  Text,
  Button,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react"

export default function About() {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <div>
      <Button onClick={onOpen} colorScheme="orange">
        Learn More
      </Button>

      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>American Sign Language (ASL)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm">
              American Sign Language (ASL) is a visual language that serves as
              the predominant sign language of Deaf communities in the United
              States and most of Canada.<br></br>
              Here's the list of ASL hand gestures for the alphabet.
            </Text>
            <Image src={handImages} alt="ASL Alphabet Reference" />
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
