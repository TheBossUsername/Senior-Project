import os
import pandas as pd
import sqlalchemy
from dotenv import load_dotenv
import json
import shutil

# Load environment variables
load_dotenv()

# Access the variables
user = os.getenv("USER")
password = os.getenv("PASSWORD")
database = os.getenv("DATABASE")
server = os.getenv("SERVER")

# Create the SQLAlchemy engine
engine = sqlalchemy.create_engine(f'mysql+pymysql://{user}:{password}@{server}/{database}')

# Progress bar function
def print_progress_bar(current, total, bar_length=50):
    progress = current / total
    block = int(bar_length * progress)
    bar = "#" * block + "-" * (bar_length - block)
    percentage = progress * 100
    print(f"\r[{bar}] {percentage:.2f}%", end='', flush=True)

# Function to fetch data from MySQL and write to JSON chunks
def fetch_and_write_to_json_chunks():
    chunk_size = 1000  # Fetch 1000 rows at a time
    offset = 0

    # Create chunks directory if it doesn't exist, or clean it if it does
    chunks_dir = 'chunks'
    if os.path.exists(chunks_dir):
        shutil.rmtree(chunks_dir)
    os.makedirs(chunks_dir)

    # Get the total number of rows for progress bar
    count_query = "SELECT COUNT(*) FROM board_game"
    total_rows = pd.read_sql(count_query, engine).iloc[0, 0]

    chunk_number = 1  # Start chunk numbering from 1

    while True:
        # Define the query with limit and offset for chunk fetching
        query = f"""
        SELECT 
            bg.id,
            bg.name,
            bg.year_published,
            bg.min_players,
            bg.max_players,
            bg.age,
            bg.average_weight,
            bg.playing_time,
            bg.min_playing_time,
            bg.max_playing_time,
            bg.description,
            bg.thumbnail,
            bg.image,
            bg.average,
            bg.bayes_average,
            bg.users_rated,
            bg.old_rank,
            gr.game_rank AS `rank`,
            (
                SELECT GROUP_CONCAT(DISTINCT c.name ORDER BY c.name ASC SEPARATOR ', ')
                FROM categories c
                JOIN board_game_has_categories bgc ON c.id = bgc.category_id
                WHERE bgc.board_game_id = bg.id
            ) AS categories,
            (
                SELECT GROUP_CONCAT(DISTINCT m.name ORDER BY m.name ASC SEPARATOR ', ')
                FROM mechanics m
                JOIN board_game_has_mechanics bgm ON m.id = bgm.mechanic_id
                WHERE bgm.board_game_id = bg.id
            ) AS mechanics,
            (
                SELECT GROUP_CONCAT(DISTINCT p.name ORDER BY p.name ASC SEPARATOR ', ')
                FROM publishers p
                JOIN board_game_has_publishers bgp ON p.id = bgp.publisher_id
                WHERE bgp.board_game_id = bg.id
            ) AS publishers
        FROM 
            board_game bg
        LEFT JOIN 
            game_rank gr ON bg.id = gr.board_game_id
        ORDER BY 
            `rank` ASC
        LIMIT {chunk_size} OFFSET {offset};
        """

        # Execute the query and fetch data into a DataFrame
        df = pd.read_sql(query, engine)

        if df.empty:
            break  # Exit the loop if no more data

        # Replace NaN values with suitable defaults
        df.fillna({
            'year_published': 'Unspecified',
            'min_players': 'Unspecified',
            'max_players': 'Unspecified',
            'age': 'Unspecified',
            'average_weight': 0,
            'playing_time': 'Unspecified',
            'min_playing_time': 'Unspecified',
            'max_playing_time': 'Unspecified',
            'description': '',
            'thumbnail': '',
            'image': '',
            'average': 0,
            'bayes_average': 0,
            'users_rated': 0,
            'old_rank': 'Unspecified',
            'rank': 'Unranked',
            'categories': 'Unspecified',
            'mechanics': 'Unspecified',
            'publishers': 'Unspecified'
        }, inplace=True)

        # Convert the DataFrame to a list of dictionaries
        data = df.to_dict(orient='records')

        # Write the chunk to a JSON file
        output_file = f'{chunks_dir}/board_games_chunk_{chunk_number}.json'
        with open(output_file, 'w', encoding='utf-8') as json_file:
            json.dump(data, json_file, ensure_ascii=False, indent=4)

        # Print the progress bar
        offset += chunk_size
        chunk_number += 1
        print_progress_bar(offset, total_rows)

    # Write the total number of chunks to chunk_count.json
    chunk_count_file = f'chunk_count.json'
    with open(chunk_count_file, 'w', encoding='utf-8') as f:
        json.dump({"total_chunks": chunk_number - 1}, f)  # Adjusted for 1-based index

    print(f"\nData successfully split into {chunk_number - 1} chunks in the '{chunks_dir}' directory.")

if __name__ == "__main__":
    fetch_and_write_to_json_chunks()
