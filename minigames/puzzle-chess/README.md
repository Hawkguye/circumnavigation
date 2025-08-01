# Puzzle ♟ Chess

A simple chess game where you solve puzzles.

## 💻 Technology

Built with basic HTML, CSS, and JavaScript.

## 🪶 Philosophy

I try to write code that beginners can understand. Keep everything simple. Avoid being overly complex or caring too much about optimization.

## 🕹️ Game Details

- players **start at a rating of 400** when starting a new game
- solving or failing a puzzle will change the player rating
  - up to a **maximum of +/- 32**, based on the puzzle difficulty
- player rating is stored via [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) 
- puzzles are selected **randomly** from within **+/- 100** the player rating
- in order to support **offline play**, approximately ~2 MB of puzzles
  - stored in `/puzzles/offline/puzzles.csv`
  - range in difficulty from **400 to 3166**
  - puzzles were selected from [Lichess Open Database](https://database.lichess.org/#puzzles)
- in a future update, support for the **[Lichess.org API](https://lichess.org/api)** is planned
  - this will enable use of the entire puzzle database
- [pawn promotion](https://en.wikipedia.org/wiki/Promotion_(chess)) is supported
  - but the piece will be automatically chosen based on the puzzle solution
- the **current player rating** is visible in the **☰ menu**
- double clicking the **Puzzle ♟ Chess** title will reveal a **debug information**

## 🤝 Attribution

- Pieces by [Cburnett](https://en.wikipedia.org/wiki/User:Cburnett), [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) via [Wikimedia Commons](https://commons.wikimedia.org/wiki/Template:SVG_chess_pieces)
- Puzzles via [Lichess Open Database](https://database.lichess.org/#puzzles), [Creative Commons CC0](https://www.tldrlegal.com/license/creative-commons-cc0-1-0-universal)
- Uses [fen-validator](https://github.com/jayasurian123/fen-validator), [GNU GPL v3.0](https://choosealicense.com/licenses/gpl-3.0/) by [Jayasurian Makkoth](https://github.com/jayasurian123)
- Uses [JS-CHESS-ENGINE](https://github.com/josefjadrny/js-chess-engine), [MIT](https://choosealicense.com/licenses/mit/) by [Josef Jadrny](https://github.com/josefjadrny)

## 📜 License

Copyright (c) 2024 Arlin Schaffel

Licensed under the **GNU GPL v3.0 License**, available here: https://github.com/FeXd/puzzle-chess/blob/main/LICENSE.md
