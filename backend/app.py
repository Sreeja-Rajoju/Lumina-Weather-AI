import requests
from flask import Flask, render_template, request
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import time
import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Resolve paths: backend/ is the Python root, frontend/ lives one level up
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

app = Flask(
    __name__,
    template_folder=os.path.join(FRONTEND_DIR, "templates"),
    static_folder=os.path.join(FRONTEND_DIR, "static")
)

# OpenWeather API Configuration
API_KEY = os.environ.get("OPENWEATHER_API_KEY")
CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
AQI_URL = "http://api.openweathermap.org/data/2.5/air_pollution"

# Groq AI Configuration (Replacing Gemini)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Groq Init Error: {e}")

# Legacy Gemini Config (Commented out)
# GEMINI_API_KEY = "AIzaSyBc8WVLoFvUfWNSDyOnArqxNWam_6UnV-U"
# if GEMINI_API_KEY:
#     genai.configure(api_key=GEMINI_API_KEY)


# Simple Cache
weather_cache = {}
CACHE_DURATION = 600  # 10 minutes

# Clear cache on every restart during development to ensure updates
weather_cache.clear()

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
    if not groq_client:
        fallback = get_smart_fallback(weather)
        return {**fallback, "summary": "Current patterns suggest standard " + weather['description'].lower() + ".", "activities": "Outdoor activities are fine with normal precautions."}
    
    try:
        # Construct weather context with optional data
        aqi_str = f"AQI: {aqi['val']} ({aqi['label']})" if aqi else "AQI: Not available"
        pollen_str = f"Pollen (Grass): {pollen['grass']}, (Tree): {pollen['tree']}" if pollen else "Pollen: Not available"

        prompt = f"""
        Weather: {weather['temp']}°C, {weather['description']}, {weather['rain_chance']}% rain.
        {aqi_str}, {pollen_str}, UV Index: {weather['uv_index']}.
        
        Provide a smart JSON object with:
        1. "summary": A catchy, concise 1-sentence overview of the day's vibe (e.g., "A breezy, sun-kissed morning with a chance of puddles!")
        2. "activities": A context-aware activity recommendation (e.g., "Perfect for a scenic jog," "High UV - stay in the shade between 11-3.")
        3. "men": Comma-separated essentials (e.g., "Shorts, T-shirt")
        4. "women": Comma-separated essentials (e.g., "Sundress, Sunglasses")
        
        ONLY use general terms for clothing: shorts, t-shirts, sweaters, jackets, hoodies, jeans, caps, sunglasses, gloves, scarves, boots.
        Format MUST be JSON: {{"summary": "...", "activities": "...", "men": "...", "women": "..."}}
        """
        
        response = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Groq API Error: {e}")
        fallback = get_smart_fallback(weather)
        return {**fallback, "summary": "AI Insight unavailable.", "activities": "General outdoor safety advised."}

@app.route("/", methods=["GET", "POST"])
def index():
    weather_data = None
    forecast_data = None
    daily_forecast = None
    error_message = None
    aqi_data = None
    pollen_data = None
    
    city = "London"
    units = request.args.get("units", "metric")
    result_payload = {}
    insights = None

    if request.method == "POST":
        city = request.form.get("city")
    
    # Priority: GET (from URL/toggle) > POST > Default
    city = request.args.get("city") or city

    if not city and request.args.get("lat") and request.args.get("lon"):
        lat = request.args.get("lat")
        lon = request.args.get("lon")
        # Try cache for geo-lookup to save API call
        cache_key = f"geo_{lat}_{lon}"
        cached_city = weather_cache.get(cache_key)
        
        if cached_city and (time.time() - cached_city[1] < CACHE_DURATION):
            city = cached_city[0]
        else:
            try:
                rev_url = f"http://api.openweathermap.org/geo/1.0/reverse?lat={lat}&lon={lon}&limit=1&appid={API_KEY}"
                rev_resp = requests.get(rev_url, timeout=3)
                if rev_resp.status_code == 200 and len(rev_resp.json()) > 0:
                    city = rev_resp.json()[0]["name"]
                    weather_cache[cache_key] = (city, time.time())
            except:
                city = "Your Location"

    if not city:
        error_message = "Please enter a city name."
    else:
        # Check Cache
        cache_key = f"{city}_{units}"
        cached_data = weather_cache.get(cache_key)
        
        if cached_data and (time.time() - cached_data[1] < CACHE_DURATION):
            # unpack cached data
            return render_template("index.html", **cached_data[0])

        try:
            # 1. Fetch Current Weather (We need this first for lat/lon)
            params = {"q": city, "appid": API_KEY, "units": units}
            curr_resp = requests.get(CURRENT_URL, params=params, timeout=5)
            
            if curr_resp.status_code == 200:
                data = curr_resp.json()
                lat = data["coord"]["lat"]
                lon = data["coord"]["lon"]
                
                # Parallelize dependent requests
                with ThreadPoolExecutor() as executor:
                    # Define tasks
                    future_uv = executor.submit(requests.get, f"https://api.openweathermap.org/data/2.5/uvi?lat={lat}&lon={lon}&appid={API_KEY}", timeout=3)
                    future_forecast = executor.submit(requests.get, FORECAST_URL, params=params, timeout=5)
                    future_aqi = executor.submit(requests.get, f"{AQI_URL}?lat={lat}&lon={lon}&appid={API_KEY}", timeout=3)
                    future_pollen = executor.submit(requests.get, f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=pm10,pm2_5,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&timezone=auto", timeout=3)

                    # Process Weather Data (Wait early as we need it for insights)
                    rain_chance = 0
                    if "rain" in data:
                        rain_chance = 80
                    elif data["weather"][0]["main"].lower() in ["clouds", "drizzle"]:
                        rain_chance = 40

                    # Process UV
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

                    # Process AQI/Pollen for Insight prompt
                    try:
                        aqi_resp = future_aqi.result()
                        if aqi_resp.status_code == 200:
                            aqi_json = aqi_resp.json()
                            aqi_val = aqi_json["list"][0]["main"]["aqi"]
                            aqi_map = {1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor"}
                            aqi_data = {"val": aqi_val, "label": aqi_map.get(aqi_val, "Unknown")}
                    except: pass

                    try:
                        om_resp = future_pollen.result()
                        if om_resp.status_code == 200:
                            om_json = om_resp.json()
                            curr = om_json.get("current", {})
                            pollen_data = {
                                "pm10": curr.get("pm10", 0),
                                "pm2_5": curr.get("pm2_5", 0),
                                "grass": curr.get("grass_pollen", 0),
                                "tree": curr.get("birch_pollen", 0)
                            }
                    except: pass

                    # Generate Insights using all data point
                    insights = get_ai_insights(weather_data, aqi_data, pollen_data)

                    # Process Remaining Data
                    try:
                        fore_resp = future_forecast.result()
                        if fore_resp.status_code == 200:
                            f_data = fore_resp.json()
                            rain_count = 0
                            for item in f_data["list"][:8]:
                                if "rain" in item or item["weather"][0]["main"].lower() in ["rain", "drizzle", "thunderstorm"]:
                                    rain_count += 1
                            if rain_count > 0:
                                weather_data["rain_chance"] = round(min(100, (rain_count / 8) * 100))

                            forecast_list = []
                            for item in f_data["list"][:7]:
                                forecast_list.append({
                                    "time": datetime.fromtimestamp(item["dt"]).strftime('%I %p'),
                                    "temp": round(item["main"]["temp"]),
                                    "icon": item["weather"][0]["icon"]
                                })
                            forecast_data = forecast_list

                            daily_data = {}
                            for item in f_data["list"]:
                                date = datetime.fromtimestamp(item["dt"]).strftime('%Y-%m-%d')
                                if date not in daily_data:
                                    daily_data[date] = {"temps": [], "icon": item["weather"][0]["icon"], "description": item["weather"][0]["description"]}
                                daily_data[date]["temps"].append(item["main"]["temp"])
                            
                            daily_list = []
                            for date, info in list(daily_data.items())[:5]:
                                daily_list.append({
                                    "day": datetime.strptime(date, '%Y-%m-%d').strftime('%a'),
                                    "date": datetime.strptime(date, '%Y-%m-%d').strftime('%d %b'),
                                    "high": round(max(info["temps"])),
                                    "low": round(min(info["temps"])),
                                    "icon": info["icon"],
                                    "description": info["description"].capitalize()
                                })
                            daily_forecast = daily_list
                    except: pass

                # Cache the result
                result_payload = {
                    "weather": weather_data, 
                    "forecast": forecast_data, 
                    "daily": daily_forecast, 
                    "error": error_message, 
                    "aqi": aqi_data, 
                    "pollen": pollen_data,
                    "insights": insights
                }
                weather_cache[cache_key] = (result_payload, time.time())

            elif curr_resp.status_code == 404:
                error_message = f"City '{city}' not found."
            else:
                error_message = "API error. Please try again."

        except requests.exceptions.RequestException:
            error_message = "Network error."

    return render_template("index.html", weather=weather_data, forecast=forecast_data, 
                         daily=daily_forecast, error=error_message, aqi=aqi_data, pollen=pollen_data,
                         insights=insights)

if __name__ == "__main__":
    app.run(debug=True)
