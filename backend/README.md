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
