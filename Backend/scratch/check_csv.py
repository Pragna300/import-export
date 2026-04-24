import pandas as pd
try:
    df = pd.read_csv("logistics_accountant_dataset (1).csv")
    print(df.columns.tolist())
    print(df.head(2))
except Exception as e:
    print(e)
