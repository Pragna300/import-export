# hsn_preprocessing.py
import re
import numpy as np
import torch
from gensim.models import Word2Vec

def clean_product_description(text: str) -> str:
    # Convert to lowercase and keep only alphanumeric characters and spaces [5]
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    # Remove strings of pure digits longer than 6 (removes leaked HS/HTS codes) [8]
    text = re.sub(r'\b\d{7,}\b', '', text)
    return text.strip()

def tokenize_and_pad(text: str, word2idx: dict, max_len: int = 16) -> torch.Tensor:
    # Limit sequence length to 16 tokens, padding shorter texts with zeros [9]
    tokens = clean_product_description(text).split()
    indices = [word2idx.get(token, 0) for token in tokens[:max_len]]
    
    # Pad with zeros if shorter than max_len
    if len(indices) < max_len:
        indices += [0] * (max_len - len(indices))
        
    return torch.tensor(indices, dtype=torch.long).unsqueeze(0) # Add batch dimension
