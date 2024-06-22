document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('game-list');
    const pagination = document.getElementById('pagination');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');
    let currentPage = 1;
    const itemsPerPage = 25;
    const maxPageButtons = 10;
    let games = [];
    let filteredGames = [];
    let categoryFilteredGames = [];

    let totalChunks = 0;
    let loadedChunks = 0;

    function fetchTotalChunks() {
        return fetch('chunk_count.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                totalChunks = data.total_chunks;
                loadChunks();
            })
            .catch(error => {
                console.error('Error fetching the chunk count:', error);
            });
    }

    function fetchChunk(chunkNumber) {
        return fetch(`chunks/board_games_chunk_${chunkNumber}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for chunk ${chunkNumber}`);
                }
                return response.json();
            })
            .then(data => {
                games = games.concat(data.map(game => ({
                    ...game,
                    categories: game.categories ? game.categories.split(',').map(c => c.trim()) : []
                })));
                loadedChunks++;
                if (loadedChunks === totalChunks) {
                    processGamesData();
                }
            })
            .catch(error => {
                console.error(`Error fetching the JSON data for chunk ${chunkNumber}:`, error);
            });
    }

    function loadChunks() {
        for (let i = 1; i <= totalChunks; i++) {  // Start from 1 instead of 0
            fetchChunk(i);
        }
    }

    function processGamesData() {
        games.sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity));  // Sort games by rank
        populateCategoryFilter();
        applyFilter();
    }

    fetchTotalChunks();

    categoryFilter.addEventListener('change', applyFilter);
    searchInput.addEventListener('input', applyFilter);

    function populateCategoryFilter() {
        const categories = [...new Set(games.flatMap(game => game.categories || []))]
            .sort((a, b) => a.localeCompare(b)); // Sort categories alphabetically

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    function applyFilter() {
        const selectedCategory = categoryFilter.value;
        const searchQuery = searchInput.value.toLowerCase();

        if (selectedCategory === 'all') {
            categoryFilteredGames = games;
        } else {
            categoryFilteredGames = games.filter(game => game.categories.includes(selectedCategory))
                .map((game, index) => ({ ...game, categoryRank: index + 1 }));
        }

        filteredGames = categoryFilteredGames.filter(game => game.name.toLowerCase().includes(searchQuery));

        currentPage = 1;
        renderPage();
    }

    function renderPage() {
        container.innerHTML = '';
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filteredGames.slice(start, end);

        pageItems.forEach((game) => {
            const gameCardWrapper = document.createElement('div');
            gameCardWrapper.classList.add('game-card-wrapper');

            const rankNumber = document.createElement('div');
            rankNumber.classList.add('rank-number');
            // Display category rank if available, otherwise display overall rank
            rankNumber.textContent = categoryFilter.value === 'all' ? game.rank || 'Unranked' : game.categoryRank || 'Unranked';

            const gameCard = document.createElement('div');
            gameCard.classList.add('game');

            const gameTitle = document.createElement('h3');
            gameTitle.classList.add('game-title');
            gameTitle.textContent = game.name || 'No Name Provided';

            const gameContent = document.createElement('div');
            gameContent.classList.add('game-content');

            const gameImg = document.createElement('img');
            gameImg.src = game.thumbnail || 'default-thumbnail.png'; // Replace with a default image path if needed
            gameImg.alt = game.name || 'No Image';

            const gameInfo = document.createElement('div');
            gameInfo.classList.add('game-info');

            const rating = game.bayes_average ? (game.bayes_average).toFixed(1) : (game.average ? (game.average).toFixed(1) : 'Unrated');
            const complexity = game.average_weight ? `<strong>Complexity:</strong> ${(game.average_weight * 2).toFixed(1)} / 10` : '<strong>Complexity:</strong> Unspecified';
            const players = game.min_players && game.max_players ? `<strong>Players:</strong> ${game.min_players} - ${game.max_players}` : '<strong>Players:</strong> Unspecified';
            const playingTime = game.playing_time ? `<strong>Playing Time:</strong> ${game.playing_time} mins` : '<strong>Playing Time:</strong> Unspecified';
            const age = game.age ? `<strong>Recommended Age:</strong> ${game.age}` : '<strong>Recommended Age:</strong> Unspecified';
            const categoriesText = game.categories.length ? game.categories.join(', ') : 'Not specified';

            const gameDetails = `
                <p class="game-rating"><strong>Rating:</strong> ${rating} / 10</p>
                <p class="game-complexity">${complexity}</p>
                <p class="game-players">${players}</p>
                <p class="game-playing-time">${playingTime}</p>
                <p class="game-age">${age}</p>
                <p class="game-categories"><strong>Categories:</strong> ${categoriesText}</p>
            `;

            gameInfo.innerHTML = gameDetails;

            if (categoryFilter.value !== 'all') {
                const gameRank = document.createElement('p');
                gameRank.classList.add('game-rank');
                gameRank.innerHTML = `<strong>Overall Rank:</strong> ${game.rank || 'Unranked'}`;
                gameInfo.appendChild(gameRank);
            }

            gameContent.appendChild(gameImg);
            gameContent.appendChild(gameInfo);
            gameCard.appendChild(gameTitle);
            gameCard.appendChild(gameContent);
            gameCardWrapper.appendChild(rankNumber);
            gameCardWrapper.appendChild(gameCard);
            container.appendChild(gameCardWrapper);
        });

        renderPagination();
    }

    function renderPagination() {
        pagination.innerHTML = '';

        const totalPages = Math.ceil(filteredGames.length / itemsPerPage);

        // Page numbers
        const pageNumbersDiv = document.createElement('div');
        pageNumbersDiv.classList.add('page-numbers');

        let startPage = Math.max(currentPage - Math.floor(maxPageButtons / 2), 1);
        let endPage = Math.min(startPage + maxPageButtons - 1, totalPages);

        if (endPage - startPage < maxPageButtons - 1) {
            startPage = Math.max(endPage - maxPageButtons + 1, 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = createPaginationButton(i, i);
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageNumbersDiv.appendChild(pageButton);
        }

        pagination.appendChild(pageNumbersDiv);

        // Navigation buttons
        const navButtonsDiv = document.createElement('div');
        navButtonsDiv.classList.add('nav-buttons');

        if (currentPage > 1) {
            const firstButton = createPaginationButton('First', 1);
            const prevButton = createPaginationButton('Previous', currentPage - 1);
            navButtonsDiv.appendChild(firstButton);
            navButtonsDiv.appendChild(prevButton);
        }

        if (currentPage < totalPages) {
            const nextButton = createPaginationButton('Next', currentPage + 1);
            const lastButton = createPaginationButton('Last', totalPages);
            navButtonsDiv.appendChild(nextButton);
            navButtonsDiv.appendChild(lastButton);
        }

        pagination.appendChild(navButtonsDiv);
    }

    function createPaginationButton(text, page) {
        const button = document.createElement('button');
        button.textContent = text;
        button.addEventListener('click', () => {
            currentPage = page;
            renderPage();
        });
        return button;
    }
});
