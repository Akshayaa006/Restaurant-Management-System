from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        # KDS / Kitchen screen connections
        self.kitchen_connections: Set[WebSocket] = set()
        # Customer connections watching a specific order: order_id -> WebSockets
        self.order_connections: Dict[str, Set[WebSocket]] = {}

    async def connect_kitchen(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.kitchen_connections.add(websocket)
        print(
            f"KDS WebSocket connected. Active kitchen streams: {len(self.kitchen_connections)}"
        )

    def disconnect_kitchen(self, websocket: WebSocket) -> None:
        if websocket in self.kitchen_connections:
            self.kitchen_connections.remove(websocket)
        print(
            f"KDS WebSocket disconnected. Active kitchen streams: {len(self.kitchen_connections)}"
        )

    async def connect_order(self, order_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if order_id not in self.order_connections:
            self.order_connections[order_id] = set()
        self.order_connections[order_id].add(websocket)
        print(
            f"Customer WebSocket connected for order {order_id}. Watchers: {len(self.order_connections[order_id])}"
        )

    def disconnect_order(self, order_id: str, websocket: WebSocket) -> None:
        if order_id in self.order_connections:
            if websocket in self.order_connections[order_id]:
                self.order_connections[order_id].remove(websocket)
            if not self.order_connections[order_id]:
                del self.order_connections[order_id]
        print(
            f"Customer WebSocket disconnected for order {order_id}."
        )

    async def broadcast_kitchen(self, message: dict) -> None:
        """
        Sends JSON message packet to all connected KDS monitors.
        """
        disconnected = []
        for connection in self.kitchen_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect_kitchen(connection)

    async def send_order_update(self, order_id: str, message: dict) -> None:
        """
        Sends JSON message status updates to all customers watching order_id.
        """
        if order_id in self.order_connections:
            disconnected = []
            for connection in self.order_connections[order_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)

            for connection in disconnected:
                self.disconnect_order(order_id, connection)


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws/kitchen")
async def websocket_kitchen(websocket: WebSocket) -> None:
    await manager.connect_kitchen(websocket)
    try:
        while True:
            # Continuous listener to monitor connection state / heartbeats
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_kitchen(websocket)
    except Exception:
        manager.disconnect_kitchen(websocket)


@router.websocket("/ws/orders/{order_id}")
async def websocket_order(websocket: WebSocket, order_id: str) -> None:
    await manager.connect_order(order_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_order(order_id, websocket)
    except Exception:
        manager.disconnect_order(order_id, websocket)
