# services/hsn_service.py
import torch
import torch.nn.functional as F
from services.hsn_model import HSNClassifierCNN
from services.hsn_preprocessing import tokenize_and_pad

# Global variables to hold the loaded model and vocabulary mapping
model = None
word2idx = {}
idx2hsn = {}

def load_hsn_model():
    global model, word2idx, idx2hsn
    # In production, you will load your trained model weights here:
    # model.load_state_dict(torch.load("hsn_model_weights.pth"))
    
    # Initialize dummy components for now so the pipeline runs
    vocab_size = 20000 # Top 20k words [17]
    model = HSNClassifierCNN(vocab_size=vocab_size, embed_dim=300, num_classes=99)
    model.eval()
    word2idx = {"dummy": 1} # Load your actual vocabulary JSON here
    idx2hsn = {i: str(i).zfill(2) for i in range(99)} # Maps index 84 to HS code "84"

async def predict_hsn_code(product_name: str) -> dict:
    if model is None:
        load_hsn_model()
        
    # Convert text to tensor
    tensor_input = tokenize_and_pad(product_name, word2idx)
    
    # Run inference without tracking gradients
    with torch.no_grad():
        logits = model(tensor_input)
        probabilities = F.softmax(logits, dim=1) # Get confidence percentages [18]
        
        # Get highest probability [19]
        confidence_score, predicted_idx = torch.max(probabilities, dim=1)
        
    hsn_code = idx2hsn.get(predicted_idx.item(), "Unknown")
    
    return {
        "hsn_code": hsn_code,
        "confidence_score": round(confidence_score.item() * 100, 2),
        "model_version": "CNN-v1.0"
    }