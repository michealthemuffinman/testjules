const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverOverlay = document.getElementById('game-over-overlay');
const replayButton = document.getElementById('replay-button');

const gridSize = 20;
const canvasWidth = 800;
const canvasHeight = 600;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

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
            drawGame(message);
            updateLeaderboard(message.players);
        }
    } catch (error) {
        console.error('Error parsing message:', error);
    }
};

ws.onclose = () => {
    console.log('Disconnected from the game server.');
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
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = '#ff0000';
    gameState.food.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x * gridSize + gridSize / 2, f.y * gridSize + gridSize / 2, gridSize / 2, 0, 2 * Math.PI);
        ctx.fill();
    });

    gameState.players.forEach(player => {
        if (!player.body || player.body.length === 0) return;
        const headColor = player.color;
        const tailColor = headColor.replace('70%', '50%');
        ctx.fillStyle = tailColor;
        for (let i = 1; i < player.body.length; i++) {
            const segment = player.body[i];
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        }
        const head = player.body[0];
        ctx.fillStyle = headColor;
        ctx.fillRect(head.x * gridSize, head.y * gridSize, gridSize, gridSize);
        ctx.fillStyle = '#000';
        ctx.fillRect(head.x * gridSize + 5, head.y * gridSize + 5, 4, 4);
        ctx.fillRect(head.x * gridSize + 11, head.y * gridSize + 5, 4, 4);
    });

    // Draw instructions only on larger screens
    if (window.innerWidth > 1024) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Use Arrow Keys or WASD to move', canvasWidth / 2, canvasHeight - 10);
    }
}

replayButton.addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'replay' }));
    gameOverOverlay.classList.add('hidden');
});

function updateLeaderboard(players) {
    const leaderboard = document.getElementById('leaderboard');
    if (!leaderboard) return;
    leaderboard.innerHTML = '';
    const sortedPlayers = players.sort((a, b) => b.score - a.score).slice(0, 10);
    sortedPlayers.forEach(player => {
        const li = document.createElement('li');
        const shortId = player.id.substring(0, 8);
        li.textContent = `Player ${shortId}: ${player.score}`;
        li.style.borderColor = player.color;
        leaderboard.appendChild(li);
    });
}

document.addEventListener('keydown', (event) => {
    if (ws.readyState !== WebSocket.OPEN) {
        return;
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
        event.preventDefault();
        ws.send(JSON.stringify({ type: 'direction', direction: direction }));
    }
});
