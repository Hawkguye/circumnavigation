from flask import Flask, request, jsonify, send_file, render_template, url_for, redirect, send_from_directory
from flask_cors import CORS
# from flask_sqlalchemy import SQLAlchemy
import json
import os
import random
import re
from datetime import datetime, timezone, timedelta
import html
import secrets
import traceback
from functools import wraps
import requests

from modals import PlayerStat, Game, TriviaQuestion
import scraper

from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# app.config['DEBUG'] = os.getenv('FLASK_DEBUG')

DATA_DIR = "data/game/"
DC_DATA_DIR = "data/daily_challenge/"
TRIVIA_JSON_DIR = "data/trivia/"
SCRAPER_URL = os.getenv('SCRAPER_URL', 'http://127.0.0.1:5051')

gamesList = []
IATA_codes = ['ACC', 'ACE', 'ADB', 'ADD', 'ADL', 'AER', 'AGP', 'AKL', 'ALA', 'ALC', 'ALG', 'AMM', 'AMS', 'ANC', 'ARN', 'ATH', 'ATL', 'AUA', 'AUH', 'AUS', 'AYT', 'BAH', 'BCN', 'BDS', 'BEG', 'BER', 'BEY', 'BFS', 'BGO', 'BGW', 'BGY', 'BHX', 'BJV', 'BJX', 'BKK', 'BLL', 'BLQ', 'BLR', 'BNA', 'BNE', 'BOD', 'BOG', 'BOJ', 'BOM', 'BOS', 'BRI', 'BRU', 'BSB', 'BSL', 'BUD', 'BUF', 'BWI', 'BWN', 'BZE', 'CAG', 'CAI', 'CAN', 'CCS', 'CCU', 'CDG', 'CEB', 'CGK', 'CGN', 'CGO', 'CGQ', 'CKG', 'CLE', 'CLT', 'CMB', 'CMH', 'CMN', 'CNF', 'COK', 'CPH', 'CPT', 'CSX', 'CTA', 'CTS', 'CTU', 'CUN', 'CUR', 'CVG', 'DAC', 'DAR', 'DCA', 'DEL', 'DEN', 'DFW', 'DLC', 'DLM', 'DME', 'DMK', 'DMM', 'DOH', 'DPS', 'DSS', 'DTW', 'DUB', 'DUS', 'DXB', 'EBB', 'EDI', 'EIN', 'ESB', 'EVN', 'EWR', 'EZE', 'FAO', 'FCO', 'FLL', 'FNC', 'FOC', 'FRA', 'FRU', 'FUE', 'FUK', 'GCM', 'GDL', 'GDN', 'GIG', 'GLA', 'GOI', 'GOT', 'GRU', 'GUA', 'GVA', 'GYD', 'GYE', 'HAJ', 'HAK', 'HAM', 'HAN', 'HAV', 'HEL', 'HER', 'HET', 'HGH', 'HKG', 'HKT', 'HMO', 'HND', 'HNL', 'HRB', 'HRG', 'HYD', 'IAD', 'IAH', 'IBZ', 'ICN', 'IKA', 'IND', 'ISB', 'IST', 'JAX', 'JED', 'JFK', 'JNB', 'KEF', 'KGL', 'KHH', 'KHI', 'KHN', 'KIN', 'KIX', 'KMG', 'KRK', 'KRT', 'KTM', 'KUF', 'KUL', 'KWE', 'KWI', 'KWL', 'KZN', 'LAD', 'LAS', 'LAX', 'LCA', 'LED', 'LEJ', 'LGA', 'LGW', 'LHE', 'LHR', 'LHW', 'LIM', 'LIR', 'LIS', 'LJU', 'LOS', 'LPA', 'LTN', 'LUX', 'LYS', 'MAA', 'MAD', 'MAN', 'MBA', 'MCI', 'MCO', 'MCT', 'MDW', 'MED', 'MEL', 'MEM', 'MEX', 'MFM', 'MIA', 'MKE', 'MLA', 'MLE', 'MNL', 'MRS', 'MRU', 'MSP', 'MSQ', 'MSY', 'MTY', 'MUC', 'MXP', 'MZT', 'NAP', 'NAS', 'NBO', 'NCE', 'NGB', 'NGO', 'NKG', 'NNG', 'NQZ', 'NRT', 'NUE', 'OAK', 'OMA', 'ONT', 'OPO', 'ORD', 'ORY', 'OSL', 'OTP', 'OVB', 'PAP', 'PBI', 'PDX', 'PEK', 'PER', 'PHL', 'PHX', 'PIT', 'PKX', 'PLS', 'PMI', 'PMO', 'PNH', 'PRG', 'PSA', 'PTY', 'PUJ', 'PUS', 'PVD', 'PVG', 'PVR', 'PWM', 'RDU', 'RGN', 'RIC', 'RIX', 'RNO', 'ROV', 'RSW', 'RUH', 'SAL', 'SAN', 'SAT', 'SAV', 'SAW', 'SCL', 'SCQ', 'SDF', 'SDQ', 'SEA', 'SEZ', 'SFB', 'SFO', 'SGN', 'SHA', 'SHE', 'SHJ', 'SID', 'SIN', 'SJC', 'SJD', 'SJU', 'SKG', 'SKP', 'SLC', 'SMF', 'SNA', 'SOF', 'SSH', 'STL', 'STN', 'STR', 'SVG', 'SVO', 'SVX', 'SXM', 'SYD', 'SYR', 'SYX', 'SZX', 'TAO', 'TAS', 'TBS', 'TFS', 'TFU', 'TGD', 'TIA', 'TIJ', 'TLL', 'TLS', 'TLV', 'TNA', 'TOS', 'TPA', 'TPE', 'TRD', 'TRN', 'TRV', 'TSN', 'TUL', 'TUN', 'TYN', 'UFA', 'UIO', 'URC', 'VAR', 'VCE', 'VIE', 'VKO', 'VNO', 'VRN', 'WAW', 'WNZ', 'WUH', 'XIY', 'XMN', 'YEG', 'YHZ', 'YNT', 'YOW', 'YUL', 'YVR', 'YWG', 'YYC', 'YYZ', 'ZAG', 'ZIA', 'ZNZ', 'ZRH']

def handle_errors(f):
    """Decorator to handle errors and prevent crashes"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logging.error(f"Error in {f.__name__}: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"message": "An unexpected error occurred"}), 500
    return wrapper

def ensure_directories():
    """Ensure all required directories exist"""
    directories = [DATA_DIR, DC_DATA_DIR, TRIVIA_JSON_DIR]
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            logging.info(f"Created directory: {directory}")

def load_datas():
    """Load game data with error handling"""
    try:
        gamesList.clear()
        if not os.path.exists(DATA_DIR):
            ensure_directories()
            return

        gamesJsonList = os.listdir(DATA_DIR)
        gamesJsonList.sort()

        for gameJson in gamesJsonList:
            try:
                with open(f"{DATA_DIR}{gameJson}", "r") as f:
                    data = json.load(f)
                    gamesList.append(Game.from_dict(data))
            except Exception as e:
                logging.error(f"Error loading game {gameJson}: {str(e)}")
                continue

        logging.warning(f"Loaded {len(gamesList)} Games")
    except Exception as e:
        logging.error(f"Error in load_datas: {str(e)}")
        gamesList.clear()

def save_datas():
    """Save game data with error handling"""
    try:
        for game in gamesList:
            try:
                with open(f"{DATA_DIR}{game.gameId:07d}.json", "w") as f:
                    json.dump(game.to_dict(), f, indent=4)
            except Exception as e:
                logging.error(f"Error saving game {game.gameId}: {str(e)}")
    except Exception as e:
        logging.error(f"Error in save_datas: {str(e)}")

# home page stuff
@app.route("/api/get_dc", methods=["GET"])
@handle_errors
def get_dc():
    timeNow = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    JSONDIR = f"{DC_DATA_DIR}{timeNow}.json"
    if os.path.isfile(JSONDIR):
        return send_file(JSONDIR)
    else:
        logging.warning("Missing today's daily challenge!!!")
        return jsonify({"message": "Can't find today's daily challenge! Notify the dev!"}), 400

@app.route("/api/get_game_meta/<int:game_id>", methods=["GET"])
@handle_errors
def get_game_meta(game_id):
    if game_id <= 0 or game_id > len(gamesList):
        return jsonify({"message": "Game not found"}), 404
        
    try:
        orgIata = gamesList[game_id - 1].orgIata
        startingTime = gamesList[game_id - 1].startingTime

        return jsonify({
            "orgIata": orgIata,
            "startingTime": startingTime
        }), 200
    except Exception as e:
        logging.error(f"Error getting game meta for game {game_id}: {str(e)}")
        return jsonify({"message": "Error retrieving game metadata"}), 500

@app.route("/api/validate_username/<int:game_id>/<username>")
@handle_errors
def validate_username(game_id, username):
    try:
        # Validate game_id
        if game_id <= 0 or game_id > len(gamesList):
            return jsonify({"result": False}), 200

        # Sanitize and validate username
        username = sanitize_input(username)
        
        # Username validation rules
        if not username:
            return jsonify({"result": False}), 200
            
        # Check username length (adjust max length as needed)
        if len(username) > 20:
            return jsonify({"result": False}), 200
            
        # # Check for valid characters (alphanumeric, underscore, hyphen)
        # if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        #     return jsonify({"result": False}), 200

        # Check for existing username
        playerStats = gamesList[game_id - 1].playerStats
        for playerstat in playerStats:
            if playerstat.username == username:
                return jsonify({"result": False}), 200
                
        return jsonify({"result": True}), 200
        
    except Exception as e:
        logging.error(f"Error validating username for game {game_id}: {str(e)}")
        return jsonify({"result": False}), 200

# post game stuff
@app.route("/api/get_game_data", methods=["GET"])
@handle_errors
def get_game_data():
    try:
        gameId = int(request.args.get('gameId'))
        if gameId <= 0 or gameId > len(gamesList):
            return jsonify({"message": "Game not found"}), 404
            
        file_path = f"{DATA_DIR}{gameId:07d}.json"
        if not os.path.exists(file_path):
            return jsonify({"message": "Game data file not found"}), 404
            
        return send_file(file_path)
    except ValueError:
        return jsonify({"message": "Invalid game ID format"}), 400
    except Exception as e:
        logging.error(f"Error getting game data: {str(e)}")
        return jsonify({"message": "Error retrieving game data"}), 500

def new_playerStat(gameId, username, timeUsed, moneyUsed, distanceCovered, legsCount, route):
    """Create new player stat with error handling"""
    try:
        uniqueId = len(gamesList[gameId - 1].playerStats)
        newPlayerStat = PlayerStat(uniqueId, username, timeUsed, moneyUsed, distanceCovered, legsCount, route)
        gamesList[gameId - 1].playerStats.append(newPlayerStat)
        save_datas()
        logging.info("New Player Stat!")
        return uniqueId
    except Exception as e:
        logging.error(f"Error creating new player stat: {str(e)}")
        raise

def sanitize_input(text):
    # Sanitize input to prevent XSS and injection attacks
    if not isinstance(text, str):
        return str(text)
    return html.escape(text.strip())

@app.route("/api/post_player_stat", methods=["POST"])
@handle_errors
def post_player_stat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"message": "No data provided"}), 400

        # Validate required fields
        required_fields = ["gameId", "username", "timeUsed", "moneyUsed", "distanceCovered", "legsCount", "route"]
        if not all(field in data for field in required_fields):
            return jsonify({"message": "Missing required fields"}), 400

        # Sanitize and validate inputs
        gameId = int(data.get("gameId"))
        username = sanitize_input(data.get("username"))
        timeUsed = int(data.get("timeUsed"))
        moneyUsed = int(data.get("moneyUsed"))
        distanceCovered = int(data.get("distanceCovered"))
        legsCount = int(data.get("legsCount"))
        route = data.get("route")

        # Validate game ID
        if gameId <= 0 or gameId > len(gamesList):
            return jsonify({"message": "Invalid game ID"}), 400

        # Validate username
        if not username or len(username) > 20:
            return jsonify({"message": "Invalid username"}), 400

        # Validate numeric values
        if timeUsed < 10000 or moneyUsed < 100 or legsCount < 2:
            return jsonify({"message": "No Cheating!"}), 400

        # Validate route structure
        if len(route) < 3:
            return jsonify({"message": "Invalid route data"}), 400

        uniqueId = new_playerStat(gameId, username, timeUsed, moneyUsed, distanceCovered, legsCount, route)

    except ValueError:
        return jsonify({"message": "Invalid numeric values"}), 400
    except Exception as e:
        logging.error(f"Error in post_player_stat: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500
    
    return jsonify({
        "message": "POST Data Success!",
        "uniqueId": uniqueId
    }), 200

# trivias
triviaList = []
categoryDict = {}

def load_trivia_json():
    """Load trivia data with error handling"""
    try:
        triviaList.clear()
        categoryDict.clear()

        if not os.path.exists(TRIVIA_JSON_DIR):
            ensure_directories()
            return

        json_dirs = os.listdir(TRIVIA_JSON_DIR)
        index = 0
        for json_dir in json_dirs:
            try:
                category = json_dir[:-5]
                questionList = []
                skippedCnt = 0
                with open(f"{TRIVIA_JSON_DIR}{json_dir}", "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for questionData in data:
                        try:
                            questionList.append(TriviaQuestion.from_dict(questionData))
                        except Exception as e:
                            logging.error(f"Error loading trivia question: {str(e)}")
                            skippedCnt += 1
                
                triviaList.append(questionList)
                categoryDict[category] = index
                index += 1
                logging.info(f"Loaded {category}: {len(questionList)} trivia questions, skipped {skippedCnt}")
            except Exception as e:
                logging.error(f"Error loading trivia category {json_dir}: {str(e)}")
                continue
        
        logging.warning(f"trivia loaded, {len(triviaList)} categories")
    except Exception as e:
        logging.error(f"Error in load_trivia_json: {str(e)}")
        triviaList.clear()
        categoryDict.clear()

@app.route("/api/get_trivia/random", methods=["GET"])
@handle_errors
def get_random_trivia():
    if not triviaList:
        return jsonify({"message": "No trivia questions available"}), 404
        
    try:
        categoryIndex = random.randint(0, len(triviaList)-1)
        question = random.choice(triviaList[categoryIndex])
        return jsonify(question.to_dict()), 200
    except Exception as e:
        logging.error(f"Error getting random trivia: {str(e)}")
        return jsonify({"message": "Error retrieving trivia question"}), 500

@app.route("/api/get_trivia/<string:category>", methods=["GET"])
@handle_errors
def get_trivia(category):
    if not triviaList:
        return jsonify({"message": "No trivia questions available"}), 404
        
    try:
        if category not in categoryDict:
            return get_random_trivia()
        question = random.choice(triviaList[categoryDict[category]])
        return jsonify(question.to_dict()), 200
    except Exception as e:
        logging.error(f"Error getting trivia for category {category}: {str(e)}")
        return jsonify({"message": "Error retrieving trivia question"}), 500


@app.route("/api/get_flight", methods=["GET"])
def get_flight():
    org = (request.args.get("org") or "").upper()
    dest = (request.args.get("dest") or "").upper()
    date = request.args.get("date")

    # -----------------------------
    # Validate input parameters
    # -----------------------------
    if not org or not dest or not date:
        return jsonify({"message": "Missing required parameters: org, dest, date"}), 400

    if not re.match(r"^[A-Z]{3}$", org) or not re.match(r"^[A-Z]{3}$", dest):
        return jsonify({"message": "org/dest must be valid 3-letter IATA codes"}), 400

    # must exist in IATA dictionary
    if org not in IATA_codes or dest not in IATA_codes:
        return jsonify({"message": f"Invalid IATA code(s): {org}, {dest}"}), 400

    # validate date format and must be in the future
    try:
        flight_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"message": "date must be in YYYY-MM-DD format"}), 400

    today = datetime.utcnow().date()
    if flight_date <= today:
        return jsonify({"message": "Flight date must be in the future"}), 400

    # -----------------------------
    # Forward request to scraper
    # -----------------------------
    payload = {"org": org, "dest": dest, "date": date}

    try:
        resp = requests.post(f"{SCRAPER_URL}/scrape", json=payload, timeout=10)
    except requests.Timeout:
        logging.warning("Scraper service timed out on POST /scrape")
        return jsonify({"message": "Scraper service timed out"}), 504
    except requests.RequestException as e:
        logging.error(f"Error contacting scraper service: {e}")
        return jsonify({"message": "Error contacting scraper service"}), 502

    # -----------------------------
    # Handle scraper responses
    # -----------------------------
    if resp.status_code == 202:
        # queued for async scraping
        try:
            body = resp.json()
        except Exception:
            body = {"message": "Scraper accepted job"}
        # Ensure the job status URL is absolute (helpful for frontend polling)
        if "job_id" in body and "status_url" not in body:
            body["status_url"] = f"/api/flight_status/{body['job_id']}"
        return jsonify(body), 202

    elif resp.status_code == 200:
        try:
            data = resp.json()
        except Exception:
            data = None

        if isinstance(data, dict) and data.get("file"):
            file_path = data["file"]
            if os.path.isfile(file_path):
                return send_file(file_path)
            else:
                logging.error(f"Scraper returned missing file path: {file_path}")
                return jsonify({"message": "Scraper returned invalid file path"}), 500

        if data is not None:
            return jsonify(data), 200

        return resp.text, 200

    else:
        logging.error(f"Scraper returned unexpected status {resp.status_code}: {resp.text}")
        return jsonify({"message": "Scraper error", "details": resp.text}), 500

@app.route("/api/flight_status/<job_id>", methods=["GET"])
def flight_status(job_id):
    """
    Proxy endpoint for the frontend to check scraper job status.
    Forwards the request to the scraper microservice.
    """
    try:
        resp = requests.get(f"{SCRAPER_URL}/status/{job_id}", timeout=5)
        # Forward the status code and JSON body directly
        try:
            data = resp.json()
        except Exception:
            data = {"message": "Invalid response from scraper"}

        return jsonify(data), resp.status_code
    except requests.Timeout:
        return jsonify({"message": "Scraper service timed out"}), 504
    except requests.RequestException as e:
        return jsonify({"message": f"Error contacting scraper service: {str(e)}"}), 502

# TODO: add delete game, dc, get dc
# admin

@app.route("/game")
def game_html():
    return send_file("make_game.html")

@app.route("/dc")
def dc_html():
    return send_file("make_dc.html")

def secure_compare(a, b):
    """Compare two strings in a way that prevents timing attacks"""
    if not isinstance(a, str) or not isinstance(b, str):
        return False
    return secrets.compare_digest(a, b)

def ensure_directories():
    """Ensure all required directories exist"""
    directories = [DATA_DIR, DC_DATA_DIR, TRIVIA_JSON_DIR]
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            logging.info(f"Created directory: {directory}")

def notify_app_reload_data():
    """Notify app.py to reload its data"""
    try:
        app_url = os.getenv('APP_URL', 'http://127.0.0.1:5000')
        auth_token = os.getenv('INTERNAL_AUTH_TOKEN', 'default_internal_token')
        
        response = requests.post(
            f"{app_url}/api/reload_data",
            headers={'X-Auth-Token': auth_token},
            timeout=5
        )
        
        if response.status_code == 200:
            logging.info("Successfully notified app.py to reload data")
        else:
            logging.warning(f"Failed to notify app.py: {response.status_code} - {response.text}")
            
    except Exception as e:
        logging.error(f"Error notifying app.py to reload data: {str(e)}")


@app.route("/admin/make_game", methods=["POST"])
def make_game():
    admin_pw = os.getenv('ADMIN_PASSWORD')
    data = request.get_json()
    
    if not data:
        return jsonify({"message": "No data provided"}), 400

    password = data.get("password")
    if not password or not secure_compare(password, admin_pw):
        return jsonify({"message": "Password incorrect!"}), 401

    try:
        orgIata = sanitize_input(data.get("orgIata"))
        startingTime = sanitize_input(data.get("startingTime"))
        
        if not orgIata or not startingTime:
            return jsonify({"message": "Missing required fields"}), 400
        
        iataRe = r'^[a-zA-Z]{3}$'
        timeRe = r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$'
        
        if not re.match(iataRe, orgIata):
            return jsonify({"message": "orgIata doesn't match the format!"}), 400
        if not re.match(timeRe, startingTime):
            return jsonify({"message": "startingTime doesn't match the format!"}), 400
        
        gamesJsonList = os.listdir(DATA_DIR)
        gameId = len(gamesJsonList) + 1
        newGame = Game(gameId, orgIata, startingTime, [])

        JSONDIR = f"{DATA_DIR}{gameId:07d}.json"
        with open(JSONDIR, "w") as f:
            json.dump(newGame.to_dict(), f, indent=4)

        load_datas()

        logging.warning(f"New Game! Game id: {gameId}")
        return send_file(JSONDIR)
    
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/admin/make_dc", methods=["POST"])
def make_dc():
    admin_pw = os.getenv('ADMIN_PASSWORD')
    data = request.get_json()
    
    if not data:
        return jsonify({"message": "No data provided"}), 400

    password = data.get("password")
    if not password or not secure_compare(password, admin_pw):
        return jsonify({"message": "Password incorrect!"}), 401

    try:
        dc_date = sanitize_input(data.get("dc_date"))
        gameId = int(data.get("gameId"))

        if not dc_date or not gameId:
            return jsonify({"message": "Missing required fields"}), 400

        if gameId <= 0 or gameId > len(os.listdir(DATA_DIR)):
            return jsonify({"message": "Game ID incorrect!"}), 400
        
        dateRe = r'^\d{4}-\d{2}-\d{2}$'
        if not re.match(dateRe, dc_date):
            return jsonify({"message": "dc_date doesn't match the format!"}), 400
        
        JSONDIR = f"{DC_DATA_DIR}{dc_date}.json"
        if os.path.isfile(JSONDIR):
            return jsonify({"message": "dc_date already exists!"}), 400

        startTimestamp = datetime.strptime(dc_date, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp()
        with open(JSONDIR, "w") as f:
            json.dump({
                "date": dc_date,
                "startTime": int(startTimestamp) * 1000,
                "endTime": (int(startTimestamp) + 86400) * 1000,
                "gameId": gameId
            }, f, indent=4)

        notify_app_reload_data()  # Notify app.py to reload data
        
        logging.warning(f"New DC! DATE:{dc_date} Game id: {gameId}")
        return send_file(JSONDIR)
    
    except ValueError:
        return jsonify({"message": "Invalid game ID format"}), 400
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@app.route("/admin/ls/root")
def ls_root():
    ls = os.listdir()
    return jsonify(ls), 200

@app.route("/admin/ls/<path:path>")
def ls_files(path):
    try:
        ls = os.listdir(path)
    except:
        return jsonify({"message": "Path Not Found!"}), 400
    return jsonify(ls), 200

@app.route("/admin/<password>/get/<path:path>")
def get_files(path, password):
    admin_pw = os.getenv('ADMIN_PASSWORD')
    if password != admin_pw:
        return jsonify({"message": "Password incorrect!"}), 400
    
    try:
        return send_from_directory('', path)
    except:
        return jsonify({"message": "Path Not Found!"}), 400

@app.route('/health')
def health():
    return jsonify(status="healthy"), 200

# Cache for games list
games_list_cache = {
    "data": None,
    "last_update": None
}

@app.route("/api/get_games_list")
def get_games_list():
    try:
        current_time = datetime.now(timezone.utc)
        current_date = current_time.strftime('%Y-%m-%d')
        
        # Check if cache is valid (same day)
        if (games_list_cache["last_update"] and 
            games_list_cache["last_update"].strftime('%Y-%m-%d') == current_date):
            return jsonify(games_list_cache["data"]), 200
        
        # Get list of daily challenge files
        dc_files = os.listdir(DC_DATA_DIR)
        dc_files.sort(reverse=True)  # Sort by date, newest first
        
        week_ago = current_time - timedelta(days=7)
        
        games_data = []
        # Add game ID 1 as the first entry
        if len(gamesList) > 0:
            game = gamesList[0]  # First game in gamesList
            games_data.append({
                "gameId": 1,
                "orgIata": game.orgIata,
                "startingTime": game.startingTime,
                "date": "Tutorial"
            })
        
        for dc_file in dc_files:
            # Skip current and future day's challenge
            if dc_file >= current_date + '.json':
                continue
                
            # Stop if we've gone past a week
            file_date = datetime.strptime(dc_file[:-5], '%Y-%m-%d').replace(tzinfo=timezone.utc)
            if file_date < week_ago:
                break
                
            # Read the daily challenge file
            with open(f"{DC_DATA_DIR}{dc_file}", "r") as f:
                dc_data = json.load(f)
                game_id = dc_data.get("gameId")
                
                # Get game data from gamesList
                if game_id and game_id <= len(gamesList):
                    game = gamesList[game_id - 1]
                    games_data.append({
                        "gameId": game.gameId,
                        "orgIata": game.orgIata,
                        "startingTime": game.startingTime,
                        "date": dc_file[:-5]  # Remove .json extension
                    })
        
        # Update cache
        games_list_cache["data"] = games_data
        games_list_cache["last_update"] = current_time
        
        return jsonify(games_data), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

# Initialize the application
ensure_directories()
load_datas()
load_trivia_json()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port='5050')