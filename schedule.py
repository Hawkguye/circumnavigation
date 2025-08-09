import requests
import json
import os
from datetime import datetime
import time
import re

airports_file = "static/game/airports.json"
data_dir = "static/schedule"

# --- Process all airports from airport.json ---
with open(airports_file, "r", encoding="utf-8") as f:
    airports = json.load(f)
valid_iata_set = {a.get("iata_code") for a in airports if a.get("iata_code")}

CARGO_AIRLINES = [
    "FedEx", "FedEx Express",
    "UPS Airlines", "United Parcel Service", "UPS",
    "DHL Aviation", "DHL", "DHL Express",
    "Amazon Air", "Prime Air",
    "Cargojet", "Cargojet Airways",
    "Cargolux",
    "Atlas Air",
    "Kalitta Air",
    "ABX Air",
    "Air Transport International", "ATI",
    "Southern Air",
    "Polar Air Cargo",
    "National Airlines",  # Cargo ops
    "Amerijet International",
    "Martinair Cargo",
    "Lufthansa Cargo",
    "Emirates SkyCargo",
    "Qatar Airways Cargo",
    "Cathay Pacific Cargo",
    "Singapore Airlines Cargo",
    "China Cargo Airlines",
    "SF Airlines",
    "YTO Cargo Airlines",
    "YunExpress",  # Often shows up as charters
    "ASL Airlines Belgium",
    "ASL Airlines Ireland",
    "ASL Airlines France",
    "Western Global Airlines",
    "Nippon Cargo Airlines",
    "ANA Cargo",
    "Korean Air Cargo",
    "AirBridgeCargo",
    "Air China Cargo",
    "China Southern Cargo",
    "EVA Air Cargo",
    "MasAir",
    "LATAM Cargo",
    "Avianca Cargo",
    "TAM Cargo",
    "Aerologic",
    "Turkish Cargo",
    "Etihad Cargo",
    "Saudia Cargo",
    "Qantas Freight",
    "Tasman Cargo Airlines",
    "Solinair",
    "Bluebird Nordic",
    "SmartLynx Cargo",
    "Sky Gates Airlines",
    "Silk Way Airlines",
    "Silk Way West Airlines",
    "MNG Airlines",
    "Astral Aviation",
    "Star Air",  # (India, Denmark - both cargo ops)
    "Avia Solutions Group",  # If shown as operator
    "CargoLogicAir",
    "West Atlantic",
    "Air Incheon",
    "Royal Air Maroc Cargo",
    "Ukraine Air Alliance",
    "Georgian Airways Cargo",
    "Transcarga",
    "TUI Cargo",  # Sometimes shown separately
    "Northern Air Cargo",
    "21 Air",
    "iAero Airways",  # Previously Swift Air
    "JetOneX",  # British startup cargo
    "China Postal Airlines",
]

def is_cargo_flight(airline_name):
    if not airline_name:
        return False
    airline_name_lower = airline_name.lower()
    if any(airline_name_lower == cargo.lower() for cargo in CARGO_AIRLINES):
        return True
    if "cargo" in airline_name_lower:
        return True
    return False

def merge_times(old_time, new_time):
    times = sorted(set(old_time.split(" / ") + [new_time]))
    return " / ".join(times)

def clean_airline_name(name):
    if not name:
        return name
    # Remove anything in parentheses, including the parentheses themselves
    return re.sub(r"\s*\(.*?\)\s*", "", name).strip()

def time_difference_minutes(time1, time2):
    """Returns absolute difference between two HH:MM strings in minutes."""
    fmt = "%H:%M"
    try:
        t1 = datetime.strptime(time1, fmt)
        t2 = datetime.strptime(time2, fmt)
        diff = abs((t1 - t2).total_seconds()) / 60
        return diff
    except ValueError:
        return 9999  # fallback to force separate entry if invalid

def fetch_departure(iata):
    # time.sleep(0.2)
    print(f"Fetching {iata} data.")
    
    all_departures = []
    base_url = "https://api.flightradar24.com/common/v1/airport.json?code={iata}&limit=100&page={page}"
    headers = {
        "User-Agent": "Mozilla/5.0",
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

    for page in range(2, total_pages + 1):
        time.sleep(0.2)
        response = requests.get(base_url.format(iata=iata, page=page), headers=headers)
        if response.status_code != 200:
            continue
        data = response.json()
        departures = data["result"]["response"]["airport"]["pluginData"]["schedule"]["departures"]["data"]
        all_departures.extend(departures)

    # Load existing data
    existing_data = []
    filepath = f"{data_dir}/{iata}.json"
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            existing_data = json.load(f)

    # Index existing data by flight number
    flight_index = {}
    for entry in existing_data:
        flight_number = entry["flight_number"]
        if flight_number not in flight_index:
            flight_index[flight_number] = []
        flight_index[flight_number].append(entry)

    new_entries = []
    skipped = 0

    for item in all_departures:
        flight = item.get("flight")
        if not flight:
            skipped += 1
            continue

        try:
            flight_number = flight.get("identification", {}).get("number", {}).get("default", "null")
            raw_airline_name = flight.get("airline", {}).get("name", "null")
            airline_name = clean_airline_name(raw_airline_name)

            if is_cargo_flight(airline_name):
                skipped += 1
                continue

            scheduled_dep_utc = flight.get("time", {}).get("scheduled", {}).get("departure")
            scheduled_arr_utc = flight.get("time", {}).get("scheduled", {}).get("arrival")

            if not (scheduled_dep_utc and scheduled_arr_utc):
                raise ValueError("Missing scheduled times.")

            duration_seconds = scheduled_arr_utc - scheduled_dep_utc
            duration_str = f"{duration_seconds // 3600:02}:{(duration_seconds % 3600) // 60:02}"

            dest = flight.get("airport", {}).get("destination", {})
            dest_offset = dest.get("timezone", {}).get("offset", 0)
            destination_iata = dest.get("code", {}).get("iata", "null")

            if destination_iata not in valid_iata_set:
                skipped += 1
                continue

            local_departure_dt = datetime.utcfromtimestamp(scheduled_dep_utc + origin_offset)
            local_arrival_dt = datetime.utcfromtimestamp(scheduled_arr_utc + dest_offset)

            day_diff = (local_arrival_dt.date() - local_departure_dt.date()).days
            arrival_note = f" ({day_diff:+d})" if day_diff else ""

            local_departure_str = local_departure_dt.strftime("%H:%M")
            local_arrival_str = local_arrival_dt.strftime("%H:%M") + arrival_note

            destination_name = dest.get("name", "null")
            region_city = dest.get("position", {}).get("region", {}).get("city", "null")
            country_name = dest.get("position", {}).get("country", {}).get("name", "null")

            found = False
            if flight_number in flight_index:
                for existing in flight_index[flight_number]:
                    if existing["destination_iata"] == destination_iata:
                        time_diff = time_difference_minutes(existing["local_departure_time"].split(" / ")[0], local_departure_str)
                        if time_diff <= 60:
                            # Merge times
                            existing["local_departure_time"] = merge_times(existing["local_departure_time"], local_departure_str)
                            existing["local_arrival_time"] = merge_times(existing["local_arrival_time"], local_arrival_str)
                            found = True
                            break


            if not found:
                new_entry = {
                    "flight_number": flight_number,
                    "airline_name": airline_name,
                    "destination_iata": destination_iata,
                    "destination_airport_name": destination_name,
                    "destination_city": region_city,
                    "destination_country": country_name,
                    "local_departure_time": local_departure_str,
                    "local_arrival_time": local_arrival_str,
                    "duration": duration_str
                }
                new_entries.append(new_entry)
                if flight_number not in flight_index:
                    flight_index[flight_number] = []
                flight_index[flight_number].append(new_entry)

        except Exception as e:
            skipped += 1

    combined = []
    for flights in flight_index.values():
        combined.extend(flights)

    combined_sorted = sorted(combined, key=lambda x: x["local_departure_time"])
    os.makedirs(data_dir, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(combined_sorted, f, indent=4, ensure_ascii=False)

    print(f"Airport: {iata}. Added {len(new_entries)} new flights (skipped {skipped}). Total: {len(combined_sorted)}")

# --- Fetch all airports ---
can_start = False
for airport in airports:
    iata = airport.get("iata_code")
    if iata == "SIN":
        can_start = True
    if iata and can_start:
        fetch_departure(iata)
