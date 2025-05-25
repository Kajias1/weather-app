import pytest
from fastapi import status
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app

class MockLocation:
    latitude = 55.7558
    longitude = 37.6173

# Эти три теста проверяют работу API-эндпойнта /api/get_weather/{city_name}, который возвращает данные о погоде по названию города
# 
# 1. test_get_weather_success — проверяет, что при корректном названии города (например, "Moscow") и успешном ответе от внешнего погодного API
#    сервер возвращает статус 200 и корректные данные, такие как широта, прогноз погоды и коды погоды
#
# 2. test_get_weather_city_not_found — проверяет случай, когда введён несуществующий город. 
#    Функция геолокации возвращает None, и API должно вернуть статус 404 (или 500 в зависимости от реализации)
#
# 3. test_get_weather_api_failure — проверяет, что если внешний погодный API возвращает ошибку (например, статус 500),
#    то сервер также корректно обрабатывает это и возвращает соответствующую ошибку (500 и сообщение об ошибке)

@pytest.mark.asyncio
async def test_get_weather_success():
    with patch('app.main.geolocator.geocode', return_value=MockLocation()):
        with patch('httpx.AsyncClient.get', new_callable=AsyncMock) as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "latitude": 55.7558,
                "longitude": 37.6173,
                "daily": {
                    "weather_code": [1, 2, 3],
                    "time": ["2025-05-25", "2025-05-26", "2025-05-27"]
                }
            }
            mock_get.return_value = mock_response

            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as ac:
                response = await ac.get("/api/get_weather/Moscow")
                
            assert response.status_code == status.HTTP_200_OK
            data = await response.json()
            assert "latitude" in data
            assert "daily" in data
            assert "weather_code" in data["daily"]

@pytest.mark.asyncio
async def test_get_weather_city_not_found():
    with patch('app.main.geolocator.geocode', return_value=None):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            response = await ac.get("/api/get_weather/UnknownCity")

        assert response.status_code in (404, 500)

@pytest.mark.asyncio
async def test_get_weather_api_failure():
    with patch('app.main.geolocator.geocode', return_value=MockLocation()):
        with patch('httpx.AsyncClient.get', new_callable=AsyncMock) as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 500
            mock_response.json.return_value = {"detail": "Error"}
            mock_get.return_value = mock_response

            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as ac:
                response = await ac.get("/api/get_weather/Moscow")
            
            assert response.status_code == 500
            await response.json() == {"detail": "Weather API error"}
