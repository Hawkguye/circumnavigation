import requests
import json
import os
from datetime import datetime
import time

airports_file = "static/game/airports.json"
data_dir = "static/schedule"

# --- Process all airports from airport.json ---
with open(airports_file, "r", encoding="utf-8") as f:
    airports = json.load(f)
valid_iata_set = {a.get("iata_code") for a in airports if a.get("iata_code")}

def fetch_departure(iata):
    print(f"Fetching {iata} data.")
    
    all_departures = []
    page = 1

    base_url = "https://api.flightradar24.com/common/v1/airport.json?code={iata}&limit=100&page={page}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://www.flightradar24.com/",
        "Origin": "https://www.flightradar24.com",
    }

    # Fetch first page
    first_response = requests.get(base_url.format(iata=iata, page=1), headers=headers)
    if first_response.status_code != 200:
        print(f"Request failed on page 1 for {iata} (HTTP {first_response.status_code})")
        return

    first_data = first_response.json()
    origin_offset = first_data["result"]["response"]["airport"]["pluginData"]["details"]["timezone"]["offset"]
    total_pages = first_data["result"]["response"]["airport"]["pluginData"]["schedule"]["departures"]["page"]["total"]
    all_departures.extend(first_data["result"]["response"]["airport"]["pluginData"]["schedule"]["departures"]["data"])

    # Remaining pages
    for page in range(2, total_pages + 1):
        time.sleep(0.2)
        response = requests.get(base_url.format(iata=iata, page=page), headers=headers)
        if response.status_code != 200:
            print(f"Request failed on page {page} for {iata} (HTTP {response.status_code})")
            continue
        data = response.json()
        departures = data["result"]["response"]["airport"]["pluginData"]["schedule"]["departures"]["data"]
        all_departures.extend(departures)

    # Load existing data
    existing_data = []
    existing_keys = set()
    filepath = f"{data_dir}/{iata}.json"
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
            for entry in existing_data:
                key = (
                    entry["flight_number"],
                    entry["local_departure_time"],
                    entry["local_arrival_time"],
                    entry["destination_iata"]
                )
                existing_keys.add(key)

    # Extract new data
    new_entries = {}
    skipped = 0

    for item in all_departures:
        flight = item.get("flight")
        if not flight:
            skipped += 1
            continue

        try:
            flight_number = flight.get("identification", {}).get("number", {}).get("default", "null")
            scheduled_dep_utc = flight.get("time", {}).get("scheduled", {}).get("departure")
            scheduled_arr_utc = flight.get("time", {}).get("scheduled", {}).get("arrival")

            if not (scheduled_dep_utc and scheduled_arr_utc):
                raise ValueError("Missing scheduled times.")

            # Duration in HH:MM
            duration_seconds = scheduled_arr_utc - scheduled_dep_utc
            duration_hours = duration_seconds // 3600
            duration_minutes = (duration_seconds % 3600) // 60
            duration_str = f"{int(duration_hours):02}:{int(duration_minutes):02}"

            dest = flight.get("airport", {}).get("destination", {})
            dest_offset = dest.get("timezone", {}).get("offset", 0)
            destination_iata = dest.get("code", {}).get("iata", "null")

            if destination_iata not in valid_iata_set:
                skipped += 1
                continue  # skip if destination not in airport.json

            local_departure_dt = datetime.utcfromtimestamp(scheduled_dep_utc + origin_offset)
            local_arrival_dt = datetime.utcfromtimestamp(scheduled_arr_utc + dest_offset)

            day_diff = (local_arrival_dt.date() - local_departure_dt.date()).days
            if day_diff == 1:
                arrival_note = " (+1)"
            elif day_diff == 2:
                arrival_note = " (+2)"
            elif day_diff == 3:
                arrival_note = " (+3)"
            elif day_diff == -1:
                arrival_note = " (-1)"
            elif day_diff == -2:
                arrival_note = " (-2)"
            else:
                arrival_note = ""
            
            local_departure_str = local_departure_dt.strftime("%H:%M")
            local_arrival_str = local_arrival_dt.strftime("%H:%M") + arrival_note

            key = (flight_number, local_departure_str, local_arrival_str, destination_iata)
            if key in existing_keys or key in new_entries:
                continue

            aircraft_model = flight.get("aircraft", {}).get("model", {}).get("text", "null")
            airline_name = flight.get("airline", {}).get("name", "null")
            destination_name = dest.get("name", "null")
            region_city = dest.get("position", {}).get("region", {}).get("city", "null")
            country_name = dest.get("position", {}).get("country", {}).get("name", "null")
            # destination_full = f"{destination_name}, {region_city}, {country_name}"

            new_entries[key] = {
                "flight_number": flight_number,
                "aircraft_model": aircraft_model,
                "airline_name": airline_name,
                "destination_iata": destination_iata,
                "destination_airport_name": destination_name,
                "destination_city": region_city,
                "destination_country": country_name,
                "local_departure_time": local_departure_str,
                "local_arrival_time": local_arrival_str,
                "duration": duration_str
            }

        except Exception as e:
            skipped += 1
            # print(f"Skipping a flight for {iata}: {e}")

    # Merge, sort, and save
    combined = existing_data + list(new_entries.values())
    combined_sorted = sorted(combined, key=lambda x: x["local_departure_time"])

    os.makedirs(data_dir, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(combined_sorted, f, indent=4, ensure_ascii=False)

    print(f"Airport: {iata}. Added {len(new_entries)} new flights (skipped {skipped}). Total: {len(combined_sorted)}")

can_start = True
for airport in airports:
    iata = airport.get("iata_code")
    if iata == "MCO":
        can_start = True
    if iata and can_start:
        fetch_departure(iata)
