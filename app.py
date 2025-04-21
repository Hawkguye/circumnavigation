from flask import Flask, request, jsonify, send_file, render_template, url_for, redirect, send_from_directory
from flask_cors import CORS
# from flask_sqlalchemy import SQLAlchemy
import json
import os
import re
from datetime import datetime

from modals import Game

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

def load_datas():
    gamesList.clear()
    gamesJsonList = os.listdir(DATA_DIR)
    gamesJsonList.sort()

    for gameJson in gamesJsonList:
        with open(f"{DATA_DIR}{gameJson}", "r") as f:
            data = json.load(f)
            gamesList.append(Game.from_dict(data))

    logging.warning(f"Loaded {len(gamesList)} Games")


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

ICAO_codes = ['ACC', 'ACE', 'ADB', 'ADD', 'ADL', 'AER', 'AGP', 'AKL', 'ALA', 'ALC', 'ALG', 'AMM', 'AMS', 'ANC', 'ARN', 'ATH', 'ATL', 'AUA', 'AUH', 'AUS', 'AYT', 'BAH', 'BCN', 'BDS', 'BEG', 'BER', 'BEY', 'BFS', 'BGO', 'BGW', 'BGY', 'BHX', 'BJV', 'BJX', 'BKK', 'BLL', 'BLQ', 'BLR', 'BNA', 'BNE', 'BOD', 'BOG', 'BOJ', 'BOM', 'BOS', 'BRI', 'BRU', 'BSB', 'BSL', 'BUD', 'BUF', 'BWI', 'BWN', 'BZE', 'CAG', 'CAI', 'CAN', 'CCS', 'CCU', 'CDG', 'CEB', 'CGK', 'CGN', 'CGO', 'CGQ', 'CKG', 'CLE', 'CLT', 'CMB', 'CMH', 'CMN', 'CNF', 'COK', 'CPH', 'CPT', 'CSX', 'CTA', 'CTS', 'CTU', 'CUN', 'CUR', 'CVG', 'DAC', 'DAR', 'DCA', 'DEL', 'DEN', 'DFW', 'DLC', 'DLM', 'DME', 'DMK', 'DMM', 'DOH', 'DPS', 'DSS', 'DTW', 'DUB', 'DUS', 'DXB', 'EBB', 'EDI', 'EIN', 'ESB', 'EVN', 'EWR', 'EZE', 'FAO', 'FCO', 'FLL', 'FNC', 'FOC', 'FRA', 'FRU', 'FUE', 'FUK', 'GCM', 'GDL', 'GDN', 'GIG', 'GLA', 'GOI', 'GOT', 'GRU', 'GUA', 'GVA', 'GYD', 'GYE', 'HAJ', 'HAK', 'HAM', 'HAN', 'HAV', 'HEL', 'HER', 'HET', 'HGH', 'HKG', 'HKT', 'HMO', 'HND', 'HNL', 'HRB', 'HRG', 'HYD', 'IAD', 'IAH', 'IBZ', 'ICN', 'IKA', 'IND', 'ISB', 'IST', 'JAX', 'JED', 'JFK', 'JNB', 'KEF', 'KGL', 'KHH', 'KHI', 'KHN', 'KIN', 'KIX', 'KMG', 'KRK', 'KRT', 'KTM', 'KUF', 'KUL', 'KWE', 'KWI', 'KWL', 'KZN', 'LAD', 'LAS', 'LAX', 'LCA', 'LED', 'LEJ', 'LGA', 'LGW', 'LHE', 'LHR', 'LHW', 'LIM', 'LIR', 'LIS', 'LJU', 'LOS', 'LPA', 'LTN', 'LUX', 'LYS', 'MAA', 'MAD', 'MAN', 'MBA', 'MCI', 'MCO', 'MCT', 'MDW', 'MED', 'MEL', 'MEM', 'MEX', 'MFM', 'MIA', 'MKE', 'MLA', 'MLE', 'MNL', 'MRS', 'MRU', 'MSP', 'MSQ', 'MSY', 'MTY', 'MUC', 'MXP', 'MZT', 'NAP', 'NAS', 'NBO', 'NCE', 'NGB', 'NGO', 'NKG', 'NNG', 'NQZ', 'NRT', 'NUE', 'OAK', 'OMA', 'ONT', 'OPO', 'ORD', 'ORY', 'OSL', 'OTP', 'OVB', 'PAP', 'PBI', 'PDX', 'PEK', 'PER', 'PHL', 'PHX', 'PIT', 'PKX', 'PLS', 'PMI', 'PMO', 'PNH', 'PRG', 'PSA', 'PTY', 'PUJ', 'PUS', 'PVD', 'PVG', 'PVR', 'PWM', 'RDU', 'RGN', 'RIC', 'RIX', 'RNO', 'ROV', 'RSW', 'RUH', 'SAL', 'SAN', 'SAT', 'SAV', 'SAW', 'SCL', 'SCQ', 'SDF', 'SDQ', 'SEA', 'SEZ', 'SFB', 'SFO', 'SGN', 'SHA', 'SHE', 'SHJ', 'SID', 'SIN', 'SJC', 'SJD', 'SJU', 'SKG', 'SKP', 'SLC', 'SMF', 'SNA', 'SOF', 'SSH', 'STL', 'STN', 'STR', 'SVG', 'SVO', 'SVX', 'SXM', 'SYD', 'SYR', 'SYX', 'SZX', 'TAO', 'TAS', 'TBS', 'TFS', 'TFU', 'TGD', 'TIA', 'TIJ', 'TLL', 'TLS', 'TLV', 'TNA', 'TOS', 'TPA', 'TPE', 'TRD', 'TRN', 'TRV', 'TSN', 'TUL', 'TUN', 'TYN', 'UFA', 'UIO', 'URC', 'VAR', 'VCE', 'VIE', 'VKO', 'VNO', 'VRN', 'WAW', 'WNZ', 'WUH', 'XIY', 'XMN', 'YEG', 'YHZ', 'YNT', 'YOW', 'YUL', 'YVR', 'YWG', 'YYC', 'YYZ', 'ZAG', 'ZIA', 'ZNZ', 'ZRH']
@app.route("/freegame")
def freegame():
    api_url = os.getenv('API_URL', 'http://127.0.0.1:5000/api/')
    flight_url = os.getenv('FLIGHT_URL', 'http://127.0.0.1:5000/api/')

    org = request.args.get('org')
    date = request.args.get('date')
    # logging.info(f"got request {org} -> {dest} @ {date}")
    
    if not org or not date:
        return jsonify({"message": "params missing! org: IATA code, date: YYYY-MM-DDThh:mm:ssZ"}), 400

    if org not in ICAO_codes:
        return jsonify({"message": "ICAO code not valid! (no such airport)"}), 400
    
    dateRe = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$')
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


@app.route('/health')
def health():
    return jsonify(status="healthy"), 200


load_datas()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port='5000')