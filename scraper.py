from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time
from datetime import datetime, timezone
import re
import json
import os
import logging

iata_to_icao = {'KEF': 'BIKF', 'YEG': 'CYEG', 'YHZ': 'CYHZ', 'YOW': 'CYOW', 'YUL': 'CYUL', 'YVR': 'CYVR', 'YWG': 'CYWG', 'YYC': 'CYYC', 'YYZ': 'CYYZ', 'ALG': 'DAAG', 'ACC': 'DGAA', 'LOS': 'DNMM', 'TUN': 'DTTA', 'BRU': 'EBBR', 'BER': 'EDDB', 'FRA': 'EDDF', 'HAM': 'EDDH', 'CGN': 'EDDK', 'DUS': 'EDDL', 'MUC': 'EDDM', 'NUE': 'EDDN', 'LEJ': 'EDDP', 'STR': 'EDDS', 'HAJ': 'EDDV', 'TLL': 'EETN', 'HEL': 'EFHK', 'BFS': 'EGAA', 'BHX': 'EGBB', 'MAN': 'EGCC', 'LTN': 'EGGW', 'LGW': 'EGKK', 'LHR': 'EGLL', 'GLA': 'EGPF', 'EDI': 'EGPH', 'STN': 'EGSS', 'AMS': 'EHAM', 'EIN': 'EHEH', 'DUB': 'EIDW', 'BLL': 'EKBI', 'CPH': 'EKCH', 'LUX': 'ELLX', 'BGO': 'ENBR', 'OSL': 'ENGM', 'TOS': 'ENTC', 'TRD': 'ENVA', 'SVG': 'ENZV', 'GDN': 'EPGD', 'KRK': 'EPKK', 'WAW': 'EPWA', 'GOT': 'ESGG', 'ARN': 'ESSA', 'RIX': 'EVRA', 'VNO': 'EYVI', 'CPT': 'FACT', 'JNB': 'FAOR', 'MRU': 'FIMP', 'LAD': 'FNLU', 'SEZ': 'FSIA', 'FUE': 'GCFV', 'LPA': 'GCLP', 'ACE': 'GCRR', 'TFS': 'GCTS', 'CMN': 'GMMN', 'DSS': 'GOBD', 'SID': 'GVAC', 'ADD': 'HAAB', 'CAI': 'HECA', 'HRG': 'HEGN', 'SSH': 'HESH', 'NBO': 'HKJK', 'MBA': 'HKMO', 'KGL': 'HRYR', 'KRT': 'HSSK', 'DAR': 'HTDA', 'ZNZ': 'HTZA', 'EBB': 'HUEN', 'ATL': 'KATL', 'AUS': 'KAUS', 'BNA': 'KBNA', 'BOS': 'KBOS', 'BUF': 'KBUF', 'BWI': 'KBWI', 'CLE': 'KCLE', 'CLT': 'KCLT', 'CMH': 'KCMH', 'CVG': 'KCVG', 'DCA': 'KDCA', 'DEN': 'KDEN', 'DFW': 'KDFW', 'DTW': 'KDTW', 'EWR': 'KEWR', 'FLL': 'KFLL', 'IAD': 'KIAD', 'IAH': 'KIAH', 'IND': 'KIND', 'JAX': 'KJAX', 'JFK': 'KJFK', 'LAS': 'KLAS', 'LAX': 'KLAX', 'LGA': 'KLGA', 'MCI': 'KMCI', 'MCO': 'KMCO', 'MDW': 'KMDW', 'MEM': 'KMEM', 'MIA': 'KMIA', 'MKE': 'KMKE', 'MSP': 'KMSP', 'MSY': 'KMSY', 'OAK': 'KOAK', 'OMA': 'KOMA', 'ONT': 'KONT', 'ORD': 'KORD', 'PBI': 'KPBI', 'PDX': 'KPDX', 'PHL': 'KPHL', 'PHX': 'KPHX', 'PIT': 'KPIT', 'PVD': 'KPVD', 'PWM': 'KPWM', 'RDU': 'KRDU', 'RIC': 'KRIC', 'RNO': 'KRNO', 'RSW': 'KRSW', 'SAN': 'KSAN', 'SAT': 'KSAT', 'SAV': 'KSAV', 'SDF': 'KSDF', 'SEA': 'KSEA', 'SFB': 'KSFB', 'SFO': 'KSFO', 'SJC': 'KSJC', 'SLC': 'KSLC', 'SMF': 'KSMF', 'SNA': 'KSNA', 'STL': 'KSTL', 'SYR': 'KSYR', 'TPA': 'KTPA', 'TUL': 'KTUL', 'TIA': 'LATI', 'BOJ': 'LBBG', 'SOF': 'LBSF', 'VAR': 'LBWN', 'LCA': 'LCLK', 'ZAG': 'LDZA', 'ALC': 'LEAL', 'BCN': 'LEBL', 'IBZ': 'LEIB', 'MAD': 'LEMD', 'AGP': 'LEMG', 'PMI': 'LEPA', 'SCQ': 'LEST', 'BOD': 'LFBD', 'TLS': 'LFBO', 'LYS': 'LFLL', 'MRS': 'LFML', 'NCE': 'LFMN', 'CDG': 'LFPG', 'ORY': 'LFPO', 'BSL': 'LFSB', 'ATH': 'LGAV', 'HER': 'LGIR', 'SKG': 'LGTS', 'BUD': 'LHBP', 'BRI': 'LIBD', 'BDS': 'LIBR', 'CTA': 'LICC', 'PMO': 'LICJ', 'CAG': 'LIEE', 'MXP': 'LIMC', 'BGY': 'LIME', 'TRN': 'LIMF', 'BLQ': 'LIPE', 'VRN': 'LIPX', 'VCE': 'LIPZ', 'FCO': 'LIRF', 'NAP': 'LIRN', 'PSA': 'LIRP', 'LJU': 'LJLJ', 'PRG': 'LKPR', 'TLV': 'LLBG', 'MLA': 'LMML', 'VIE': 'LOWW', 'FAO': 'LPFR', 'FNC': 'LPMA', 'OPO': 'LPPR', 'LIS': 'LPPT', 'OTP': 'LROP', 'GVA': 'LSGG', 'ZRH': 'LSZH', 'ESB': 'LTAC', 'AYT': 'LTAI', 'ADB': 'LTBJ', 'DLM': 'LTBS', 'BJV': 'LTFE', 'SAW': 'LTFJ', 'IST': 'LTFM', 'SKP': 'LWSK', 'BEG': 'LYBE', 'TGD': 'LYPG', 'PLS': 'MBPV', 'PUJ': 'MDPC', 'SDQ': 'MDSD', 'GUA': 'MGGT', 'KIN': 'MKJP', 'GDL': 'MMGL', 'HMO': 'MMHO', 'BJX': 'MMLO', 'MEX': 'MMMX', 'MTY': 'MMMY', 'MZT': 'MMMZ', 'PVR': 'MMPR', 'SJD': 'MMSD', 'TIJ': 'MMTJ', 'CUN': 'MMUN', 'PTY': 'MPTO', 'LIR': 'MRLB', 'SAL': 'MSLP', 'PAP': 'MTPP', 'HAV': 'MUHA', 'GCM': 'MWCR', 'NAS': 'MYNN', 'BZE': 'MZBZ', 'AKL': 'NZAA', 'BAH': 'OBBI', 'DMM': 'OEDF', 'JED': 'OEJN', 'MED': 'OEMA', 'RUH': 'OERK', 'IKA': 'OIIE', 'AMM': 'OJAI', 'KWI': 'OKBK', 'BEY': 'OLBA', 'AUH': 'OMAA', 'DXB': 'OMDB', 'SHJ': 'OMSJ', 'MCT': 'OOMS', 'ISB': 'OPIS', 'KHI': 'OPKC', 'LHE': 'OPLA', 'BGW': 'ORBI', 'DOH': 'OTHH', 'ANC': 'PANC', 'HNL': 'PHNL', 'KHH': 'RCKH', 'TPE': 'RCTP', 'NRT': 'RJAA', 'KIX': 'RJBB', 'CTS': 'RJCC', 'FUK': 'RJFF', 'NGO': 'RJGG', 'HND': 'RJTT', 'PUS': 'RKPK', 'ICN': 'RKSI', 'MNL': 'RPLL', 'CEB': 'RPVM', 'EZE': 'SAEZ', 'BSB': 'SBBR', 'CNF': 'SBCF', 'GIG': 'SBGL', 'GRU': 'SBGR', 'SCL': 'SCEL', 'GYE': 'SEGU', 'UIO': 'SEQM', 'BOG': 'SKBO', 'LIM': 'SPIM', 'CCS': 'SVMI', 'TAO': 'TAO', 'SJU': 'TJSJ', 'AUA': 'TNCA', 'CUR': 'TNCC', 'SXM': 'TNCM', 'ALA': 'UAAA', 'NQZ': 'UACC', 'FRU': 'UAFM', 'GYD': 'UBBB', 'EVN': 'UDYZ', 'TBS': 'UGTB', 'KBP': 'UKBB', 'LWO': 'UKLL', 'LED': 'ULLI', 'MSQ': 'UMMS', 'KJA': 'UNKL', 'OVB': 'UNNT', 'ROV': 'URRP', 'AER': 'URSS', 'SVX': 'USSS', 'TAS': 'UTTT', 'ZIA': 'UUBW', 'DME': 'UUDD', 'SVO': 'UUEE', 'VKO': 'UUWW', 'KZN': 'UWKD', 'UFA': 'UWUU', 'KUF': 'UWWW', 'BOM': 'VABB', 'GOI': 'VAGO', 'CMB': 'VCBI', 'PNH': 'VDPP', 'CCU': 'VECC', 'DAC': 'VGZR', 'HKG': 'VHHH', 'DEL': 'VIDP', 'MFM': 'VMMC', 'KTM': 'VNKT', 'BLR': 'VOBL', 'COK': 'VOCI', 'HYD': 'VOHS', 'MAA': 'VOMM', 'TRV': 'VOTV', 'MLE': 'VRMM', 'DMK': 'VTBD', 'BKK': 'VTBS', 'HKT': 'VTSP', 'HAN': 'VVNB', 'SGN': 'VVTS', 'RGN': 'VYYY', 'DPS': 'WADD', 'BWN': 'WBSB', 'CGK': 'WIII', 'KUL': 'WMKK', 'SIN': 'WSSS', 'BNE': 'YBBN', 'MEL': 'YMML', 'YNT': 'YNT', 'ADL': 'YPAD', 'PER': 'YPPH', 'SYD': 'YSSY', 'PEK': 'ZBAA', 'PKX': 'ZBAD', 'HET': 'ZBHH', 'TSN': 'ZBTJ', 'TYN': 'ZBYN', 'CAN': 'ZGGG', 'CSX': 'ZGHA', 'KWL': 'ZGKL', 'NNG': 'ZGNN', 'SZX': 'ZGSZ', 'CGO': 'ZHCC', 'WUH': 'ZHHH', 'HAK': 'ZJHK', 'SYX': 'ZJSY', 'LHW': 'ZLLL', 'XIY': 'ZLXY', 'KMG': 'ZPPP', 'XMN': 'ZSAM', 'KHN': 'ZSCN', 'FOC': 'ZSFZ', 'HGH': 'ZSHC', 'TNA': 'ZSJN', 'NGB': 'ZSNB', 'NKG': 'ZSNJ', 'PVG': 'ZSPD', 'SHA': 'ZSSS', 'WNZ': 'ZSWZ', 'CKG': 'ZUCK', 'KWE': 'ZUGY', 'TFU': 'ZUTF', 'CTU': 'ZUUU', 'URC': 'ZWWW', 'CGQ': 'ZYCC', 'HRB': 'ZYHB', 'DLC': 'ZYTL', 'SHE': 'ZYTX'}


class flight:
    def __init__(self, org, dest, date, flight_info):
        self.org = org
        self.dest = dest
        self.date = date

        price_pattern = re.compile(r"From (\d+) US dollars")
        airline_pattern = re.compile(r"Nonstop flight with ([\w\s]+)")
        duration_pattern = re.compile(r"Total duration (\d+ hr(?: \d+ min)?)")

        departure_time_pattern = re.compile(r"Leaves .+? at ([\d:]+\s[APM]+)")
        arrival_time_pattern = re.compile(r"arrives at .+? at ([\d:]+\s[APM]+)")
        departure_date_pattern = re.compile(r"Leaves .+? on (.+?) and")
        arrival_date_pattern = re.compile(r"arrives at .+? on (.+?)\.")

        try:
            self.price = int(price_pattern.search(flight_info).group(1))
        except:
            self.price = 0

        self.airline = airline_pattern.search(flight_info).group(1)
        self.duration = duration_pattern.search(flight_info).group(1)

        # time as utc epoch
        departureTimeStr = departure_time_pattern.search(flight_info).group(1)
        arrivalTimeStr = arrival_time_pattern.search(flight_info).group(1)

        departureDateStr = departure_date_pattern.search(flight_info).group(1)
        arrivalDateStr = arrival_date_pattern.search(flight_info).group(1)

        # COME BACK AT 2025!!!!!! im lazy lol
        self.departureTime = datetime.strptime(f"{date[:4]} {departureDateStr} {departureTimeStr}", "%Y %A, %B %d %I:%M %p").replace(tzinfo=timezone.utc)
        self.arrivalTime = datetime.strptime(f"{date[:4]} {arrivalDateStr} {arrivalTimeStr}", "%Y %A, %B %d %I:%M %p").replace(tzinfo=timezone.utc)

    def to_dict(self):
        return {
            "Departure": int(self.departureTime.timestamp() * 1000),
            "Arrival": int(self.arrivalTime.timestamp() * 1000),
            "Airline": self.airline,
            "Duration": self.duration,
            "Price": self.price
        }

    def print(self):
        print()
        print(f"{self.org} -> {self.dest} @ {self.date}")
        print("Price:", self.price)
        print("Airline:", self.airline)
        print("Departure Time:", self.departureTime)
        print("Arrival Time:", self.arrivalTime)
        print("Duration:", self.duration)

class element_stable:
    def __init__(self, locator, timeout=3, poll_frequency=0.05):
        self.locator = locator
        self.timeout = timeout
        self.poll_frequency = poll_frequency

    def __call__(self, driver):
        initial_elements = len(driver.find_elements(*self.locator))
        time.sleep(self.poll_frequency)
        final_elements = len(driver.find_elements(*self.locator))
        # print(final_elements)
        return initial_elements == final_elements

def scrape(org, dest, date):
    option = Options()
    option.add_argument("--headless")
    option.add_argument("--disable-gpu")
    option.add_argument("window-size=1024,768")
    option.add_argument("--no-sandbox")
    # option.add_experimental_option("detach", True)/
    service = Service()
    driver = webdriver.Chrome(service=service, options=option)

    
    logging.info(f"fetching {org}->{dest} @ {date}")

    orgIata = org
    destIata = dest
    if orgIata == 'CAN':
        orgIata = 'ZGGG'
    if orgIata == 'SEA':
        orgIata = 'KSEA'
    if orgIata == 'SHA':
        orgIata = 'ZSSS'

    if destIata == 'CAN':
        destIata = 'ZGGG'
    if destIata == 'SEA':
        destIata = 'KSEA'
    if destIata == 'SHA':
        destIata = 'ZSSS'
    driver.get(f"https://www.google.com/travel/flights?hl=en&q=Flights%20to%20{destIata}%20from%20{orgIata}%20on%20{date}%20oneway%20nonstop&curr=USD")
    # driver.minimize_window()

    try:
        wait = WebDriverWait(driver, 3)
        locator = (By.XPATH, '//*[@jsname="BXUrOb"]')
        wait.until(element_stable(locator))
    except TimeoutException:
        logging.warning("Scraper Timeout!")
        return "error! scraper timeout!"

    # print(time.time() - starttime)
    flightsEl = driver.find_elements(By.CLASS_NAME, "JMc5Xc")
    # print(len(flightsEl))

    flights = []

    for flightEl in flightsEl:
        try:
            flight_info = flightEl.get_attribute("aria-label")
            # print(flight_info)
            flights.append(flight(org, dest, date, flight_info))
        except:
            logging.warn("error fetching flight info, skipping.")

    driver.quit()
    return flights

def flights_to_json(flights, file_path):
    org = flights[0].org
    dest = flights[0].dest
    date = flights[0].date

    flightsList = []
    for flight in flights:
        flightsList.append(flight.to_dict())
    
    date_created = int(datetime.now(timezone.utc).timestamp()) * 1000
    json_dict = {
        "dateCreated": date_created,
        "orgIata": org,
        "destIata": dest,
        "flightDate": date,
        "flights": flightsList
    }

    with open(file_path, "w") as f:
        json.dump(json_dict, f, indent=4)

def main(org, dest, date):
    if org not in iata_to_icao or dest not in iata_to_icao:
        logging.warning("org or dest not valid!")
        return "error! org or dest not valid!"

    file_path = f"data/flights/{org}_{dest}_{date}.json"
    if os.path.exists(file_path):
        return file_path
    
    flights = scrape(org, dest, date)
    try:
        flights_to_json(flights, file_path)
    except:
        date_created = int(datetime.now(timezone.utc).timestamp()) * 1000
        json_dict = {
            "dateCreated": date_created,
            "orgIata": org,
            "destIata": dest,
            "flightDate": date,
            "flights": []
        }

        with open(file_path, "w") as f:
            json.dump(json_dict, f, indent=4)
    
    return file_path
