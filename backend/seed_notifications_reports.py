"""Seed notifications and reports data into the database."""
import asyncio
from datetime import datetime, timezone, timedelta
from uuid import uuid4

from sqlalchemy import select, func

from app.core.database import async_session_factory
from app.models.notification import Notification
from app.models.report import Report


NOTIFICATIONS = [
    {"type": "alert", "title": "Critical: Turbine #7 temperature exceeded 95°C", "body": "Temperature sensor on Turbine #7 in Mumbai Refinery detected 95°C — threshold breach. Immediate inspection required.", "data": {"category": "alerts", "priority": "high"}},
    {"type": "warning", "title": "Cooling system failure on Server Rack #4", "body": "Server Rack #4 cooling system failure detected. 12 servers affected. Impact assessment in progress.", "data": {"category": "incidents", "priority": "high"}},
    {"type": "info", "title": "Maintenance scheduled for Pump #3", "body": "Routine maintenance for Pump #3 at Jamnagar Complex scheduled for 14:00 IST. Expected downtime: 30 minutes.", "data": {"category": "maintenance", "priority": "medium"}},
    {"type": "success", "title": "Incident #1042 resolved", "body": "Incident #1042 — Coolant pump failure — has been resolved. Root cause: seal degradation. Corrective action completed.", "data": {"category": "incidents", "priority": "low"}},
    {"type": "warning", "title": "Unusual vibration on Motor #2", "body": "Vibration sensor on Motor #2 in Vizag Steel Plant detected anomalies. Recommend preventive inspection within 24 hours.", "data": {"category": "alerts", "priority": "medium"}},
    {"type": "alert", "title": "Power fluctuation in Zone B", "body": "Power fluctuation detected in Zone B at Kochi Refinery. UPS engaged. Source investigation underway.", "data": {"category": "alerts", "priority": "high"}},
    {"type": "info", "title": "System update v0.2.0 available", "body": "AegisIQ v0.2.0 is ready for deployment. Includes emergency response enhancements, analytics improvements, and bug fixes.", "data": {"category": "system", "priority": "low"}},
    {"type": "info", "title": "Daily backup completed", "body": "Automated daily backup completed successfully. Database size: 2.4 GB. Next backup scheduled for 06:00 IST.", "data": {"category": "system", "priority": "low"}},
    {"type": "success", "title": "Emergency drill completed", "body": "Quarterly emergency drill at Panipat Refinery completed. Response time: 4.2 minutes. All workers accounted for.", "data": {"category": "incidents", "priority": "low"}},
    {"type": "warning", "title": "Compliance audit due in 7 days", "body": "Q3 compliance audit for Vadodara Plant is due on 19 July 2026. Prepare documentation and safety records.", "data": {"category": "compliance", "priority": "medium"}},
]

REPORTS = [
    {"name": "Monthly Asset Summary", "type": "PDF", "status": "completed", "schedule_cron": "Monthly", "params": {"date_range": "monthly"}},
    {"name": "Incident Report - July 2026", "type": "PDF", "status": "completed", "schedule_cron": "Monthly", "params": {"date_range": "monthly"}},
    {"name": "Compliance Audit Q2 2026", "type": "CSV", "status": "completed", "schedule_cron": "Quarterly", "params": {"quarter": "Q2"}},
    {"name": "Risk Assessment Weekly", "type": "PDF", "status": "pending", "schedule_cron": "Weekly", "params": {"scope": "all_assets"}},
    {"name": "Dashboard Daily Snapshot", "type": "CSV", "status": "completed", "schedule_cron": "Daily", "params": {"snapshot": True}},
    {"name": "Emergency Response Summary", "type": "PDF", "status": "completed", "schedule_cron": "Monthly", "params": {"include_sos": True, "include_drills": True}},
    {"name": "Worker Safety Report", "type": "PDF", "status": "completed", "schedule_cron": "Monthly", "params": {"include_checkins": True}},
    {"name": "Facility Health Overview", "type": "CSV", "status": "pending", "schedule_cron": "Weekly", "params": {"facilities": "all"}},
]


async def seed():
    async with async_session_factory() as session:
        notif_count = (await session.execute(select(func.count(Notification.id)))).scalar() or 0
        if notif_count == 0:
            now = datetime.now(timezone.utc)
            for i, n in enumerate(NOTIFICATIONS):
                created = now - timedelta(hours=i * 3)
                session.add(Notification(
                    type=n["type"],
                    title=n["title"],
                    body=n["body"],
                    data=n["data"],
                    read=i > 5,
                    read_at=(created + timedelta(minutes=10)).isoformat() if i > 5 else None,
                    created_at=created,
                ))
            await session.commit()
            print(f"Seeded {len(NOTIFICATIONS)} notifications")
        else:
            print(f"Notifications table has {notif_count} rows, skipping seed")

        report_count = (await session.execute(select(func.count(Report.id)))).scalar() or 0
        if report_count == 0:
            now = datetime.now(timezone.utc)
            for i, r in enumerate(REPORTS):
                created = now - timedelta(days=i * 2)
                session.add(Report(
                    name=r["name"],
                    type=r["type"],
                    status=r["status"],
                    schedule_cron=r["schedule_cron"],
                    params=r["params"],
                    last_run_at=(created + timedelta(hours=1)).isoformat() if r["status"] == "completed" else None,
                    created_at=created,
                ))
            await session.commit()
            print(f"Seeded {len(REPORTS)} reports")
        else:
            print(f"Reports table has {report_count} rows, skipping seed")


if __name__ == "__main__":
    asyncio.run(seed())
