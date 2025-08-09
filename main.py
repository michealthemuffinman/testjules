import asyncio
import json
import random
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

# --- App Setup ---
app = FastAPI()

# --- Connection Management ---
class ConnectionManager:
    def __init__(self):
        # Store connections with player_id to easily manage them
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.active_connections[player_id] = websocket

    def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            del self.active_connections[player_id]

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

manager = ConnectionManager()

# --- Game State and Settings ---
players = {}
food = {}
grid_size = 20
board_width = 800 // grid_size
board_height = 600 // grid_size

# --- Game Logic Functions ---
def create_food():
    food_id = str(uuid.uuid4())
    # Find a safe spot for the food
    while True:
        position = {
            "x": random.randint(0, board_width - 1),
            "y": random.randint(0, board_height - 1),
        }
        # Check if position overlaps with any snake
        on_snake = any(
            segment == position
            for player in players.values()
            for segment in player.get("body", [])
        )
        if not on_snake:
            food[food_id] = position
            break

def get_safe_spawn_point():
    while True:
        spawn_point = {
            "x": random.randint(0, board_width - 1),
            "y": random.randint(0, board_height - 1),
        }
        on_snake = any(
            segment == spawn_point
            for player in players.values()
            for segment in player.get("body", [])
        )
        if not on_snake:
            return spawn_point

def add_ai_player():
    player_id = f"ai-{uuid.uuid4()}"
    spawn_point = get_safe_spawn_point()
    players[player_id] = {
        "id": player_id,
        "ws": None,
        "direction": {"dx": 1, "dy": 0},
        "body": [spawn_point],
        "score": 0,
        "state": "playing",
        "is_ai": True,
    }
    print(f"AI Player added: {player_id}")

def update_ai_directions():
    # (Simplified AI logic for brevity, can be expanded)
    active_snakes = [p for p in players.values() if p["state"] == "playing"]

    for player in players.values():
        if not player.get("is_ai") or player["state"] != "playing":
            continue

        head = player["body"][0]

        # Simple logic: try to move in current direction, if unsafe, try a random safe direction
        potential_moves = [
            player["direction"], # Current direction
            {"dx": 0, "dy": 1}, {"dx": 0, "dy": -1}, {"dx": 1, "dy": 0}, {"dx": -1, "dy": 0} # All directions
        ]

        def is_safe(dx, dy):
            next_head = {"x": head["x"] + dx, "y": head["y"] + dy}
            if not (0 <= next_head["x"] < board_width and 0 <= next_head["y"] < board_height):
                return False
            for other_player in active_snakes:
                if next_head in other_player["body"]:
                    return False
            return True

        random.shuffle(potential_moves)
        for move in potential_moves:
            if is_safe(move["dx"], move["dy"]) and (move["dx"] != -player["direction"]["dx"] or move["dy"] != -player["direction"]["dy"]):
                player["direction"] = move
                break

# --- Main Game Loop ---
async def game_loop():
    while True:
        await asyncio.sleep(0.1)  # 10 ticks per second

        update_ai_directions()

        all_players = list(players.values())
        active_snakes = [p for p in all_players if p["state"] == "playing"]

        for player in all_players:
            if player["state"] != "playing":
                continue

            head = player["body"][0]
            new_head = {"x": head["x"] + player["direction"]["dx"], "y": head["y"] + player["direction"]["dy"]}

            collided = False
            if not (0 <= new_head["x"] < board_width and 0 <= new_head["y"] < board_height):
                collided = True
            if not collided:
                for other_player in active_snakes:
                    if new_head in other_player["body"]:
                        collided = True
                        break

            if collided:
                player["state"] = "dead"
                if player["ws"]:
                    # This needs to be run in a task to not block the loop
                    asyncio.create_task(player["ws"].send_text(json.dumps({"type": "game_over"})))
                elif player["is_ai"]:
                    # Schedule respawn
                    asyncio.create_task(respawn_ai(player["id"]))
                continue

            player["body"].insert(0, new_head)

            ate_food = False
            for food_id, food_pos in list(food.items()):
                if new_head == food_pos:
                    player["score"] += 1
                    ate_food = True
                    del food[food_id]
                    create_food()
                    break

            if not ate_food:
                player["body"].pop()

        # Broadcast state
        game_state = {
            "players": [
                {
                    "id": p["id"],
                    "body": p["body"],
                    "score": p["score"],
                    "color": f"hsl({abs(hash(p['id'])) % 360}, 100%, 70%)",
                }
                for p in players.values() if p["state"] == "playing"
            ],
            "food": list(food.values()),
        }
        await manager.broadcast(json.dumps(game_state))

async def respawn_ai(player_id: str):
    await asyncio.sleep(3)
    if player_id in players and players[player_id]["state"] == "dead":
        players[player_id]["state"] = "playing"
        players[player_id]["body"] = [get_safe_spawn_point()]
        players[player_id]["score"] = 0
        players[player_id]["direction"] = {"dx": 1, "dy": 0}
        print(f"AI Player respawned: {player_id}")

# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    player_id = str(uuid.uuid4())
    spawn_point = get_safe_spawn_point()
    players[player_id] = {
        "id": player_id,
        "ws": websocket,
        "direction": {"dx": 1, "dy": 0},
        "body": [spawn_point],
        "score": 0,
        "state": "playing",
        "is_ai": False,
    }
    await manager.connect(websocket, player_id)
    print(f"Client connected: {player_id}")

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            player = players.get(player_id)

            if not player:
                break

            if player["state"] == "playing" and message.get("type") == "direction":
                direction = message["direction"]
                current_dir = player["direction"]
                if direction == "up" and current_dir["dy"] == 0:
                    player["direction"] = {"dx": 0, "dy": -1}
                elif direction == "down" and current_dir["dy"] == 0:
                    player["direction"] = {"dx": 0, "dy": 1}
                elif direction == "left" and current_dir["dx"] == 0:
                    player["direction"] = {"dx": -1, "dy": 0}
                elif direction == "right" and current_dir["dx"] == 0:
                    player["direction"] = {"dx": 1, "dy": 0}

    except WebSocketDisconnect:
        print(f"Client disconnected: {player_id}")
    finally:
        manager.disconnect(player_id)
        if player_id in players:
            del players[player_id]

# Mount the static files directory AFTER the websocket endpoint
app.mount("/", StaticFiles(directory="public", html=True), name="static")

# --- App Startup ---
@app.on_event("startup")
async def startup_event():
    # Create initial food and AI
    create_food()
    add_ai_player()
    # Start the game loop
    asyncio.create_task(game_loop())
