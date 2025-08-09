const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverOverlay = document.getElementById('game-over-overlay');
const replayButton = document.getElementById('replay-button');

const gridSize = 20;
const canvasWidth = 800;
const canvasHeight = 600;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Use wss:// for secure connections if the site is served over https
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);

ws.onopen = () => {
    console.log('Connected to the game server.');
};

ws.onmessage = (event) => {
    try {
        const message = JSON.parse(event.data);
        if (message.type === 'game_over') {
            gameOverOverlay.classList.remove('hidden');
        } else {
            // It's a game state update
            drawGame(message);
            updateLeaderboard(message.players);
        }
    } catch (error) {
        console.error('Error parsing message:', error);
    }
};

ws.onclose = () => {
    console.log('Disconnected from the game server.');
    // Optional: Display a message to the user
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Disconnected from server', canvasWidth / 2, canvasHeight / 2);
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

function drawGame(gameState) {
    // Clear canvas
    ctx.fillStyle = '#111'; // A slightly lighter black
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw food
    ctx.fillStyle = '#ff0000'; // Bright red
    gameState.food.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x * gridSize + gridSize / 2, f.y * gridSize + gridSize / 2, gridSize / 2, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Draw players
    gameState.players.forEach(player => {
        ctx.fillStyle = player.color;
        player.body.forEach((segment, index) => {
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            // Give the head a distinct look (e.g., eyes)
            if (index === 0) {
                ctx.fillStyle = '#000';
                ctx.fillRect(segment.x * gridSize + 4, segment.y * gridSize + 4, 4, 4);
                ctx.fillRect(segment.x * gridSize + 12, segment.y * gridSize + 4, 4, 4);
            }
        });
    });

    // Draw instructions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Use Arrow Keys or WASD to move', canvasWidth / 2, canvasHeight - 10);
}

replayButton.addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'replay' }));
    gameOverOverlay.classList.add('hidden');
});

function updateLeaderboard(players) {
    const leaderboard = document.getElementById('leaderboard');
    if (!leaderboard) return;

    leaderboard.innerHTML = ''; // Clear previous entries

    // Sort players by score in descending order and take top 10
    const sortedPlayers = players.sort((a, b) => b.score - a.score).slice(0, 10);

    sortedPlayers.forEach(player => {
        const li = document.createElement('li');
        // Shorten the ID for display: 'player-abcde1234' -> 'abcde'
        const shortId = player.id.substring(7, 12);
        li.textContent = `Player ${shortId}: ${player.score}`;
        li.style.borderColor = player.color;
        leaderboard.appendChild(li);
    });
}

document.addEventListener('keydown', (event) => {
    if (ws.readyState !== WebSocket.OPEN) {
        return; // Don't send messages if not connected
    }

    let direction = null;
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            direction = 'up';
            break;
        case 'ArrowDown':
        case 's':
            direction = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
            direction = 'left';
            break;
        case 'ArrowRight':
        case 'd':
            direction = 'right';
            break;
    }

    if (direction) {
        event.preventDefault(); // Prevent scrolling the page with arrow keys
        ws.send(JSON.stringify({ type: 'direction', direction: direction }));
    }
});
