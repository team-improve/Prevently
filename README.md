# Prevently

This is our hackathon app
It is working!

## Backend Setup

### Prerequisites

- Python 3.8 or higher

### Installation

1. Create a virtual environment:

    ```ps
    python -m venv .venv
    ```

2. Activate the virtual environment:

    ```ps
    .venv\Scripts\activate  # On Windows
    ```

3. Navigate to the backend directory:

    ```ps
    cd prevently-backend
    ```

4. Install dependencies:

    ```ps
    pip install -r requirements.txt
    ```

5. Set up environment variables:

    - Create a `.env` file in the `prevently-backend` directory

    - Add your Firebase API key and project ID:

    ```ps
    FIREBASE_API_KEY=your_firebase_api_key
    FIREBASE_PROJECT_ID=your_project_id
    ```

### Running the Server

1. Ensure you're in the `prevently-backend` directory with the virtual environment activated.

2. Set the Python path and start the server:

    ```ps
    set PYTHONPATH=. && python -m uvicorn app.main:app --reload
    ```

3. The server will run on `http://127.0.0.1:8000`

4. Access the API documentation at `http://127.0.0.1:8000/docs`
