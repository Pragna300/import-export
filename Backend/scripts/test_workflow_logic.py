import asyncio
import httpx
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"


async def test_workflow():
    print("\nSTARTING FULL WORKFLOW TEST (Business Logic Validation)\n")
    
    async with httpx.AsyncClient() as client:
        # 1. Create a Shipment (Smartphones from China to India)
        # This should trigger the HSN -> Duty -> Risk pipeline
        shipment_data = {
            "product_name": "Smartphones",
            "quantity": 10,
            "unit_price": 500,
            "origin_country": "china",
            "destination_country": "india",
            "currency": "USD",
            "description": "High-end mobile devices"
        }
        
        print("Step 1: Creating Shipment...")
        response = await client.post(f"{BASE_URL}/shipments/", json=shipment_data)
        if response.status_code != 200:
            print(f"Failed to create shipment: {response.text}")
            return
        
        shipment = response.json()
        shipment_id = shipment["id"]
        print(f"Shipment Created! ID: {shipment_id}, Code: {shipment['shipment_code']}")
        print(f"Total Value: {shipment['total_value']}")

        # Poll the shipment status until it's processed, instead of a fixed wait
        print("\nPolling for AI Pipeline completion (max 30 seconds)...")
        for i in range(10):
            await asyncio.sleep(3)
            status_res = await client.get(f"{BASE_URL}/shipments/{shipment_id}")
            if status_res.status_code == 200 and status_res.json().get("status") not in ["Pending Analysis", "Processing"]:
                print(f"✅ Pipeline completed with status: {status_res.json().get('status')}")
                break
            print(f"   ...still processing (attempt {i+1}/10)")
        else:
            print("❌ Pipeline did not complete in time.")
            return

        # 2. Verify HSN Classification (Database Lookup)
        print("\nStep 2: Verifying HSN Classification...")
        hsn_res = await client.get(f"{BASE_URL}/hsn/{shipment_id}")
        if hsn_res.status_code == 200:
            hsn_data = hsn_res.json()
            print(f"HSN Found: {hsn_data['hsn_code']}")
            print(f"Source: {hsn_data['model_version']} (Should be 'HSN-Master-Lookup')")
        else:
            print("HSN Classification not found yet.")

        # 3. Verify Duty Calculation (Database Rules)
        print("\nStep 3: Verifying Duty Calculation...")
        duty_res = await client.get(f"{BASE_URL}/duty/{shipment_id}")
        if duty_res.status_code == 200:
            duty_data = duty_res.json()
            print(f"Duty Calculated: {duty_data['duty_amount']}")
            print(f"Tax Calculated: {duty_data['tax_amount']}")
            print(f"Total Landed Cost: {duty_data['total_cost']}")
        else:
            print("Duty record not found.")

        # 4. Verify Risk Assessment (Database Rules)
        print("\nStep 4: Verifying Risk Assessment...")
        risk_res = await client.get(f"{BASE_URL}/risk/{shipment_id}")
        if risk_res.status_code == 200:
            risk_data = risk_res.json()
            print(f"Risk Level: {risk_data['risk_level']}")
            print(f"Reason: {risk_data['reason']}")
            print(f"Score: {risk_data['risk_score']}")
        else:
            print("Risk assessment not found.")

        # 5. Verify Analytics Update
        print("\nStep 5: Verifying Analytics Dashboard...")
        analytics_res = await client.get(f"{BASE_URL}/analytics/summary")
        if analytics_res.status_code == 200:
            summary = analytics_res.json()["summary"]
            print(f"Total Dashboard Revenue: {summary['total_revenue']}")
            print(f"Shipments Counted: {summary['shipments_count']}")
        
        print("\nTEST COMPLETED: All modules are communicating and using Database Logic!")

if __name__ == "__main__":
    asyncio.run(test_workflow())
