# Brain Imaging Backend Skeleton

This folder contains a minimal scaffold for the backend you will implement.
Comments in files indicate expected behavior, payloads and responses.

Recommended stack: FastAPI + Uvicorn

## Endpoints (high-level)

- POST `/cases`
  - Multipart form-data: `basePrompt` (str), `patient` (JSON), `ehrFiles[]` (files), `ctScans[]` (files)
  - Returns JSON case object `{ id, createdAt, patient, basePrompt, ehrFiles, ctScans, images: {}, videoUrl }`

- POST `/cases/{caseId}/generate`
  - JSON: `{ timepoints?: ["now","3m","6m","12m"], additionalPrompt?: string }`
  - Returns updated case object with generated `images` for the requested timepoints

- POST `/cases/{caseId}/reprompt`
  - JSON: `{ additionalPrompt: string, timepoints?: ["now","3m","6m","12m"] }`
  - Returns updated case object with re-generated `images` for the requested timepoints

- POST `/cases/{caseId}/video`
  - JSON: `{ fps?: number, durationSeconds?: number, includeTimepoints?: string[] }`
  - Returns updated case object with `videoUrl`

- GET `/cases/{caseId}`
  - Returns the case object

See `api_spec.yaml` for a starting OpenAPI draft.

## Local dev

```bash
pip install -r requirements.txt
uvicorn app:app --reload --port 8080
```

Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080` in your frontend to switch from mocks.


