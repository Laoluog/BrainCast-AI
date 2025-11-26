"""
FastAPI application skeleton for brain imaging workflow.

Implement the logic for:
- receiving EHR files and CT scans
- calling your internal model to produce prompts
- generating images for 4 timepoints (now, 3m, 6m, 12m)
- handling reprompt/edit requests
- optional video generation based on images
"""

from fastapi import FastAPI, UploadFile, File, Form
from fastapi import Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel
import json
import datetime

app = FastAPI(title="Brain Imaging API", version="0.1.0")

# Configure CORS as needed for your frontend origin(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Timepoint = Literal["now", "3m", "6m", "12m"]

class Patient(BaseModel):
  firstName: Optional[str] = None
  lastName: Optional[str] = None
  age: Optional[int] = None
  mrn: Optional[str] = None
  notes: Optional[str] = None

class ImageResult(BaseModel):
  url: str
  timepoint: Timepoint
  promptUsed: str

class Case(BaseModel):
  id: str
  createdAt: str
  patient: Patient
  basePrompt: str
  ehrFiles: List[Dict[str, Any]]
  ctScans: List[Dict[str, Any]]
  images: Dict[Timepoint, ImageResult] = {}
  videoUrl: Optional[str] = None

class GenerateRequest(BaseModel):
  timepoints: Optional[List[Timepoint]] = None
  additionalPrompt: Optional[str] = None

class VideoRequest(BaseModel):
  fps: Optional[int] = None
  durationSeconds: Optional[int] = None
  includeTimepoints: Optional[List[Timepoint]] = None

_CASES: Dict[str, Case] = {}

def _new_id(prefix: str = "case") -> str:
  import secrets
  return f"{prefix}_{secrets.token_urlsafe(6)}"

def _file_meta(f: UploadFile) -> Dict[str, Any]:
  # Persist the file to storage and reference via URL/path in a real implementation
  return {"name": f.filename, "type": f.content_type, "size": None}

@app.post("/cases", response_model=Case)
async def create_case(
  basePrompt: str = Form(...),
  patient: str = Form(...),
  ehrFiles: List[UploadFile] = File(default=[]),
  ctScans: List[UploadFile] = File(default=[]),
):
  """
  Create a case with uploads.
  - basePrompt: string guiding generation
  - patient: JSON string matching Patient schema
  - ehrFiles: uploaded EHR documents
  - ctScans: uploaded scans (DICOM/Images)
  """
  try:
    patient_obj = Patient(**json.loads(patient))
  except Exception as e:
    raise HTTPException(status_code=400, detail=f"Invalid patient JSON: {e}")

  case_id = _new_id()
  created = Case(
    id=case_id,
    createdAt=datetime.datetime.utcnow().isoformat() + "Z",
    patient=patient_obj,
    basePrompt=basePrompt,
    ehrFiles=[_file_meta(f) for f in ehrFiles],
    ctScans=[_file_meta(f) for f in ctScans],
    images={},
  )
  _CASES[case_id] = created
  return created

@app.get("/cases/{caseId}", response_model=Case)
async def get_case(caseId: str):
  case = _CASES.get(caseId)
  if not case:
    raise HTTPException(status_code=404, detail="Case not found")
  return case

@app.post("/cases/{caseId}/generate", response_model=Case)
async def generate_images(caseId: str, req: GenerateRequest = Body(...)):
  """
  Generate images for given timepoints (default: all).
  Integrate your model inference + image generator here.
  """
  case = _CASES.get(caseId)
  if not case:
    raise HTTPException(status_code=404, detail="Case not found")
  tps = req.timepoints or ["now", "3m", "6m", "12m"]
  for tp in tps:
    prompt_used = (case.basePrompt + " " + (req.additionalPrompt or "")).strip()
    # Replace with real generated image URL
    case.images[tp] = ImageResult(
      url=f"https://picsum.photos/seed/{case.id}-{tp}/960/720",
      timepoint=tp,  # type: ignore
      promptUsed=prompt_used,
    )
  _CASES[caseId] = case
  return case

@app.post("/cases/{caseId}/reprompt", response_model=Case)
async def reprompt_images(caseId: str, req: GenerateRequest = Body(...)):
  """
  Same as /generate but semantic: used when editing additionalPrompt/timepoints.
  """
  return await generate_images(caseId, req)

@app.post("/cases/{caseId}/video", response_model=Case)
async def generate_video(caseId: str, req: VideoRequest = Body({})):
  """
  Create a progression video from images.
  Set case.videoUrl to a rendered asset location.
  """
  case = _CASES.get(caseId)
  if not case:
    raise HTTPException(status_code=404, detail="Case not found")
  # Replace with real video rendering result
  case.videoUrl = f"https://picsum.photos/seed/{case.id}-video/1280/720"
  _CASES[caseId] = case
  return case


