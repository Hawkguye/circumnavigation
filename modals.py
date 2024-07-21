from datetime import datetime, timezone

class PlayerStat:
    def __init__(self, uniqueId, username, timeUsed, moneyUsed, distanceCovered, legsCount, route):
        self.uniqueId = uniqueId
        self.username = username
        self.timeUsed = timeUsed
        self.moneyUsed = moneyUsed
        self.distanceCovered = distanceCovered
        self.legsCount = legsCount
        self.route = route
    
    def to_dict(self):
        return {
            "uniqueId": self.uniqueId,
            "username": self.username,
            "timeUsed": self.timeUsed,
            "moneyUsed": self.moneyUsed,
            "distanceCovered": self.distanceCovered,
            "legsCount": self.legsCount,
            "route": self.route
        }
    
    @staticmethod
    def from_dict(data):
        return PlayerStat(data["uniqueId"], data["username"], data["timeUsed"], data["moneyUsed"], data["distanceCovered"], data["legsCount"], data["route"])

class Game:
    def __init__(self, gameId, orgIata, startingTime, playerStats):
        self.gameId = int(gameId)
        self.dateCreated = int(datetime.now(timezone.utc).timestamp()) * 1000
        self.orgIata = orgIata
        self.startingTime = startingTime
        self.playerStats = playerStats
    
    def to_dict(self):
        return {
            "gameId": self.gameId,
            "dateCreated": self.dateCreated,
            "orgIata": self.orgIata,
            "startingTime": self.startingTime,
            "playerStats": [playerStat.to_dict() for playerStat in self.playerStats]
        }
    
    @staticmethod
    def from_dict(data):
        playerStats = [PlayerStat.from_dict(playerstat) for playerstat in data["playerStats"]]
        return Game(data["gameId"], data["orgIata"], data["startingTime"], playerStats)

class TriviaQuestion:
    def __init__(self, question, category, answer, choices):
        self.question = question
        self.category = category
        self.answer = answer
        self.choices = choices

    def to_dict(self):
        return {
            'question': self.question,
            'category': self.category,
            'answer': self.answer,
            'choices': self.choices
        }

    @staticmethod
    def from_dict(data):
        return TriviaQuestion(data["question"], data["category"], data["answer"], data["choices"])