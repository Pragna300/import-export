import os
from dotenv import load_dotenv

def test():
    print(f"Current Working Directory: {os.getcwd()}")
    loaded = load_dotenv()
    print(f"load_dotenv() returned: {loaded}")
    key = os.getenv("OPEN_ROUTER_API_KEY")
    if key:
        print(f"Key found! Starts with: {key[:10]}...")
    else:
        print("Key NOT found!")

if __name__ == "__main__":
    test()
