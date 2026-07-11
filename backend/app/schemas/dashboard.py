from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_assets: int
    active_incidents: int
    critical_assets: int
    open_reports: int
    uptime_rate: float
    incidents_today: int
    assets_by_status: dict
    incidents_by_severity: dict
