# Puzzles

The puzzles in this directory were downloaded from the [Lichess Open Database](https://database.lichess.org/#puzzles), split into files based on rating, and stripped of unused data.

## Online

Online files contain puzzle id and rating only. The IDs are used to query the [Lichess API](https://lichess.org/api#tag/Puzzles/operation/apiPuzzleId). Deciding which ID to fetch is based on the player's current rating.

### Example Query

`https://lichess.org/api/puzzle/K69di`

### Example Response

```json
{
  "game": {
    "clock": "10+0",
    "id": "VpVdGbna",
    "perf": {
      "key": "rapid",
      "name": "Rapid"
    },
    "pgn": "d4 Nf6 Nf3 g6 Nc3 d6 e4 c5 Be3 cxd4 Bxd4 Nc6 Be3 Qa5 Bd2 Bg7 Be2 O-O O-O Qb6 Rb1 Bg4 h3 Bxf3 Bxf3 Nd4 Be3 Nxf3+ Qxf3 Qc6 Bd4 a6 Bxf6 Bxf6 Nd5 Qxc2 Nxf6+ exf6 Qxf6 Qxe4 Qxd6 Rad8 Qb6 Rfe8 Rfe1 Qxe1+ Rxe1 Rxe1+ Kh2 Rd2 Kg3 Ree2 Qxb7 Rxb2 Qxa6 Rxa2 Qc8+ Kg7 Qc3+ Kg8 Qc5 Rxf2 Qc8+ Kg7 Qc3+ Kh6 Qe3+ Kg7 Qe5+ Kf8 Qh8+ Ke7 Qe5+ Kf8 Qb8+ Kg7 Qe5+ f6 Qe7+ Kh6 Qf8+ Kg5 h4+ Kh5 Qc5+ f5 Qc1 Rxg2+ Kh3 Rh2+ Kg3 Rag2+ Kf3 Rg4 Qd1 Rhxh4 Kf2 Rh2+ Kf3 Rh3+ Ke2 Rg2+ Kf1+ Rg4 Kf2 g5 Qd8 h6 Qe8+ Kh4 Kf1 h5 Qe1+ Rhg3 Qe5 f4 Qe1 f3 Kf2 Rf4 Qh1+ Rh3 Qe1 g4",
    "players": [
      {
        "color": "white",
        "name": "borska (2013)",
        "userId": "borska"
      },
      {
        "color": "black",
        "name": "Xxn00bkillar69xX (1990)",
        "userId": "xxn00bkillar69xx"
      }
    ],
    "rated": true
  },
  "puzzle": {
    "id": "K69di",
    "initialPly": 123,
    "plays": 1970,
    "rating": 2022,
    "solution": [
      "e1e7",
      "f4f6",
      "e7f6"
    ],
    "themes": [
      "short",
      "queenRookEndgame",
      "endgame",
      "mateIn2"
    ]
  }
}
```

## Offline

It is important for this project to support offline puzzles. Only minimal information is stored to keep file size small: puzzle id, fen, moves, rating. As a first "quick and dirty" solution to keeping file sizes small, puzzles were sorted into files in rating intervals of 100. This created files rougly less than 2MB each.

Note that these offline puzzles are designed to be used when fetch requests fail from the Lichess API. This is one of the primary reasons breaking the puzzles up into smaller files.

## Generating Puzzle Files

A simple Python script was used to generate these files from the original Lichess csv file. It is pasted below. Why not upload the file in a .py file? Mostly to not accidentally flag the repository with a python label. Why not use node.js? Because... I said so.

```python
import csv

# Define the rating rounding interval and output file names
rating_interval = 100
output_files = {}
for i in range(1, 31):
    filename = '{}00.csv'.format(i)
    output_files[filename] = ((i - 1) * rating_interval, i * rating_interval - 1)

# Open all the output files and create a CSV writer for each file
writers = {}
for filename in output_files.keys():
    file = open(filename, 'w')
    writer = csv.writer(file)
    writers[filename] = (file, writer)

# Loop through each row in the input file
with open('input.csv', 'r') as input_file:
    reader = csv.reader(input_file)

    for row in reader:
        rating = int(row[3])
        rating_range = None

        # Determine which output file to write to based on the rating
        for filename, (min_rating, max_rating) in output_files.items():
            if rating >= min_rating and rating <= max_rating:
                rating_range = (min_rating, max_rating)
                break

        # Write the selected columns to the output file
        if rating_range:
            filename = '{}00.csv'.format(int(rating_range[0] / rating_interval) + 1)
            writers[filename][1].writerow([row[0], row[3]])

# Close all the output files
for file, writer in writers.values():
    file.close()

```

## Generating puzzles.csv

For Offline play it makes more sense for now to just include the most popular puzzles. Below is a script that will go through all of the puzzles in the lichess .csv and output `puzzles.csv` that includes the 10 most popular puzzles from each rating:

```python
input_file = 'lichess_db_puzzle.csv'
output_file = 'puzzles.csv'

# Read CSV file and store the puzzles in a dictionary grouped by rating
puzzles_by_rating = {}
with open(input_file, 'r') as csvfile:
    for line in csvfile:
        row = line.strip().split(',')
        puzzle_id, fen, moves, rating, popularity = row[0], row[1], row[2], int(row[3]), int(row[5])
        puzzle = {'puzzle_id': puzzle_id, 'fen': fen, 'moves': moves, 'rating': rating, 'popularity': popularity}

        if rating not in puzzles_by_rating:
            puzzles_by_rating[rating] = []

        puzzles_by_rating[rating].append(puzzle)

# Select the top 10 most popular puzzles for each rating
selected_puzzles = []
for rating, puzzles in puzzles_by_rating.items():
    top_puzzles = sorted(puzzles, key=lambda p: p['popularity'], reverse=True)[:10]
    selected_puzzles.extend(top_puzzles)

# Write the selected puzzles to the output CSV file
with open(output_file, 'w') as csvfile:
    for puzzle in selected_puzzles:
        csvfile.write(','.join([puzzle['puzzle_id'], puzzle['fen'], puzzle['moves'], str(puzzle['rating'])]) + '\n')
```

## Future

There are many other ways to optimize these files, but this is a quick and simple way to get it done. If file size becomes an issue, some form of compression would really improve things.
