# FastAPI Backend

This API exposes a single `/birds/rare` endpoint that returns notable bird
sightings near a given latitude and longitude. It proxies data from the eBird
API and normalizes the response.

## Running

Install dependencies and run the server:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

You must set an environment variable `EBIRD_API_KEY` containing your personal
[eBird API token](https://ebird.org/api/keygen).

## CORS / Environment

This API enables CORS for the frontend. By default, it allows common local dev
origins (`http://localhost:3000`, `http://127.0.0.1:3000`). You can set a
specific origin via the `FRONTEND_ORIGIN` environment variable.

Environment variables used:

- `EBIRD_API_KEY` (required): Your eBird API key
- `FRONTEND_ORIGIN` (optional): Exact origin allowed for CORS, e.g.
	`http://localhost:3000` or your deployed site origin

You can create a `.env` file in this folder to set these locally:

```
EBIRD_API_KEY=your_key_here
FRONTEND_ORIGIN=http://localhost:3000
```
