# ASL Hand Sign Language Translator

A repository for training and running a hand-sign recognition system targeting American Sign Language (ASL). The project uses computer-vision techniques and deep learning to recognize static hand signs (for example, the ASL alphabet) from images or webcam streams and map them to text.

This README provides setup instructions, usage examples, and guidance for training and extending the system.

## Table of contents

- [Project overview](#project-overview)
- [Features](#features)
- [Repository structure](#repository-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Dataset](#dataset)
- [Preprocessing](#preprocessing)
- [Training](#training)
- [Evaluation](#evaluation)
- [Inference / Usage](#inference--usage)
- [Deployment ideas](#deployment-ideas)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Project overview

The goal of this project is to convert hand-sign inputs into readable text by:

- Detecting and isolating the hand region from images or video.
- Extracting features suitable for sign classification.
- Using a learnable model to classify signs (e.g., ASL alphabet).
- Providing tools for training, evaluation, and inference (image and webcam modes).

This repository contains scripts and utilities for preparing data, training models, running inference, and evaluating performance. The code is structured so you can replace models, datasets, or preprocessing pipelines with minimal changes.

## Features

- Training pipeline for supervised sign classification.
- Inference utilities for single-image and webcam-based recognition.
- Dataset preprocessing and augmentation utilities.
- Evaluation scripts to generate common metrics (accuracy, confusion matrix).
- Configurable training via command-line flags or config files.

## Repository structure

A suggested layout (adapt to the repository contents):

- data/                 - raw and processed datasets (not checked into repo)
- notebooks/            - experiments and EDA notebooks
- src/                  - main code (data loaders, models, training, inference)
  - preprocessing.py
  - dataset.py
  - model.py
  - train.py
  - evaluate.py
  - predict.py
- configs/              - configuration files for experiments
- requirements.txt
- README.md

If the repository contents differ, adapt the commands below to the actual filenames and locations.

## Requirements

- Python 3.8+
- pip
- Common packages: numpy, pandas, scikit-learn, matplotlib, opencv-python, torch or tensorflow (depending on the implementation)

Install exact dependencies from `requirements.txt` when available.

## Installation

1. Clone the repository

   git clone https://github.com/shourya-khatiyan/asl-hand-sign-language-translator.git
   cd asl-hand-sign-language-translator

2. Create and activate a virtual environment (recommended)

   python -m venv venv
   source venv/bin/activate   # macOS / Linux
   venv\Scripts\activate      # Windows (PowerShell)

3. Install dependencies

   pip install -r requirements.txt

If a requirements file is not present, install core packages manually, for example:

   pip install numpy opencv-python matplotlib scikit-learn torch torchvision

Adjust package choices if the project uses TensorFlow instead of PyTorch.

## Dataset

This project expects a dataset of labeled hand-sign images. Typical layout:

- data/
  - train/
    - A/
      - img1.jpg
      - img2.jpg
    - B/
    - ...
  - val/
  - test/

If you are using a public ASL alphabet dataset (for example, the Kaggle ASL Alphabet dataset), download and place it under `data/` following the structure above. Ensure labels match folder names.

Dataset notes:
- Images should be RGB or converted to grayscale consistently.
- Resize all images to a consistent input size (e.g., 128x128 or 224x224).
- Split data into train/validation/test sets to measure generalization.

## Preprocessing

Typical preprocessing steps:

- Resize images to model input size.
- Normalize pixel values (e.g., scale to [0, 1] or standardize per-channel).
- Optional: detect and crop the hand region (using a hand detector or landmark model such as MediaPipe).
- Data augmentation: rotations, flips (careful with symmetric signs), brightness/contrast jitter.

Example (conceptual) usage:

   python src/preprocessing.py --input-dir data/raw --output-dir data/processed --size 224

Replace with the actual preprocessing script and flags in the repository.

## Training

A typical training run:

   python src/train.py --config configs/train.yaml

Common configurable options:
- model architecture (CNN backbone, number of classes)
- input size and batch size
- learning rate and optimizer settings
- number of epochs
- checkpoint/save directory

Example CLI (if train.py supports flags):

   python src/train.py --data data/processed --epochs 50 --batch-size 32 --lr 0.001 --save-dir checkpoints/

Check the training script in `src/` or the configs in `configs/` for the exact parameters.

Tips:
- Start with a small subset of the data and a small number of epochs to validate the pipeline.
- Use pretrained backbones (e.g., ResNet) if available to speed up convergence.
- Monitor validation accuracy and loss to avoid overfitting.

## Evaluation

Evaluate model performance on the test set:

   python src/evaluate.py --model checkpoints/best.pt --data data/test

Common metrics:
- Accuracy
- Precision / Recall / F1 per class
- Confusion matrix (useful to see common confusions between letters/signs)

Save evaluation outputs and confusion matrices for monitoring improvements.

## Inference / Usage

Single image:

   python src/predict.py --model checkpoints/best.pt --image examples/hand_A.jpg

Webcam (real-time inference):

   python src/predict.py --model checkpoints/best.pt --webcam 0

Replace file and flag names to match the repository's actual scripts. The `predict.py` script typically provides options for webcam, video file, and single-image inference, and may offer output overlays.

## Deployment ideas

- Wrap the inference code in a small REST API (FastAPI or Flask) to provide predictions via HTTP.
- Optimize model for mobile/edge use with ONNX or TensorFlow Lite.
- Add a simple web UI for live webcam translation and text output.

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes and add tests where appropriate.
4. Open a pull request describing your changes.

Please follow standard coding practices:
- Keep commits focused and well described.
- Add or update documentation for new features or breaking changes.
- Include references to papers or datasets if relevant.

## Acknowledgements

- I cloned this repo from someone about an year ago, I forgot his name :). Even though there is very less content of his left in this repo because I entirely modified this project. 
- Datasets and community contributions used for training and evaluation.
- Any libraries or implementations you built on (OpenCV, PyTorch/TensorFlow, MediaPipe, etc.).
