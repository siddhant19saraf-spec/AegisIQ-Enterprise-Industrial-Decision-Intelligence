from pydantic import BaseModel


class WorkerResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: str | None = None
    role: str
    location: str | None = None
    facility: str | None = None
    emergency_contact: str | None = None
    medical_conditions: str | None = None
    blood_group: str | None = None
    is_on_duty: bool
    latitude: float | None = None
    longitude: float | None = None


class EmergencyAlertResponse(BaseModel):
    id: str
    type: str
    severity: str
    title: str
    description: str | None = None
    location: str | None = None
    facility: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    status: str
    worker_id: str | None = None
    source: str
    auto_detected: bool
    ambulance_dispatched: bool
    ambulance_eta_minutes: int
    created_at: str


class SOSRequest(BaseModel):
    worker_id: str | None = None
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None


class SOSResponse(BaseModel):
    success: bool
    message: str
    alert_id: str
    ambulance_dispatched: bool
    ambulance_eta: int
    emergency_message: str


class AmbulanceDispatchResponse(BaseModel):
    alert_id: str
    dispatched: bool
    eta_minutes: int
    hospital: str
    ambulance_id: str
    contact_number: str


class HealthCheckIn(BaseModel):
    worker_id: str
    healthy: bool
    temperature: float | None = None
    heart_rate: int | None = None
    notes: str | None = None


class EmergencyDetectionResult(BaseModel):
    detected: bool
    alert_type: str | None = None
    severity: str | None = None
    title: str | None = None
    description: str | None = None
    confidence: float | None = None
    affected_assets: list[str] = []
    affected_workers: list[str] = []
