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

## Deploying to the Internet (for Free)

To make your game available for anyone to play on the internet, you can deploy it on a cloud platform. The following instructions are for a service called **Render**, which has a free tier that is great for projects like this.

1.  **Push your code to a GitHub Repository:**
    *   Create a new repository on [GitHub](https://github.com).
    *   Follow the instructions to upload your project files (`server.js`, `package.json`, the `public` directory, etc.) to this repository.

2.  **Sign up for Render:**
    *   Go to [render.com](https://render.com/) and sign up for a free account. You can sign up using your GitHub account to make things easier.

3.  **Create a New Web Service:**
    *   From the Render dashboard, click **"New +"** and then **"Web Service"**.
    *   Connect your GitHub account and select the repository you created in step 1.
    *   Give your service a unique name (e.g., `my-cool-snake-game`). This will be part of your public URL.

4.  **Configure the Service:**
    *   **Runtime:** Render should automatically detect that this is a Node.js project.
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js`

5.  **Deploy:**
    *   Scroll down and click **"Create Web Service"**. Render will automatically pull your code from GitHub, install the dependencies, and start the server.
    *   The first deployment might take a few minutes. Once it's live, Render will give you a public URL (like `https://your-game-name.onrender.com`). You can share this URL with anyone to play your game!

### Stopping the Service

If you no longer want your game to be live, you can stop the service to prevent it from running and incurring potential costs (even on a free plan, this is good practice).

*   Go to your **Dashboard** on Render.
*   Click on your web service (e.g., `my-cool-snake-game`).
*   Navigate to the **"Settings"** tab.
*   Scroll to the bottom of the page to find the **"Delete Service"** section.
*   Clicking the **"Delete Service"** button will permanently stop and remove your game from the internet.
