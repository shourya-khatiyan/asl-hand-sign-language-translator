# ASL Hand Sign Translator

Real-time American Sign Language (ASL) alphabet translator using TensorFlow.js and the Handpose model.

## Features

- Real-time hand detection and tracking via webcam
- ASL alphabet recognition (A-Z)
- Word and sentence building from detected letters
- Conversation history with export functionality
- Visual ASL alphabet reference guide

## Tech Stack

- Next.js
- TensorFlow.js
- Handpose Model
- Fingerpose (gesture recognition)
- Chakra UI
- React Webcam

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Webcam

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/asl-hand-sign-translator.git

# Navigate to project directory
cd asl-hand-sign-translator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Allow camera access when prompted
2. Position your hand clearly in front of the camera
3. Form ASL hand signs for letters A-Z
4. Hold each sign steady for about 2 seconds to confirm
5. Build words letter by letter
6. Use the buttons to add words to sentences and save to history
7. Export your conversation using the Export button

## How It Works

The application uses TensorFlow.js Handpose model to detect hand landmarks in real-time. These landmarks are then analyzed using Fingerpose library to match against predefined ASL alphabet gestures. A smoothing algorithm is applied to landmarks for stability, and a confirmation threshold ensures accurate letter detection.

## License

BSD-2-Clause License
