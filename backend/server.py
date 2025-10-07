from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date, time, timezone
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Articard Turvafirma - Töövahetus System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enums
class IncidentType(str, Enum):
    GENERAL = "general"
    THEFT = "theft"

class Gender(str, Enum):
    MALE = "mees"
    FEMALE = "naine"

class TheftOutcome(str, Enum):
    RELEASED = "vabastatud"
    PAID_RELEASED = "maksis_vabastatud"
    POLICE = "politsei"

# Helper functions for date/time serialization
def prepare_for_mongo(data):
    """Convert date/time objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, date) and not isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, time):
                data[key] = value.strftime('%H:%M:%S')
            elif isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
            elif isinstance(value, list):
                data[key] = [prepare_for_mongo(item) if isinstance(item, dict) else item for item in value]
    return data

def parse_from_mongo(item):
    """Parse date/time strings back from MongoDB"""
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str):
                # Try to parse date strings
                try:
                    if 'T' in value and ':' in value:  # ISO datetime
                        item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    elif '-' in value and len(value) == 10:  # ISO date
                        item[key] = datetime.fromisoformat(value).date()
                    elif ':' in value and len(value) == 8:  # Time format
                        item[key] = datetime.strptime(value, '%H:%M:%S').time()
                except ValueError:
                    pass  # Keep as string if not a date/time
            elif isinstance(value, dict):
                item[key] = parse_from_mongo(value)
            elif isinstance(value, list):
                item[key] = [parse_from_mongo(i) if isinstance(i, dict) else i for i in value]
    return item

# Models
class GeneralIncident(BaseModel):
    type: IncidentType = IncidentType.GENERAL
    description: str
    g4s_patrol_called: bool = False
    ambulance_called: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TheftIncident(BaseModel):
    type: IncidentType = IncidentType.THEFT
    gender: Gender
    amount: float
    special_tools_used: bool
    outcome: TheftOutcome
    description: str
    g4s_patrol_called: bool = False
    ambulance_called: bool = False
    theft_prevented: bool = False  # New field for prevented theft
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkShift(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: date
    object_name: str  # Objekt
    guard_name: str   # Turvamees
    start_time: time
    end_time: time
    incidents: List[dict] = Field(default_factory=list)  # Can contain both types
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkShiftCreate(BaseModel):
    date: date
    object_name: str
    guard_name: str
    start_time: time
    end_time: time

class WorkShiftUpdate(BaseModel):
    object_name: Optional[str] = None
    guard_name: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class IncidentCreate(BaseModel):
    shift_id: str
    incident_data: dict  # Will contain either GeneralIncident or TheftIncident data

# Routes
@api_router.get("/")
async def root():
    return {"message": "Articard Turvafirma - Töövahetus System"}

@api_router.post("/shifts", response_model=WorkShift)
async def create_shift(shift_data: WorkShiftCreate):
    shift = WorkShift(**shift_data.dict())
    shift_dict = prepare_for_mongo(shift.dict())
    
    result = await db.work_shifts.insert_one(shift_dict)
    if not result.inserted_id:
        raise HTTPException(status_code=400, detail="Failed to create shift")
    
    return shift

@api_router.get("/shifts", response_model=List[WorkShift])
async def get_shifts():
    shifts = await db.work_shifts.find().to_list(1000)
    parsed_shifts = [parse_from_mongo(shift) for shift in shifts]
    return [WorkShift(**shift) for shift in parsed_shifts]

@api_router.get("/shifts/{shift_id}", response_model=WorkShift)
async def get_shift(shift_id: str):
    shift = await db.work_shifts.find_one({"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    parsed_shift = parse_from_mongo(shift)
    return WorkShift(**parsed_shift)

@api_router.put("/shifts/{shift_id}", response_model=WorkShift)
async def update_shift(shift_id: str, shift_data: WorkShiftUpdate):
    shift = await db.work_shifts.find_one({"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    update_data = {k: v for k, v in shift_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    prepared_data = prepare_for_mongo(update_data)
    await db.work_shifts.update_one({"id": shift_id}, {"$set": prepared_data})
    
    updated_shift = await db.work_shifts.find_one({"id": shift_id})
    parsed_shift = parse_from_mongo(updated_shift)
    return WorkShift(**parsed_shift)

@api_router.delete("/shifts/{shift_id}")
async def delete_shift(shift_id: str):
    shift = await db.work_shifts.find_one({"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    result = await db.work_shifts.delete_one({"id": shift_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    return {"message": "Shift deleted successfully"}

@api_router.post("/shifts/{shift_id}/incidents")
async def add_incident(shift_id: str, incident: IncidentCreate):
    shift = await db.work_shifts.find_one({"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    # Validate and prepare incident data
    incident_data = incident.incident_data.copy()
    incident_data["timestamp"] = datetime.now(timezone.utc)
    
    prepared_incident = prepare_for_mongo(incident_data)
    
    await db.work_shifts.update_one(
        {"id": shift_id}, 
        {"$push": {"incidents": prepared_incident}}
    )
    
    return {"message": "Incident added successfully"}

@api_router.delete("/shifts/{shift_id}/incidents/{incident_index}")
async def remove_incident(shift_id: str, incident_index: int):
    shift = await db.work_shifts.find_one({"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    if incident_index >= len(shift.get("incidents", [])):
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Remove incident at specific index
    incidents = shift.get("incidents", [])
    incidents.pop(incident_index)
    
    await db.work_shifts.update_one(
        {"id": shift_id}, 
        {"$set": {"incidents": incidents}}
    )
    
    return {"message": "Incident removed successfully"}

@api_router.get("/shifts/by-month/{year}/{month}")
async def get_shifts_by_month(year: int, month: int):
    # Create start and end dates for the month
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    
    shifts = await db.work_shifts.find({
        "date": {
            "$gte": start_date.isoformat(),
            "$lt": end_date.isoformat()
        }
    }).to_list(1000)
    
    parsed_shifts = [parse_from_mongo(shift) for shift in shifts]
    return [WorkShift(**shift) for shift in parsed_shifts]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()