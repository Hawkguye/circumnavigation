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

gamesList = []

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

# flight scraper
@app.route("/api/get_flight", methods=["GET"])
@handle_errors
def get_flight():
    try:
        org = request.args.get('org')
        dest = request.args.get('dest')
        date = request.args.get('date')

        if not org or not dest or not date:
            return jsonify({"message": "params missing!"}), 400
            
        iataRe = re.compile(r'^[a-zA-Z]{3}$')
        dateRe = re.compile(r'^\d{4}-\d{2}-\d{2}$')
        
        if not iataRe.match(org) or not iataRe.match(dest):
            return jsonify({"message": "org or dest param doesn't match the format!"}), 400
        if not dateRe.match(date):
            return jsonify({"message": "date param doesn't match the format!"}), 400

        datajson = scraper.main(org, dest, date)
        
        if "error" in datajson:
            return jsonify({"message": f"failed to fetch flight data! {datajson}"}), 400
        
        return send_file(datajson)
    
    except Exception as e:
        logging.error(f"get flight error! {str(e)}")
        return jsonify({"message": "Error retrieving flight data"}), 500

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