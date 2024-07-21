from flask import Flask, request, jsonify, send_file, render_template, url_for, redirect, send_from_directory
from flask_cors import CORS
# from flask_sqlalchemy import SQLAlchemy
import json
import os
import random
import re
from datetime import datetime, timezone

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

# first things first
def save_datas():
    for game in gamesList:
        with open(f"{DATA_DIR}{game.gameId:07d}.json", "w") as f:
            json.dump(game.to_dict(), f, indent=4)

def load_datas():
    gamesList.clear()
    gamesJsonList = os.listdir(DATA_DIR)
    gamesJsonList.sort()

    for gameJson in gamesJsonList:
        with open(f"{DATA_DIR}{gameJson}", "r") as f:
            data = json.load(f)
            gamesList.append(Game.from_dict(data))

    logging.warning(f"Loaded {len(gamesList)} Games")


# home page stuff
@app.route("/api/get_dc", methods=["GET"])
def get_dc():
    timeNow = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    JSONDIR = f"{DC_DATA_DIR}{timeNow}.json"
    if os.path.isfile(JSONDIR):
        return send_file(JSONDIR)
    else:
        logging.warning("Missing today's daily challenge!!!")
        return jsonify({"message": "Can't find today's daily challenge!"}), 400

@app.route("/api/get_game_meta/<int:game_id>", methods=["GET"])
def get_game_meta(game_id):
    orgIata = gamesList[game_id - 1].orgIata
    startingTime = gamesList[game_id - 1].startingTime

    return jsonify({
        "orgIata": orgIata,
        "startingTime": startingTime
    }), 200



# pre game
@app.route("/api/validate_username/<int:game_id>/<username>")
def validate_username(game_id, username):
    try:
        playerStats = gamesList[game_id - 1].playerStats
        for playerstat in playerStats:
            if playerstat.username == username:
                return jsonify({"result": False}), 200
    except:
        return jsonify({"result": False}), 200
    return jsonify({"result": True}), 200



# post game stuff
@app.route("/api/get_game_data", methods=["GET"])
def get_game_data():
    gameId = int(request.args.get('gameId'))

    return send_file(f"{DATA_DIR}{gameId:07d}.json")



def new_playerStat(gameId, username, timeUsed, moneyUsed, distanceCovered, legsCount, route):
    uniqueId = len(gamesList[gameId - 1].playerStats)

    newPlayerStat = PlayerStat(uniqueId, username, timeUsed, moneyUsed, distanceCovered, legsCount, route)
    gamesList[gameId - 1].playerStats.append(newPlayerStat)

    save_datas()
    logging.info("New Player Stat!")

    return uniqueId

@app.route("/api/post_player_stat", methods=["POST"])
def post_player_stat():
    try:
        data = request.get_json()
        gameId = data.get("gameId")
        username = data.get("username")
        timeUsed = data.get("timeUsed")
        moneyUsed = data.get("moneyUsed")
        distanceCovered = data.get("distanceCovered")
        legsCount = data.get("legsCount")
        route = data.get("route")

        if timeUsed < 10000 or moneyUsed < 100 or legsCount < 2 or len(route) < 3:
            return jsonify({"message": "No Cheating!"}), 200

        uniqueId = new_playerStat(gameId, username, timeUsed, moneyUsed, distanceCovered, legsCount, route)

    except Exception as e:
        return jsonify({"message": str(e)}), 400
    
    return jsonify({
        "message": "POST Data Success!",
        "uniqueId": uniqueId
    }), 200



# trivias
triviaList = []
categoryDict = {}

def load_trivia_json():
    triviaList.clear()
    categoryDict.clear()

    json_dirs = os.listdir(TRIVIA_JSON_DIR)
    index = 0
    for json_dir in json_dirs:
        category = json_dir[:-5]
        questionList = []
        skippedCnt = 0
        with open(f"{TRIVIA_JSON_DIR}{json_dir}", "r", encoding="utf-8") as f:
            data = json.load(f)
            for questionData in data:
                try:
                    questionList.append(TriviaQuestion.from_dict(questionData))
                except:
                    skippedCnt += 1
        
        triviaList.append(questionList)
        categoryDict[category] = index
        index += 1
        logging.info(f"Loaded {category}: {len(questionList)} trivia questions, skipped {skippedCnt}")
    
    logging.warning(f"trivia loaded, {len(triviaList)} categories")


@app.route("/api/get_trivia/random", methods=["GET"])
def get_random_trivia():
    categoryIndex = random.randint(0, len(triviaList)-1)
    question = random.choice(triviaList[categoryIndex])

    return jsonify(question.to_dict()), 200

@app.route("/api/get_trivia/<string:category>", methods=["GET"])
def get_trivia(category):
    if category not in categoryDict:
        return get_random_trivia()
    question = random.choice(triviaList[categoryDict[category]])
    return jsonify(question.to_dict()), 200


# flight scraper
@app.route("/api/get_flight", methods=["GET"])
def get_flight():
    
    try:

        org = request.args.get('org')
        dest = request.args.get('dest')
        date = request.args.get('date')
        # logging.info(f"got request {org} -> {dest} @ {date}")

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
        
        # logging.info(f"scraper finished {org} -> {dest} @ {date}.")
        return send_file(datajson)
    
    except Exception as e:
        logging.error(f"get flight error! {e}")
        return jsonify({"message": f"Backend error! {e}"}), 400
    



@app.route("/")
def main_menu():
    api_url = os.getenv('API_URL', 'http://127.0.0.1:5000/api/')
    return render_template('home.html', api_url=api_url)

@app.route("/tutorial")
def tutorial():
    api_url = os.getenv('API_URL', 'http://127.0.0.1:5000/api/')
    flight_url = os.getenv('FLIGHT_URL', 'http://127.0.0.1:5000/api/')
    
    return render_template('tutorial.html', api_url=api_url, flight_url=flight_url)


@app.route("/game/<int:game_id>")
def game(game_id):
    api_url = os.getenv('API_URL', 'http://127.0.0.1:5000/api/')
    flight_url = os.getenv('FLIGHT_URL', 'http://127.0.0.1:5000/api/')

    orgIata = gamesList[game_id - 1].orgIata
    startingTime = gamesList[game_id - 1].startingTime

    return render_template('game.html', api_url=api_url, flight_url=flight_url, game_id=game_id, starting_iata=orgIata, starting_time=startingTime)


@app.route("/freegame")
def freegame():
    api_url = os.getenv('API_URL', 'http://127.0.0.1:5000/api/')
    flight_url = os.getenv('FLIGHT_URL', 'http://127.0.0.1:5000/api/')

    org = request.args.get('org')
    date = request.args.get('date')
    # logging.info(f"got request {org} -> {dest} @ {date}")
    
    if not org or not date:
        return jsonify({"message": "params missing! org: IATA code, date: YYYY-MM-DDThh:mm:ssZ"}), 400
    iataRe = re.compile(r'^[a-zA-Z]{3}$')
    dateRe = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$')
    if not iataRe.match(org):
        return jsonify({"message": "org param doesn't match the IATA format!"}), 400
    if not dateRe.match(date):
        return jsonify({"message": "date param doesn't match the format! (YYYY-MM-DDThh:mm:ssZ)"}), 400
    try:
        if datetime.strptime(date, '%Y-%m-%dT%H:%M:%SZ') < datetime.utcnow():
            return jsonify({"message": "date param is prior to the current time!"}), 400
    except ValueError:
        return jsonify({"message": "Invalid date format!"}), 400
    
    return render_template('game.html', api_url=api_url, flight_url=flight_url, game_id=0, starting_iata=org, starting_time=date)


@app.route("/minigames/<path:path>")
def minigames(path):
    return send_from_directory('minigames', path)


@app.route("/about")
def about():
    return render_template('about.html')

@app.route("/favicon.ico")
def favicon():
    return send_file("favicon.ico")


# admin
@app.route("/admin/make_game", methods=["POST"])
def make_game():
    admin_pw = os.getenv('ADMIN_PASSWORD')
    data = request.get_json()
    password = data.get("password")

    if password != admin_pw:
        return jsonify({"message": "Password incorrect!"}), 400

    try:
        orgIata = data.get("orgIata") # eg. DEN
        startingTime = data.get("startingTime") # eg. 2024-06-20T00:00:00Z
        
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
    password = data.get("password")

    if password != admin_pw:
        return jsonify({"message": "Password incorrect!"}), 400

    try:
        dc_date = data.get("dc_date") # eg. 2024-06-20
        gameId = int(data.get("gameId"))

        if gameId > len(os.listdir(DATA_DIR)):
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

        logging.warning(f"New DC! DATE:{dc_date} Game id: {gameId}")
        return send_file(JSONDIR)
    
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


load_datas()
load_trivia_json()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port='5000')