# Multiplayer Snake Game (Python Edition)

A simple multiplayer survival IO snake game, powered by a Python backend.

## How to Run Locally

1.  **Set up a Python environment:**
    It's recommended to use a virtual environment.
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Start the server:**
    ```bash
    uvicorn main:app --reload
    ```
    The `--reload` flag makes the server restart automatically when you make code changes.

4.  **Open the game in your browser:**
    Navigate to [http://localhost:8000](http://localhost:8000)

## How to Play

- Use the arrow keys to change your snake's direction.
- Eat the food to grow longer.
- Don't run into the walls or other snakes! The last snake standing wins.

## Deploying to the Internet (for Free)

You can deploy this game on a cloud platform like **Render** to make it publicly available.

1.  **Push your code to a GitHub Repository:**
    *   Ensure your repository contains `main.py`, `requirements.txt`, and the `public` directory.

2.  **Sign up for Render:**
    *   Go to [render.com](https://render.com/) and create a free account.

3.  **Create a New Web Service:**
    *   From the Render dashboard, click **"New +"** and then **"Web Service"**.
    *   Connect your GitHub account and select your game repository.

4.  **Configure the Service:**
    *   **Runtime:** Render should automatically detect `Python 3`.
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 10000`
        *(Render's free web services run on port 10000 and expose it publicly on ports 80 and 443. You can also use `--port $PORT` if you prefer, but explicitly setting 10000 is reliable.)*

5.  **Deploy:**
    *   Click **"Create Web Service"**. Render will deploy your application.
    *   Once it's live, you'll get a public URL (like `https://your-snake-game.onrender.com`) to share with others.

### Stopping the Service

*   Go to your **Dashboard** on Render.
*   Click on your web service, navigate to the **"Settings"** tab, and scroll down to find the **"Delete Service"** section.
