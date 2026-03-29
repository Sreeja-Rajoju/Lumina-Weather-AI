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
GEMINI_API_KEYS_RAW = os.environ.get("GEMINI_API_KEYS", "")
GEMINI_API_KEYS = [k.strip() for k in GEMINI_API_KEYS_RAW.split(",") if k.strip()]
GEMMA_MODEL = "gemma-3-27b-it"

def get_gemini_client(api_key):
    if not api_key:
        return None
    try:
        client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        print(f"[ERROR] Failed to init Gemini with key {api_key[:5]}... : {e}")
        return None

# Initial client setup
current_key_index = 0
gemini_client = get_gemini_client(GEMINI_API_KEYS[0]) if GEMINI_API_KEYS else None
if gemini_client:
    print(f"[OK] Google GenAI initialized with model: {GEMMA_MODEL} (Key 1)")


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
    global gemini_client, current_key_index
    
    if not GEMINI_API_KEYS:
        fallback = get_smart_fallback(weather)
        return {**fallback, "summary": "AI Insight unavailable (No API Keys).", "activities": "General outdoor safety advised."}

    # Attempt with current client, then try next keys if Quota Exceeded
    initial_index = current_key_index
    for i in range(len(GEMINI_API_KEYS)):
        idx = (initial_index + i) % len(GEMINI_API_KEYS)
        current_key = GEMINI_API_KEYS[idx]
        
        # Refresh client if key changed
        if idx != current_key_index or not gemini_client:
            gemini_client = get_gemini_client(current_key)
            current_key_index = idx
            
        if not gemini_client:
            continue

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
                data = json.loads(response_text)
                return data
            except json.JSONDecodeError:
                json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                raise ValueError("Could not parse JSON")
                
        except Exception as e:
            error_msg = str(e).lower()
            if "quota" in error_msg or "429" in error_msg or "limit" in error_msg:
                print(f"[!] Key {idx+1} exceeded. Switching to next key...")
                continue # Try next key
            else:
                print(f"Gemma AI Error (Key {idx+1}): {e}")
                break # Non-quota error, don't retry

    # Absolute fallback if all keys fail or error occurred
    fallback = get_smart_fallback(weather)
    return {**fallback, "summary": "AI Insight currently unavailable.", "activities": "General outdoor safety advised."}


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

                # AI Insights are now fetched separately for better performance
                insights = None

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

@app.route("/api/ai-insights", methods=["GET"])
def api_ai_insights():
    city = flask_request.args.get("city", "London")
    units = flask_request.args.get("units", "metric")
    
    # Try to get from cache first
    cache_key = f"{city}_{units}"
    cached_data = weather_cache.get(cache_key)
    
    # If cached and contains insights, return immediately
    if cached_data and cached_data[0].get("insights") and (time.time() - cached_data[1] < CACHE_DURATION):
        return jsonify(cached_data[0]["insights"])

    # If no cache or insights, calculate (this part takes time)
    try:
        # We need the base weather data for the AI prompt
        params = {"q": city, "appid": API_KEY, "units": units}
        resp = requests.get(CURRENT_URL, params=params, timeout=5)
        if resp.status_code != 200:
            return jsonify({"error": "City not found"}), 404
            
        data = resp.json()
        weather_data = {
            "temp": round(data["main"]["temp"]),
            "description": data["weather"][0]["description"],
            "rain_chance": 40 if "rain" in data else 0, # Simple estimate
            "uv_index": 5 # Placeholder for fast fallback if needed
        }
        
        # AQI and Pollen if available in cache, otherwise None
        aqi_data = cached_data[0].get("aqi") if cached_data else None
        pollen_data = cached_data[0].get("pollen") if cached_data else None
        
        insights = get_ai_insights(weather_data, aqi_data, pollen_data)
        
        # Update cache with insights if possible
        if cached_data:
            cached_data[0]["insights"] = insights
            
        return jsonify(insights)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
