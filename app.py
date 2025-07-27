from flask import Flask, request, jsonify, send_file, render_template, url_for, redirect, send_from_directory
from flask_cors import CORS
# from flask_sqlalchemy import SQLAlchemy
import json
import os
import re
from datetime import datetime, timezone
import html
import traceback
from functools import wraps
import logging

from modals import Game

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# app.config['DEBUG'] = os.getenv('FLASK_DEBUG')

DATA_DIR = "data/game/"
DC_DATA_DIR = "data/daily_challenge/"
TRIVIA_JSON_DIR = "data/trivia/"

gamesList = []

def handle_errors(f):
    """Decorator to handle errors and prevent crashes"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logging.error(f"Error in {f.__name__}: {str(e)}\n{traceback.format_exc()}")
            return "An unexpected error occurred", 500
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

def sanitize_input(text):
    """Sanitize input to prevent XSS and injection attacks"""
    if not isinstance(text, str):
        return str(text)
    return html.escape(text.strip())

@app.route("/")
@handle_errors
def main_menu():
    api_url = os.getenv('API_URL', 'http://127.0.0.1:5050/api/')
    return render_template('home.html', api_url=api_url)

@app.route("/tutorial")
@handle_errors
def tutorial():
    api_url = os.getenv('API_URL', 'http://127.0.0.1:5050/api/')
    flight_url = os.getenv('FLIGHT_URL', 'http://127.0.0.1:5050/api/')
    return render_template('tutorial.html', api_url=api_url, flight_url=flight_url)

@app.route("/leaderboard/<int:game_id>")
@handle_errors
def leaderboard_html(game_id):
    if game_id <= 0 or game_id > len(gamesList):
        return "Game not found", 404
    return render_template('leaderboard.html', 
                         game_id=game_id,
                         api_url=os.getenv('API_URL', 'http://127.0.0.1:5050/api/'))

@app.route("/game/<int:game_id>")
@handle_errors
def game(game_id):
    if game_id <= 0 or game_id > len(gamesList):
        return "Game not found", 404
        
    try:
        api_url = os.getenv('API_URL', 'http://127.0.0.1:5050/api/')
        flight_url = os.getenv('FLIGHT_URL', 'http://127.0.0.1:5050/api/')

        orgIata = gamesList[game_id - 1].orgIata
        startingTime = gamesList[game_id - 1].startingTime

        return render_template('game.html', 
                             api_url=api_url, 
                             flight_url=flight_url, 
                             game_id=game_id, 
                             starting_iata=orgIata, 
                             starting_time=startingTime)
    except Exception as e:
        logging.error(f"Error loading game {game_id}: {str(e)}")
        return "Error loading game", 500

# ICAO codes list
ICAO_codes = ['ACC', 'ACE', 'ADB', 'ADD', 'ADL', 'AER', 'AGP', 'AKL', 'ALA', 'ALC', 'ALG', 'AMM', 'AMS', 'ANC', 'ARN', 'ATH', 'ATL', 'AUA', 'AUH', 'AUS', 'AYT', 'BAH', 'BCN', 'BDS', 'BEG', 'BER', 'BEY', 'BFS', 'BGO', 'BGW', 'BGY', 'BHX', 'BJV', 'BJX', 'BKK', 'BLL', 'BLQ', 'BLR', 'BNA', 'BNE', 'BOD', 'BOG', 'BOJ', 'BOM', 'BOS', 'BRI', 'BRU', 'BSB', 'BSL', 'BUD', 'BUF', 'BWI', 'BWN', 'BZE', 'CAG', 'CAI', 'CAN', 'CCS', 'CCU', 'CDG', 'CEB', 'CGK', 'CGN', 'CGO', 'CGQ', 'CKG', 'CLE', 'CLT', 'CMB', 'CMH', 'CMN', 'CNF', 'COK', 'CPH', 'CPT', 'CSX', 'CTA', 'CTS', 'CTU', 'CUN', 'CUR', 'CVG', 'DAC', 'DAR', 'DCA', 'DEL', 'DEN', 'DFW', 'DLC', 'DLM', 'DME', 'DMK', 'DMM', 'DOH', 'DPS', 'DSS', 'DTW', 'DUB', 'DUS', 'DXB', 'EBB', 'EDI', 'EIN', 'ESB', 'EVN', 'EWR', 'EZE', 'FAO', 'FCO', 'FLL', 'FNC', 'FOC', 'FRA', 'FRU', 'FUE', 'FUK', 'GCM', 'GDL', 'GDN', 'GIG', 'GLA', 'GOI', 'GOT', 'GRU', 'GUA', 'GVA', 'GYD', 'GYE', 'HAJ', 'HAK', 'HAM', 'HAN', 'HAV', 'HEL', 'HER', 'HET', 'HGH', 'HKG', 'HKT', 'HMO', 'HND', 'HNL', 'HRB', 'HRG', 'HYD', 'IAD', 'IAH', 'IBZ', 'ICN', 'IKA', 'IND', 'ISB', 'IST', 'JAX', 'JED', 'JFK', 'JNB', 'KEF', 'KGL', 'KHH', 'KHI', 'KHN', 'KIN', 'KIX', 'KMG', 'KRK', 'KRT', 'KTM', 'KUF', 'KUL', 'KWE', 'KWI', 'KWL', 'KZN', 'LAD', 'LAS', 'LAX', 'LCA', 'LED', 'LEJ', 'LGA', 'LGW', 'LHE', 'LHR', 'LHW', 'LIM', 'LIR', 'LIS', 'LJU', 'LOS', 'LPA', 'LTN', 'LUX', 'LYS', 'MAA', 'MAD', 'MAN', 'MBA', 'MCI', 'MCO', 'MCT', 'MDW', 'MED', 'MEL', 'MEM', 'MEX', 'MFM', 'MIA', 'MKE', 'MLA', 'MLE', 'MNL', 'MRS', 'MRU', 'MSP', 'MSQ', 'MSY', 'MTY', 'MUC', 'MXP', 'MZT', 'NAP', 'NAS', 'NBO', 'NCE', 'NGB', 'NGO', 'NKG', 'NNG', 'NQZ', 'NRT', 'NUE', 'OAK', 'OMA', 'ONT', 'OPO', 'ORD', 'ORY', 'OSL', 'OTP', 'OVB', 'PAP', 'PBI', 'PDX', 'PEK', 'PER', 'PHL', 'PHX', 'PIT', 'PKX', 'PLS', 'PMI', 'PMO', 'PNH', 'PRG', 'PSA', 'PTY', 'PUJ', 'PUS', 'PVD', 'PVG', 'PVR', 'PWM', 'RDU', 'RGN', 'RIC', 'RIX', 'RNO', 'ROV', 'RSW', 'RUH', 'SAL', 'SAN', 'SAT', 'SAV', 'SAW', 'SCL', 'SCQ', 'SDF', 'SDQ', 'SEA', 'SEZ', 'SFB', 'SFO', 'SGN', 'SHA', 'SHE', 'SHJ', 'SID', 'SIN', 'SJC', 'SJD', 'SJU', 'SKG', 'SKP', 'SLC', 'SMF', 'SNA', 'SOF', 'SSH', 'STL', 'STN', 'STR', 'SVG', 'SVO', 'SVX', 'SXM', 'SYD', 'SYR', 'SYX', 'SZX', 'TAO', 'TAS', 'TBS', 'TFS', 'TFU', 'TGD', 'TIA', 'TIJ', 'TLL', 'TLS', 'TLV', 'TNA', 'TOS', 'TPA', 'TPE', 'TRD', 'TRN', 'TRV', 'TSN', 'TUL', 'TUN', 'TYN', 'UFA', 'UIO', 'URC', 'VAR', 'VCE', 'VIE', 'VKO', 'VNO', 'VRN', 'WAW', 'WNZ', 'WUH', 'XIY', 'XMN', 'YEG', 'YHZ', 'YNT', 'YOW', 'YUL', 'YVR', 'YWG', 'YYC', 'YYZ', 'ZAG', 'ZIA', 'ZNZ', 'ZRH']

@app.route("/freegame")
@handle_errors
def freegame():
    try:
        api_url = os.getenv('API_URL', 'http://127.0.0.1:5050/api/')
        flight_url = os.getenv('FLIGHT_URL', 'http://127.0.0.1:5050/api/')

        org = request.args.get('org')
        date = request.args.get('date')
        
        if not org or not date:
            return jsonify({"message": "params missing! org: IATA code, date: YYYY-MM-DDThh:mm:ssZ"}), 400

        # Sanitize inputs
        org = sanitize_input(org)
        date = sanitize_input(date)

        if org not in ICAO_codes:
            return jsonify({"message": "ICAO code not valid! (no such airport)"}), 400
        
        dateRe = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$')
        if not dateRe.match(date):
            return jsonify({"message": "date param doesn't match the format! (YYYY-MM-DDThh:mm:ssZ)"}), 400

        try:
            input_date = datetime.strptime(date, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
            current_time = datetime.now(timezone.utc)
            
            if input_date < current_time:
                return jsonify({"message": "date param is prior to the current time!"}), 400
        except ValueError:
            return jsonify({"message": "Invalid date format!"}), 400
        
        return render_template('game.html', 
                             api_url=api_url, 
                             flight_url=flight_url, 
                             game_id=0, 
                             starting_iata=org, 
                             starting_time=date)
    except Exception as e:
        logging.error(f"Error in freegame: {str(e)}")
        return "Error loading free game", 500

@app.route("/minigames/<path:path>")
@handle_errors
def minigames(path):
    try:
        # Sanitize path to prevent directory traversal
        safe_path = os.path.normpath(path).lstrip('/')
        if safe_path.startswith('..') or safe_path.startswith('/'):
            return "Invalid path", 400
            
        return send_from_directory('minigames', safe_path)
    except FileNotFoundError:
        return "Path not found", 404
    except Exception as e:
        logging.error(f"Error serving minigame {path}: {str(e)}")
        return "Error loading minigame", 500

@app.route("/about")
@handle_errors
def about():
    return render_template('about.html')

@app.route("/favicon.ico")
@handle_errors
def favicon():
    try:
        return send_file("favicon.ico")
    except FileNotFoundError:
        return "Favicon not found", 404
    except Exception as e:
        logging.error(f"Error serving favicon: {str(e)}")
        return "Error loading favicon", 500

@app.route('/health')
@handle_errors
def health():
    return jsonify(status="healthy"), 200

@app.route('/api/reload_data', methods=['POST'])
@handle_errors
def reload_data():
    """Endpoint to trigger load_datas() from external services"""
    try:
        # Verify the request is from the API service
        auth_token = request.headers.get('X-Auth-Token')
        expected_token = os.getenv('INTERNAL_AUTH_TOKEN', 'default_internal_token')
        
        if not auth_token or auth_token != expected_token:
            return jsonify({"message": "Unauthorized"}), 401
        
        # Reload the data
        load_datas()
        logging.info("Data reloaded successfully via API call")
        return jsonify({"message": "Data reloaded successfully"}), 200
    except Exception as e:
        logging.error(f"Error reloading data: {str(e)}")
        return jsonify({"message": "Error reloading data"}), 500

# Initialize the application
ensure_directories()
load_datas()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port='5000')