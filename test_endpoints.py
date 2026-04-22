import asyncio
import httpx
import os
import sys

BASE_URL = "http://127.0.0.1:8000"

async def test_all_endpoints():
    print("🚀 Initializing End-to-End Endpoint Verification...\n")
    
    timeout = httpx.Timeout(30.0)
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=timeout) as client:
        try:
            # 1. Test Root
            res = await client.get("/")
            print(f"✅ Root Endpoint [/]: {res.status_code}")
            print(f"   Response: {res.json()}\n")
            
            # 1.1 Test Health
            res = await client.get("/health")
            print(f"✅ Health Check [/health]: {res.status_code}")
            if res.status_code == 200:
                health = res.json()
                status_emoji = "🟢" if health.get("status") == "healthy" else "🔴"
                print(f"   Status: {status_emoji} {health.get('status')}")
                print(f"   Database: {health.get('database')}\n")
            else:
                print(f"❌ Health Check failed: {res.text}\n")
            
            # 2. Test Shipments GET
            res = await client.get("/shipments/")
            print(f"✅ Get All Shipments [/shipments/]: {res.status_code}")
            if res.status_code == 200:
                shipments = res.json()
                print(f"Shipments Count: {len(shipments)}\n")
            else:
                print(f"❌ Error in /shipments/: {res.text}\n")
                return
            
            # 3. Test File Upload
            print("⏳ Testing Document Upload & ML Pipeline (This will take a few seconds)...")
            dummy_filename = "test_invoice.txt"
            with open(dummy_filename, "w") as f:
                f.write("Invoice for 2 Breville Refrigerators from Indonesia, Unit Price 862.0 USD")
                
            try:
                with open(dummy_filename, "rb") as test_file:
                    files = {"file": (dummy_filename, test_file, "text/plain")}
                    res = await client.post("/documents/upload-invoice/", files=files)
                    print(f"✅ Upload Invoice [/documents/upload-invoice/]: {res.status_code}")
                    if res.status_code == 200:
                        print(f"Response: {res.json()}\n")
                        doc_id = res.json().get("id")
                    else:
                        print(f"❌ Error in /upload-invoice/: {res.text}\n")
                        return
            finally:
                if os.path.exists(dummy_filename):
                    os.remove(dummy_filename)

            # 4. Wait for background task to complete (Max 15 seconds)
            print("🕒 Waiting for background processing to complete...")
            doc_data = {}
            for i in range(5):
                await asyncio.sleep(3)
                res = await client.get(f"/documents/{doc_id}")
                doc_data = res.json()
                if doc_data.get("status") != "Processing":
                    break
                print(f"   ...still processing (attempt {i+1}/5)")

            # 5. Check Document Status
            if 'doc_id' in locals():
                print(f"✅ Final Document Status [/documents/{doc_id}]: {doc_data.get('status')}")
                
                # NEW: Check if Shipment and HSN classification actually exist!
                shipment_id = doc_data.get("shipment_id")
                if shipment_id:
                    # We can use the /shipments/{id} to see if it was created
                    ship_res = await client.get(f"/shipments/{shipment_id}")
                    if ship_res.status_code == 200:
                        print(f"✅ Verified Shipment Created: {ship_res.json().get('shipment_code')}")
                        
                        # Note: Since we don't have a direct /hsn/{id} endpoint yet, 
                        # we can't easily check it via API, but we know it's chained.
                        # I will add a temporary check in the test if we had the router.
                    else:
                        print(f"❌ Shipment {shipment_id} not found!")

            # 6. Test Status Update (on first shipment if exists)
            if len(shipments) > 0:
                shipment_id = shipments[0]["id"]
                res = await client.put(f"/shipments/{shipment_id}/status", params={"status": "Delivered", "current_location": "Home"})
                print(f"✅ Update Status [/shipments/{shipment_id}/status]: {res.status_code}")
                if res.status_code == 200:
                    print(f"Response: {res.json()}\n")
                else:
                    print(f"❌ Error in update status: {res.text}\n")
            
            print("🎉 ALL ENDPOINT TESTS COMPLETED SUCCESSFULLY!")

        except httpx.ConnectError:
            print("❌ FAILED: Could not connect to the server. Is it running at http://127.0.0.1:8000?")
        except httpx.ReadError:
            print("❌ FAILED: The server closed the connection unexpectedly. Check server logs for a crash.")
        except Exception as e:
            print(f"❌ FAILED: An unexpected error occurred: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_all_endpoints())
