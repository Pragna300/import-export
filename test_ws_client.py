import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://127.0.0.1:8000/ws/tracking"
    print(f"🔄 Connecting to WebSocket at {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to tracking WebSocket successfully!")
            print("⏳ Listening for real-time Postgres tracking updates from the database...\n")
            print("👉 LEAVE THIS RUNNING, then go to http://127.0.0.1:8000/docs")
            print("👉 Try adding a Tracking Remark to an existing shipment or wait for an invoice to process.\n")
            
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                print(f"🔥 REAL-TIME UPDATE RECEIVED 🔥")
                print(json.dumps(data, indent=4))
                print("-" * 50)
                
    except websockets.exceptions.ConnectionClosedError:
        print("❌ Connection closed by the server.")
    except Exception as e:
        print(f"❌ Error connecting to WebSocket: {e}")
        print("💡 Make sure uvicorn is running and your DB triggers are loaded!")

if __name__ == "__main__":
    try:
        asyncio.run(test_websocket())
    except KeyboardInterrupt:
        print("\n⏹️ Stopped listening.")
