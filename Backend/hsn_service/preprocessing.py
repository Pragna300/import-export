import re

import torch


def clean_product_description(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\b\d{7,}\b", "", text)
    return text.strip()


def tokenize_and_pad(text: str, word2idx: dict, max_len: int = 16) -> torch.Tensor:
    tokens = clean_product_description(text).split()
    indices = [word2idx.get(token, 0) for token in tokens[:max_len]]
    if len(indices) < max_len:
        indices += [0] * (max_len - len(indices))
    return torch.tensor(indices, dtype=torch.long).unsqueeze(0)
