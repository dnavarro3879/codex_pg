
# Next.js Frontend

This interface uses Next.js with Tailwind CSS to show rare bird sightings from
our FastAPI backend.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

By default, the app calls the backend at `http://localhost:8000`. To point to a
different backend URL, set the environment variable `NEXT_PUBLIC_BACKEND_URL` in
`.env.local`:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```
