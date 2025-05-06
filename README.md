# soa-project
# Laptop E-commerce Backend (FastAPI)

This is the backend API service for the Laptop E-commerce project, built with FastAPI and PostgreSQL.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Python:** Version 3.9 or higher recommended.
*   **pip:** Python package installer (usually comes with Python).
*   **Docker:** To run the PostgreSQL database container. ([Install Docker](https://docs.docker.com/get-docker/))
*   **Docker Compose:** Usually included with Docker Desktop. ([Install Docker Compose](https://docs.docker.com/compose/install/) if needed separately).
*   **Git:** For cloning the repository.

## Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-repository-directory>/backend
    ```

2.  **Create and Activate Virtual Environment:**
    It's highly recommended to use a virtual environment to manage project dependencies.

    ```bash
    # Create the virtual environment
    python -m venv venv

    # Activate the virtual environment
    # On Windows (Git Bash or similar):
    source venv/Scripts/activate
    # On Windows (Command Prompt or PowerShell):
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
    You should see `(venv)` at the beginning of your terminal prompt.

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

Environment variables are used for configuration, especially the database connection string.

1.  **Create `.env` file:** Create a file named `.env` in the project root (`backend/`).
2.  **Add Configuration:** Paste the following into the `.env` file, ensuring the credentials match your `docker-compose.yml`:

    ```env
    # .env
    # Ensure these values match the 'environment' section in docker-compose.yml
    DATABASE_URL="postgresql+asyncpg://myuser:mysecretpassword@localhost:5432/laptop_ecommerce"

    # Optional: Add a secret key if needed for JWT tokens later
    # SECRET_KEY=your_super_secret_random_key_here
    ```
    **Important:** Add `.env` to your `.gitignore` file to avoid committing sensitive credentials.

## Running the Database (Docker)

The project uses Docker Compose to manage the PostgreSQL database service.

1.  **Start the Database Container:**
    Make sure Docker Desktop is running. Navigate to the project root (`backend/`) in your terminal and run:
    ```bash
    docker-compose up -d
    ```
    This command builds (if necessary) and starts the `db` service defined in `docker-compose.yml` in detached mode (`-d`).

2.  **(Optional) View Database Logs:**
    ```bash
    docker-compose logs -f db
    ```
    Press `Ctrl+C` to stop viewing logs.

3.  **(Optional) Stop the Database Container:**
    ```bash
    docker-compose down
    ```
    This stops and removes the container but keeps the data volume (`postgres_data`) unless you add the `-v` flag.

## Database Migrations (Alembic)

Alembic is used to manage database schema changes.

1.  **Apply Existing Migrations (Initial Setup / Updates):**
    Before running the application for the first time, or after pulling changes that include new migrations, apply them to the database:
    ```bash
    # Ensure the virtual environment is active and the DB container is running
    alembic upgrade head
    ```

2.  **Create New Migrations (After Model Changes):**
    If you modify the database models (in `app/models/`), you need to generate a new migration script:
    ```bash
    # Make sure your model changes are saved
    alembic revision --autogenerate -m "Describe your changes here, e.g., Add stock field to Product"
    ```
    Review the generated script in `alembic/versions/` and then apply it using `alembic upgrade head`.

## Running the Application

Once the database is running and migrations are applied:

1.  **Start the FastAPI Server:**
    ```bash
    # Ensure the virtual environment is active
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    *   `uvicorn app.main:app`: Tells Uvicorn where to find the FastAPI application instance (`app`) inside the `app/main.py` file.
    *   `--reload`: Enables auto-reloading when code changes are detected (useful for development).
    *   `--host 0.0.0.0`: Makes the server accessible from your local network (not just `localhost`).
    *   `--port 8000`: Specifies the port to run on.

## Accessing the API Documentation

FastAPI automatically generates interactive API documentation. Once the server is running, open your web browser and navigate to:

*   **Swagger UI:** `http://localhost:8000/docs`
    *   *Note:* If you used a prefix like `/api/v1` in `app/main.py`, the URL will be `http://localhost:8000/api/v1/docs`.
*   **ReDoc:** `http://localhost:8000/redoc`
    *   *Note:* If you used a prefix like `/api/v1` in `app/main.py`, the URL will be `http://localhost:8000/api/v1/redoc`.

You can use these interfaces to explore and test the API endpoints.