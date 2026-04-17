# services/hsn_model.py
import torch
import torch.nn as nn
import torch.nn.functional as F

class HSNClassifierCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim=300, num_classes=99): # 99 for HS-2 chapters [13]
        super(HSNClassifierCNN, self).__init__()
        
        # Embedding layer [4]
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        
        # 4 Convolutional channels with 256 filters each and sizes 2, 3, 4, 5 [10]
        self.conv1 = nn.Conv1d(in_channels=embed_dim, out_channels=256, kernel_size=2)
        self.conv2 = nn.Conv1d(in_channels=embed_dim, out_channels=256, kernel_size=3)
        self.conv3 = nn.Conv1d(in_channels=embed_dim, out_channels=256, kernel_size=4)
        self.conv4 = nn.Conv1d(in_channels=embed_dim, out_channels=256, kernel_size=5)
        
        # Batch Normalization [12, 14]
        self.bn = nn.BatchNorm1d(1024) # 256 filters * 4 channels
        
        # Fully connected layers [12]
        self.fc1 = nn.Linear(1024, 512)
        self.fc2 = nn.Linear(512, num_classes)

    def forward(self, x):
        # x shape: (batch_size, sequence_length)
        x = self.embedding(x).permute(0, 2, 1) # Reshape for Conv1d: (batch_size, embed_dim, seq_len)
        
        # Apply convolutions and ReLU [12]
        c1 = F.relu(self.conv1(x))
        c2 = F.relu(self.conv2(x))
        c3 = F.relu(self.conv3(x))
        c4 = F.relu(self.conv4(x))
        
        # Max-over-time pooling [15]
        p1 = F.max_pool1d(c1, c1.size(2)).squeeze(2)
        p2 = F.max_pool1d(c2, c2.size(2)).squeeze(2)
        p3 = F.max_pool1d(c3, c3.size(2)).squeeze(2)
        p4 = F.max_pool1d(c4, c4.size(2)).squeeze(2)
        
        # Concatenate pooled features [16]
        cat = torch.cat((p1, p2, p3, p4), dim=1)
        
        # Apply Batch Normalization & Fully Connected layers [12]
        cat = self.bn(cat)
        out = F.relu(self.fc1(cat))
        out = self.fc2(out) # CrossEntropyLoss applies Softmax automatically
        
        return out