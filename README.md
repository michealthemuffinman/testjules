# Multiplayer Snake Game

A simple multiplayer survival IO snake game.

## How to Run

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the server:**
    ```bash
    node server.js
    ```

3.  **Open the game in your browser:**
    [http://localhost:3000](http://localhost:3000)

## How to Play

- Use the arrow keys to change your snake's direction.
- Eat the food to grow longer.
- Don't run into the walls or other snakes! The last snake standing wins.

## Playing on a Local Network

You can play with friends on the same local network (e.g., connected to the same Wi-Fi).

1.  **Host the game:** One person needs to start the server on their computer by running `npm install` and then `node server.js`.

2.  **Find the host's Local IP Address:** The person hosting the game needs to find their computer's IP address on the local network. Here's how:
    *   **Windows:** Open Command Prompt and type `ipconfig`. Look for the "IPv4 Address" under your active network connection (e.g., "Wireless LAN adapter Wi-Fi" or "Ethernet adapter").
    *   **macOS:** Open System Preferences > Network. Select your active connection (Wi-Fi or Ethernet), and your IP address will be shown. Alternatively, open the Terminal and type `ifconfig | grep "inet "`.
    *   **Linux:** Open a terminal and type `hostname -I` or `ip addr`.

3.  **Connect from other devices:** Other players on the same network can open a web browser on their computer or phone and navigate to `http://<HOST_IP_ADDRESS>:3000` (replace `<HOST_IP_ADDRESS>` with the actual IP address you found in step 2, e.g., `http://192.168.1.15:3000`).
