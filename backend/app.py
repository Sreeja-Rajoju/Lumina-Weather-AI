import requests
import json
import re
from flask import Flask, jsonify, request as flask_request
from flask_cors import CORS
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import time
import os
from google import genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS for all routes (allows frontend on Vercel to call this API)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# OpenWeather API Configuration
API_KEY = os.environ.get("OPENWEATHER_API_KEY")
CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
AQI_URL = "http://api.openweathermap.org/data/2.5/air_pollution"
GEO_URL = "http://api.openweathermap.org/geo/1.0/reverse"

# Google GenAI Configuration (Gemma 3 27B IT)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
gemini_client = None
GEMMA_MODEL = "gemma-3-27b-it"
if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        print(f"[OK] Google GenAI initialized with model: {GEMMA_MODEL}")
    except Exception as e:
        print(f"[ERROR] Google GenAI Init Error: {e}")


# Simple Cache
weather_cache = {}
CACHE_DURATION = 600  # 10 minutes

def get_smart_fallback(weather):
    temp = weather.get('temp', 20)
    rain = weather.get('rain_chance', 0)
    
    if temp < -10:
        base = "Heavy parka, thermal layers, gloves, scarf"
    elif temp < 5:
        base = "Winter coat, sweater, gloves"
    elif temp < 15:
        base = "Jacket, sweater, jeans"
    elif temp < 25:
        base = "T-shirt, light cardigan, jeans"
    else:
        base = "T-shirt, shorts, sunglasses"
        
    if rain > 40:
        base += ", umbrella"
    
    return {"men": base, "women": base}

def get_ai_insights(weather, aqi=None, pollen=None):
    if not gemini_client:
        fallback = get_smart_fallback(weather)
        return {**fallback, "summary": "Current patterns suggest standard " + weather['description'].lower() + ".", "activities": "Outdoor activities are fine with normal precautions."}
    
    try:
        aqi_str = f"AQI: {aqi['val']} ({aqi['label']})" if aqi else "AQI: Not available"
        pollen_str = f"Pollen (Grass): {pollen['grass']}, (Tree): {pollen['tree']}" if pollen else "Pollen: Not available"

        prompt = f"""You are a weather assistant. Based on the following weather data, respond with ONLY a valid JSON object and nothing else.

Weather: {weather['temp']}°C, {weather['description']}, {weather['rain_chance']}% rain.
{aqi_str}, {pollen_str}, UV Index: {weather['uv_index']}.

Respond with this exact JSON structure:
{{"summary": "A catchy 1-sentence overview of the day", "activities": "A context-aware activity recommendation", "men": "Comma-separated clothing essentials for men", "women": "Comma-separated clothing essentials for women"}}

ONLY use general clothing terms: shorts, t-shirts, sweaters, jackets, hoodies, jeans, caps, sunglasses, gloves, scarves, boots.
Do NOT include any explanation, markdown, or code fences. Output the raw JSON object only."""
        
        response = gemini_client.models.generate_content(
            model=GEMMA_MODEL,
            contents=prompt
        )
        
        response_text = response.text.strip()
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError(f"Could not parse JSON from response: {response_text[:200]}")
            
    except Exception as e:
        print(f"Gemma AI Error: {e}")
        fallback = get_smart_fallback(weather)
        return {**fallback, "summary": "AI Insight unavailable.", "activities": "General outdoor safety advised."}


# ─── Health Check ───
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Lumina Weather AI API", "model": GEMMA_MODEL})


# ─── Proxy Geocoding API ───
@app.route("/api/reverse-geocode", methods=["GET"])
def reverse_geocode():
    lat = flask_request.args.get("lat")
    lon = flask_request.args.get("lon")
    
    if not lat or not lon:
        return jsonify({"error": "Missing coordinates"}), 400
        
    try:
        params = {"lat": lat, "lon": lon, "limit": 5, "appid": API_KEY}
        resp = requests.get(GEO_URL, params=params, timeout=5)
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Main Weather API ───
@app.route("/api/weather", methods=["GET"])
def api_weather():
    city = flask_request.args.get("city")
    units = flask_request.args.get("units", "metric")
    lat = flask_request.args.get("lat")
    lon = flask_request.args.get("lon")

    # If lat/lon provided, reverse geocode to get city name
    if lat and lon and not city:
        try:
            params = {"lat": lat, "lon": lon, "limit": 1, "appid": API_KEY}
            rev_resp = requests.get(GEO_URL, params=params, timeout=3)
            if rev_resp.status_code == 200 and len(rev_resp.json()) > 0:
                city = rev_resp.json()[0]["name"]
        except:
            pass

    if not city:
        city = "London" # Default

    # Check Cache
    cache_key = f"{city}_{units}"
    cached_data = weather_cache.get(cache_key)
    
    if cached_data and (time.time() - cached_data[1] < CACHE_DURATION):
        return jsonify(cached_data[0])

    try:
        # 1. Fetch Current Weather
        params = {"q": city, "appid": API_KEY, "units": units}
        curr_resp = requests.get(CURRENT_URL, params=params, timeout=5)
        
        if curr_resp.status_code == 200:
            data = curr_resp.json()
            lat = data["coord"]["lat"]
            lon = data["coord"]["lon"]
            
            with ThreadPoolExecutor() as executor:
                future_uv = executor.submit(requests.get, f"https://api.openweathermap.org/data/2.5/uvi?lat={lat}&lon={lon}&appid={API_KEY}", timeout=3)
                future_forecast = executor.submit(requests.get, FORECAST_URL, params=params, timeout=5)
                future_aqi = executor.submit(requests.get, f"{AQI_URL}?lat={lat}&lon={lon}&appid={API_KEY}", timeout=3)
                future_pollen = executor.submit(requests.get, f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=pm10,pm2_5,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&timezone=auto", timeout=3)

                rain_chance = 0
                if "rain" in data:
                    rain_chance = 80
                elif data["weather"][0]["main"].lower() in ["clouds", "drizzle"]:
                    rain_chance = 40

                uv_index = 0
                try:
                    uv_resp = future_uv.result()
                    if uv_resp.status_code == 200:
                        uv_index = round(uv_resp.json().get("value", 0))
                except: pass

                weather_data = {
                    "city": data["name"],
                    "country": data["sys"]["country"],
                    "temp": round(data["main"]["temp"]),
                    "description": data["weather"][0]["description"].capitalize(),
                    "humidity": data["main"]["humidity"],
                    "wind_speed": data["wind"]["speed"],
                    "icon": data["weather"][0]["icon"],
                    "feels_like": round(data["main"]["feels_like"]),
                    "high": round(data["main"]["temp_max"]),
                    "low": round(data["main"]["temp_min"]),
                    "sunrise": datetime.fromtimestamp(data["sys"]["sunrise"]).strftime('%I:%M %p'),
                    "sunset": datetime.fromtimestamp(data["sys"]["sunset"]).strftime('%I:%M %p'),
                    "date": datetime.now().strftime('%A, %d %b %Y'),
                    "condition": data["weather"][0]["main"].lower(),
                    "uv_index": uv_index,
                    "rain_chance": rain_chance
                }

                # AQI & Pollen & Insights
                aqi_data = None
                try:
                    aqi_resp = future_aqi.result()
                    if aqi_resp.status_code == 200:
                        aqi_val = aqi_resp.json()["list"][0]["main"]["aqi"]
                        aqi_map = {1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor"}
                        aqi_data = {"val": aqi_val, "label": aqi_map.get(aqi_val, "Unknown")}
                except: pass

                pollen_data = None
                try:
                    om_resp = future_pollen.result()
                    if om_resp.status_code == 200:
                        curr = om_resp.json().get("current", {})
                        pollen_data = {"pm10": curr.get("pm10", 0), "pm2_5": curr.get("pm2_5", 0), "grass": curr.get("grass_pollen", 0), "tree": curr.get("birch_pollen", 0)}
                except: pass

                insights = get_ai_insights(weather_data, aqi_data, pollen_data)

                # Forecast
                forecast_data = []
                daily_forecast = []
                try:
                    fore_resp = future_forecast.result()
                    if fore_resp.status_code == 200:
                        f_json = fore_resp.json()
                        forecast_data = [{"time": datetime.fromtimestamp(x["dt"]).strftime('%I %p'), "temp": round(x["main"]["temp"]), "icon": x["weather"][0]["icon"]} for x in f_json["list"][:7]]
                        
                        daily_dict = {}
                        for x in f_json["list"]:
                            d = datetime.fromtimestamp(x["dt"]).strftime('%Y-%m-%d')
                            if d not in daily_dict: daily_dict[d] = {"temps": [], "icon": x["weather"][0]["icon"]}
                            daily_dict[d]["temps"].append(x["main"]["temp"])
                        
                        for d, info in list(daily_dict.items())[:5]:
                            daily_forecast.append({"day": datetime.strptime(d, '%Y-%m-%d').strftime('%a'), "date": datetime.strptime(d, '%Y-%m-%d').strftime('%d %b'), "high": round(max(info["temps"])), "low": round(min(info["temps"])), "icon": info["icon"]})
                except: pass

            res = {"weather": weather_data, "forecast": forecast_data, "daily": daily_forecast, "aqi": aqi_data, "pollen": pollen_data, "insights": insights}
            weather_cache[cache_key] = (res, time.time())
            return jsonify(res)

        return jsonify({"error": f"City {city} not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
