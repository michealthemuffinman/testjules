const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// --- HTTP Server for static files ---
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const extname = path.extname(filePath);
  let contentType = 'text/html';

  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code == 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// --- WebSocket Server for game logic ---
const wss = new WebSocket.Server({ server });

// --- Game State ---
const players = {};
const food = {};
const gridSize = 20;
const boardWidth = 800 / gridSize;
const boardHeight = 600 / gridSize;
let foodIdCounter = 0;

function createFood() {
  // Simple check to avoid spawning food on a snake
  let foodPosition = {
    x: Math.floor(Math.random() * boardWidth),
    y: Math.floor(Math.random() * boardHeight),
  };

  let onSnake = true;
  while(onSnake) {
    onSnake = false;
    for (const playerId in players) {
        for (const segment of players[playerId].body) {
            if (segment.x === foodPosition.x && segment.y === foodPosition.y) {
                onSnake = true;
                foodPosition = {
                    x: Math.floor(Math.random() * boardWidth),
                    y: Math.floor(Math.random() * boardHeight),
                };
                break;
            }
        }
        if(onSnake) break;
    }
  }

  const foodId = `food-${foodIdCounter++}`;
  food[foodId] = foodPosition;
}

// Create initial food
createFood();

function getSafeSpawnPoint() {
    let spawnPoint = null;
    let onSnake = true;

    // Keep trying to find a spawn point until an empty one is found
    while (onSnake) {
        onSnake = false;
        spawnPoint = {
            x: Math.floor(Math.random() * boardWidth),
            y: Math.floor(Math.random() * boardHeight),
        };

        for (const playerId in players) {
            for (const segment of players[playerId].body) {
                if (segment.x === spawnPoint.x && segment.y === spawnPoint.y) {
                    onSnake = true;
                    break; // Found a collision, try a new spawnPoint
                }
            }
            if (onSnake) break;
        }
    }
    return spawnPoint;
}

function addAiPlayer() {
    const playerId = `ai-${Math.random().toString(36).substr(2, 9)}`;
    const spawnPoint = getSafeSpawnPoint();
    players[playerId] = {
        id: playerId,
        ws: null, // AI players don't have a websocket connection
        direction: { dx: 1, dy: 0 },
        body: [spawnPoint],
        score: 0,
        state: 'playing',
        isAi: true, // Flag to identify AI players
    };
    console.log('AI Player added:', playerId);
}

// --- WebSocket Connection Handling ---
wss.on('connection', ws => {
  const playerId = `player-${Math.random().toString(36).substr(2, 9)}`;
  console.log('Client connected:', playerId);

  // Create new player
  const spawnPoint = getSafeSpawnPoint();
  players[playerId] = {
    id: playerId,
    ws: ws,
    direction: { dx: 1, dy: 0 }, // Initial direction: right
    body: [ spawnPoint ],
    score: 0,
    isDead: false,
    state: 'playing' // can be 'playing' or 'dead'
  };

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      const player = players[playerId];
      if (!player) return;

      if (data.type === 'direction' && player.state === 'playing') {
        const currentDirection = player.direction;
        if (data.direction === 'up' && currentDirection.dy === 0) {
          player.direction = { dx: 0, dy: -1 };
        } else if (data.direction === 'down' && currentDirection.dy === 0) {
          player.direction = { dx: 0, dy: 1 };
        } else if (data.direction === 'left' && currentDirection.dx === 0) {
          player.direction = { dx: -1, dy: 0 };
        } else if (data.direction === 'right' && currentDirection.dx === 0) {
          player.direction = { dx: 1, dy: 0 };
        }
      } else if (data.type === 'replay' && player.state === 'dead') {
        // Respawn the player
        player.state = 'playing';
        player.body = [getSafeSpawnPoint()];
        player.score = 0;
        player.direction = { dx: 1, dy: 0 };
      }
    } catch (e) {
      console.error('Failed to parse message or process direction change:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected:', playerId);
    delete players[playerId];
  });
});


function updateAiDirections(allPlayers) {
    const allFood = Object.values(food);
    if (allFood.length === 0) return; // No food, no goal

    const activeSnakes = allPlayers.filter(p => p.state === 'playing');

    for (const player of allPlayers) {
        if (!player.isAi || player.state !== 'playing') {
            continue;
        }

        const head = player.body[0];

        let closestFood = null;
        let minDistance = Infinity;
        for (const f of allFood) {
            const distance = Math.abs(head.x - f.x) + Math.abs(head.y - f.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestFood = f;
            }
        }

        if (!closestFood) continue;

        const potentialDirections = [];
        if (closestFood.x > head.x) potentialDirections.push({ dx: 1, dy: 0 });
        if (closestFood.x < head.x) potentialDirections.push({ dx: -1, dy: 0 });
        if (closestFood.y > head.y) potentialDirections.push({ dx: 0, dy: 1 });
        if (closestFood.y < head.y) potentialDirections.push({ dx: 0, dy: -1 });

        const isSafe = (dx, dy) => {
            const nextHead = { x: head.x + dx, y: head.y + dy };
            if (nextHead.x < 0 || nextHead.x >= boardWidth || nextHead.y < 0 || nextHead.y >= boardHeight) return false;
            for (const otherPlayer of activeSnakes) {
                for (const segment of otherPlayer.body) {
                    if (nextHead.x === segment.x && nextHead.y === segment.y) return false;
                }
            }
            return true;
        };

        const safeDirections = potentialDirections.filter(dir => isSafe(dir.dx, dir.dy) && (dir.dx !== -player.direction.dx || dir.dy !== -player.direction.dy));

        if (safeDirections.length > 0) {
            player.direction = safeDirections[Math.floor(Math.random() * safeDirections.length)];
        } else {
             // If no safe move towards food, try perpendicular moves
            const perpendicularMoves = [];
            if (player.direction.dx !== 0) { // moving horizontally
                perpendicularMoves.push({ dx: 0, dy: -1 });
                perpendicularMoves.push({ dx: 0, dy: 1 });
            } else { // moving vertically
                perpendicularMoves.push({ dx: -1, dy: 0 });
                perpendicularMoves.push({ dx: 1, dy: 0 });
            }
            const safePerpendicular = perpendicularMoves.filter(dir => isSafe(dir.dx, dir.dy));
            if(safePerpendicular.length > 0) {
                player.direction = safePerpendicular[0];
            }
            // If still no safe move, do nothing and hope for the best
        }
    }
}

// --- Game Loop ---
function gameLoop() {
  const allPlayers = Object.values(players);

  // 1. Update AI directions
  updateAiDirections(allPlayers);

  // 2. Update positions and check for collisions for all playing snakes
  for (const player of allPlayers) {
    if (player.state !== 'playing') continue;

    const head = player.body[0];
    const newHead = {
      x: head.x + player.direction.dx,
      y: head.y + player.direction.dy,
    };

    // Check for collisions
    let collided = false;
    // Wall collision
    if (newHead.x < 0 || newHead.x >= boardWidth || newHead.y < 0 || newHead.y >= boardHeight) {
      collided = true;
    }

    // Snake collision (with any part of any snake, including self)
    if (!collided) {
      for (const otherPlayer of allPlayers) {
        if (otherPlayer.state !== 'playing') continue;
        for (const segment of otherPlayer.body) {
          if (newHead.x === segment.x && newHead.y === segment.y) {
            collided = true;
            break;
          }
        }
        if (collided) break;
      }
    }

    if (collided) {
      player.state = 'dead';
      if (player.ws) {
        player.ws.send(JSON.stringify({ type: 'game_over' }));
      } else if (player.isAi) {
        // AI player died, schedule a respawn
        setTimeout(() => {
            const deadAi = players[player.id];
            if (deadAi && deadAi.state === 'dead') {
                deadAi.state = 'playing';
                deadAi.body = [getSafeSpawnPoint()];
                deadAi.score = 0;
                deadAi.direction = { dx: 1, dy: 0 };
                console.log('AI Player respawned:', deadAi.id);
            }
        }, 3000); // 3-second respawn delay
      }
    } else {
      // No collision, move snake forward
      player.body.unshift(newHead);

      // Check for food
      let ateFood = false;
      for (const foodId in food) {
        if (newHead.x === food[foodId].x && newHead.y === food[foodId].y) {
          player.score++;
          ateFood = true;
          delete food[foodId];
          createFood();
        }
      }

      // If no food eaten, remove tail
      if (!ateFood) {
        player.body.pop();
      }
    }
  }

  // 2. Prepare and broadcast game state
  // Only include players that are currently playing
  const activePlayers = allPlayers.filter(p => p.state === 'playing');

  const gameState = {
    players: activePlayers.map(p => ({
      id: p.id,
      body: p.body,
      score: p.score,
      // Assign a color based on ID hash for variety
      color: `hsl(${p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 100%, 70%)`
    })),
    food: Object.values(food),
  };

  const stateString = JSON.stringify(gameState);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(stateString);
    }
  });
}

setInterval(gameLoop, 100);

// Add one AI player to the game at startup
addAiPlayer();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
