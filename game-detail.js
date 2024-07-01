document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const gameId = parseInt(params.get('id'));

    function fetchGameData(gameId) {
        return fetch('chunk_count.json')
            .then(response => response.json())
            .then(data => {
                const totalChunks = data.total_chunks;
                return findGameInChunks(gameId, totalChunks);
            });
    }

    function findGameInChunks(gameId, totalChunks) {
        let foundGame = null;
        let promises = [];

        for (let i = 1; i <= totalChunks; i++) {
            let promise = fetch(`chunks/board_games_chunk_${i}.json`)
                .then(response => response.json())
                .then(games => {
                    let game = games.find(game => game.id === gameId);
                    if (game) {
                        foundGame = game;
                    }
                });
            promises.push(promise);
        }

        return Promise.all(promises).then(() => foundGame);
    }

    fetchGameData(gameId).then(game => {
        if (!game) {
            document.getElementById('game-detail').innerHTML = '<p>Game not found.</p>';
            return;
        }
        displayGameDetails(game);
    });

    function displayGameDetails(game) {
        const container = document.getElementById('game-detail');
        container.innerHTML = `
            <h1>${game.name}</h1>
            <p><strong>Year Published:</strong> ${game.year_published}</p>
            <p><strong>Description:</strong> ${game.description}</p>
            <img src="${game.image}" alt="${game.name}" style="max-width: 300px;">
            <p><strong>Rating:</strong> ${game.average.toFixed(2)}</p>
            <p><strong>Rank:</strong> ${game.rank}</p>
            <p><strong>Players:</strong> ${game.min_players}-${game.max_players}</p>
            <p><strong>Playing Time:</strong> ${game.playing_time} minutes</p>
        `;
    }
});
