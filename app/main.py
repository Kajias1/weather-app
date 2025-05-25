from fastapi import FastAPI, HTTPException, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from geopy.geocoders import Nominatim
from retry_requests import retry
import openmeteo_requests
import requests_cache
import httpx
import logging

app = FastAPI()

geolocator = Nominatim(user_agent="geoapi")

cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)

templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

URL = "https://api.open-meteo.com/v1/forecast"

@app.get('/', response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get('/api/get_weather/{city_name}')
async def get_weather(city_name: str):
    try:
        location = geolocator.geocode(city_name)

        if not location:
            logging.error(f"City not found: {city_name}")
            raise HTTPException(status_code=404, detail=f"City '{city_name}' not found")

        params = {
            "latitude": location.latitude,
            "longitude": location.longitude,
            "daily": ["weather_code"],
            "timezone": "auto",
            "forecast_days": 14
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(URL, params=params)
            if response.status_code != 200:
                logging.error(f"Weather API error: {response.text}")
                raise HTTPException(status_code=500, detail="Weather API error")

        return response.json()

    except Exception as e:
        logging.exception(f"Unexpected error for city '{city_name}': {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
