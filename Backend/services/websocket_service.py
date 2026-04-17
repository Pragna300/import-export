import asyncio
import json
import os
import asyncpg
from typing import List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending message to websocket: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

async def listen_to_pg_tracking():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("ws listener: DATABASE_URL not found.")
        return

    # asyncpg expects postgres:// instead of postgresql+asyncpg://
    db_url_for_asyncpg = DATABASE_URL.replace("postgresql+asyncpg://", "postgres://")
    
    try:
        conn = await asyncpg.connect(db_url_for_asyncpg)
        
        async def handle_tracking_update(connection, pid, channel, payload):
            print(f"PG Notification received on channel {channel}: {payload}")
            try:
                data = json.loads(payload)
                # Broadcast the raw data received from DB trigger
                asyncio.create_task(manager.broadcast_json({"type": "tracking_update", "data": data}))
            except json.JSONDecodeError:
                print("Failed to decode JSON payload from PG notification.")

        # Listen to the pg_notify channel defined in db.sql
        await conn.add_listener('tracking_update', handle_tracking_update)
        print("Listening for PostgreSQL notifications on 'tracking_update'")

        # Keep the connection alive
        while True:
            await asyncio.sleep(60)

    except Exception as e:
        print(f"Error in listen_to_pg_tracking: {e}")
        # Retry connection after some time
        await asyncio.sleep(5)
        asyncio.create_task(listen_to_pg_tracking())
