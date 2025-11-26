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
import json

app = Flask(__name__)

@app.route("/model/prompt", methods=["POST"])
def model_prompt():
  # Parse text fields
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

if __name__ == "__main__":
  # For local testing:
  #   pip install flask
  #   python flask_app.py
  #   export NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
  # Then submit the frontend form
  app.run(host="0.0.0.0", port=5001, debug=True)


