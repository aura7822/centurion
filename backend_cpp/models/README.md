This directory contains the ONNX models required for the Centurion backend:

## Required Models:
- `facenet_embedding.onnx` - Face recognition embeddings (512-dim feature vectors)
- `age_gender_model.onnx` - Age and gender estimation
- `ethnicity_model.onnx` - Ethnicity classification

## Model Sources:
You can obtain these models from:

1. **FaceNet**: https://github.com/serengil/deepface_models
2. **Age/Gender**: https://github.com/opencv/opencv_zoo/tree/master/models/age_gender_recognition
3. **Ethnicity**: Custom training or use FairFace model

## Converting to ONNX:
If you have PyTorch/TensorFlow models, convert them using:
```python
import torch
# Example conversion code
