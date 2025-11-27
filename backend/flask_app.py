"""
Flask backend shell for generating a model-driven prompt.

Endpoint:
  POST /model/prompt
    - multipart/form-data
      - base_prompt: str
      - patient: JSON string for patient info
      - ehr_files: 0..n files
      - ct_scans: 0..n files
    - returns: { "generated_prompt": str }

Replace the stubbed logic with your model inference.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import time
import requests

app = Flask(__name__)
# Allow frontend (http://localhost:3000) to call Flask (http://localhost:5001)
# Loosened for dev; tighten origins in production.
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

hardcoded_prompt = ([
  {
    "time_point": "now",
    "prompt": "High-resolution axial CT scan of the human brain, soft tissue window for brain parenchyma. Patient is a 72-year-old female, Evelyn Reed, diagnosed with early-stage Alzheimer's disease 6 months prior, currently on Donepezil. Image shows mild generalized cortical atrophy, distinctly mild hippocampal atrophy, and subtle widening of the sulci in the temporal and parietal regions. Ventricular size is within normal limits for age. No signs of acute hemorrhage, mass effect, or significant vascular calcifications. This represents the current baseline anatomical condition after 6 months of managed symptoms, displaying realistic CT characteristics. Clinically accurate, photorealistic medical rendering."
  },
  {
    "time_point": "3m",
    "prompt": "High-resolution axial CT scan of the human brain, soft tissue window for brain parenchyma. Patient is a 72-year-old female, Evelyn Reed, 3 months post 'current state' (9 months post-diagnosis) with continued Donepezil. Image exhibits *slightly increased* generalized cortical atrophy compared to the baseline, *noticeably moderate hippocampal atrophy*, and *mildly increased widening* of the sulci in the temporal and parietal regions. Lateral ventricles show *minimal, subtle enlargement*. No new acute findings, mass effect, or significant vascular changes. This illustrates early, subtle progression of Alzheimer's-related neurodegeneration, demonstrating a realistic transformation from the 'now' state. Clinically accurate, photorealistic medical rendering."
  },
  {
    "time_point": "6m",
    "prompt": "High-resolution axial CT scan of the human brain, soft tissue window for brain parenchyma. Patient is a 72-year-old female, Evelyn Reed, 6 months post 'current state' (12 months post-diagnosis). Image reveals *distinctly moderate generalized cortical atrophy*, *marked hippocampal atrophy*, and *moderate widening* of the sulci, particularly prominent in the temporal and parietal lobes. Lateral ventricles show *definite, mild enlargement*. No new acute lesions or significant density changes indicating hemorrhage. This represents continued, more evident progression of Alzheimer's disease, showcasing a realistic and expected evolution from the 3-month state. Clinically accurate, photorealistic medical rendering."
  },
  {
    "time_point": "12m",
    "prompt": "High-resolution axial CT scan of the human brain, soft tissue window for brain parenchyma. Patient is a 72-year-old female, Evelyn Reed, 12 months post 'current state' (18 months post-diagnosis). Image demonstrates *significant generalized cortical atrophy*, *severe hippocampal atrophy with pronounced volume loss*, and *marked widening* of cortical sulci across the cerebral hemispheres, most prominent in temporal and parietal regions. Lateral and third ventricles appear *moderately enlarged*, consistent with ex-vacuo hydrocephalus due to brain volume loss. No new acute pathology or abnormal density. This illustrates substantial progression of Alzheimer's-related neurodegeneration, representing the realistic culmination of the 12-month transformation. Clinically accurate, photorealistic medical rendering."
  }
])
# todo(NISHANK): Implement this endpoint.
@app.route("/model/prompt", methods=["POST"])
def model_prompt():
  # hard-coded prompt for now -- Nishank can remove this later.
  print("prompt returned by the model: ", jsonify({"generated_prompt": hardcoded_prompt}))
  return jsonify({"generated_prompt": hardcoded_prompt})

  # Parse text fields
  """
  base_prompt = request.form.get("base_prompt", "", type=str)
  patient_raw = request.form.get("patient", "{}", type=str)
  try:
    patient = json.loads(patient_raw or "{}")
  except Exception:
    patient = {}

  # Access uploaded files if you need to read them or persist elsewhere
  ehr_files = request.files.getlist("ehr_files")
  ct_scans = request.files.getlist("ct_scans")

  # TODO: Persist files to storage if needed and pass paths to your model
  # TODO: Call your model with patient + files + base_prompt to get a refined prompt

  # Stubbed prompt: combine inputs deterministically
  name = " ".join([str(patient.get("firstName") or ""), str(patient.get("lastName") or "")]).strip()
  file_hint = f"{len(ehr_files)} EHR file(s), {len(ct_scans)} scan(s)"
  generated_prompt = (f"{base_prompt} [patient:{name or 'n/a'} | {file_hint}]").strip()

  return jsonify({"generated_prompt": generated_prompt})
  """

@app.route("/model/generate_images", methods=["POST"])
def generate_images():
  """
  JSON body: { "prompt": str, "timepoints": ["now","3m","6m","12m"]? }
  Returns: { "images": { "now": url, "3m": url, "6m": url, "12m": url } }
  """
  payload = request.get_json(silent=True) or {}
  prompt = payload.get("prompt") or ""
  print("recieved prompt: ", prompt)
  timepoints = payload.get("timepoints") or ["now", "3m", "6m", "12m"]

  # Hard-coded BFL endpoint; replace with your own model as needed
  bfl_url = "https://api.bfl.ai/v1/flux-kontext-pro"
  api_key = os.environ.get("BFL_API_KEY")
  if not api_key:
    return jsonify({"error": "Missing BFL_API_KEY"}), 500

  def generate_one(p: str) -> str:
    resp = requests.post(
      bfl_url,
      headers={
        "accept": "application/json",
        "x-key": api_key,
        "Content-Type": "application/json",
      },
      json={"prompt": p},
      timeout=30,
    ).json()
    polling_url = resp.get("polling_url")
    if not polling_url:
      raise RuntimeError(f"Bad response: {resp}")
    # Poll up to ~60s
    started = time.time()
    while True:
      time.sleep(0.5)
      result = requests.get(
        polling_url,
        headers={"accept": "application/json", "x-key": api_key},
        timeout=30,
      ).json()
      status = result.get("status")
      if status == "Ready":
        return result["result"]["sample"]
      if status in ("Error", "Failed"):
        raise RuntimeError(f"Generation failed: {result}")
      if time.time() - started > 90:
        raise TimeoutError("Timed out waiting for image")

  # Slightly tailor the prompt by timepoint; hard-coded phrasing
  tp_to_suffix = {
    "now": "current brain state",
    "3m": "brain state in approximately 3 months",
    "6m": "brain state in approximately 6 months",
    "12m": "brain state in approximately 12 months",
  }
  images = {}

  # If prompt is an object like { "now": "...", "3m": "...", ... } use those directly.
  # Otherwise if it's a string, fall back to suffix composition for each timepoint.
  prompt_per_tp = {}
  if isinstance(prompt, dict):
    # Normalize keys to expected timepoints
    for tp in timepoints:
      prompt_per_tp[tp] = prompt.get(tp)
  else:
    # Single string prompt for all timepoints
    for tp in timepoints:
      suffix = tp_to_suffix.get(tp, str(tp))
      prompt_per_tp[tp] = f"{prompt}. Please depict the {suffix}."

  for tp in timepoints:
    composed = prompt_per_tp.get(tp) or ""
    try:
      url = generate_one(composed)
      images[tp] = url
    except Exception as e:
      images[tp] = None

  return jsonify({"images": images})

if __name__ == "__main__":
  # For local testing:
  #   pip install flask
  #   python flask_app.py
  #   export NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
  # Then submit the frontend form
  app.run(host="0.0.0.0", port=5000, debug=True)


