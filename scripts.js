document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('game-list');
    const topPagination = document.getElementById('top-pagination');
    const bottomPagination = document.getElementById('bottom-pagination');
    const categoryFilter = document.getElementById('category-filter');
    const mechanicsFilter = document.getElementById('mechanics-filter');
    const searchInput = document.getElementById('search-input');
    const toggleAdvancedSearchButton = document.getElementById('toggle-advanced-search');
    const advancedSearch = document.getElementById('advanced-search');
    const clearFiltersButton = document.getElementById('clear-filters');
    const itemsPerPageSelect = document.getElementById('items-per-page');
    let pageNumberSelected = false;
    let currentPage = 1;
    let itemsPerPage = 25;  // Default items per page
    const maxPageButtons = 5;
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
                    categories: game.categories ? game.categories.split(',').map(c => c.trim()) : [],
                    mechanics: game.mechanics ? game.mechanics.split(',').map(m => m.trim()) : []
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
        for (let i = 1; i <= totalChunks; i++) {
            fetchChunk(i);
        }
    }

    function processGamesData() {
        games.sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity));
        populateFilters();
        applyFilter();
    }

    function populateFilters() {
        const categories = [...new Set(games.flatMap(game => game.categories || []))].sort((a, b) => a.localeCompare(b));
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        const mechanics = [...new Set(games.flatMap(game => game.mechanics || []))].sort((a, b) => a.localeCompare(b));
        mechanics.forEach(mechanic => {
            const option = document.createElement('option');
            option.value = mechanic;
            option.textContent = mechanic;
            mechanicsFilter.appendChild(option);
        });
    }

    categoryFilter.addEventListener('change', applyFilter);
    mechanicsFilter.addEventListener('change', applyFilter);

    function applyFilter() {
        const selectedCategory = categoryFilter.value;
        const selectedMechanic = mechanicsFilter.value;
        filteredGames = games.filter(game => {
            const categoryMatch = selectedCategory === 'all' || game.categories.includes(selectedCategory);
            const mechanicMatch = selectedMechanic === 'all' || game.mechanics.includes(selectedMechanic);
            return categoryMatch && mechanicMatch;
        });
        categoryFilteredGames = filteredGames.map((game, index) => ({ ...game, categoryRank: index + 1 }));
        currentPage = 1;
        renderPage();
    }

    function applySearch(searchTerm) {
        if (!searchTerm) {
            applyFilter();
        } else {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const searchFilteredGames = categoryFilteredGames.filter(game => game.name.toLowerCase().includes(lowerSearchTerm));
            renderPage(searchFilteredGames);
        }
    }

    function renderPage(filteredGamesToRender = categoryFilteredGames) {
        container.innerHTML = '';
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filteredGamesToRender.slice(start, end);
    
        pageItems.forEach(game => {
            const gameCardWrapper = document.createElement('div');
            gameCardWrapper.classList.add('game-card-wrapper');
    
            const rankNumber = document.createElement('div');
            rankNumber.classList.add('rank-number');
            rankNumber.textContent = game.categoryRank || game.rank || 'Unranked';
    
            const gameCard = document.createElement('div');
            gameCard.classList.add('game');
    
            const gameTitle = document.createElement('h3');
            gameTitle.classList.add('game-title');
            gameTitle.textContent = game.name || 'No Name Provided';
    
            const gameContent = document.createElement('div');
            gameContent.classList.add('game-content');
    
            const gameImg = document.createElement('img');
            gameImg.src = game.thumbnail || 'default-thumbnail.png';
            gameImg.alt = game.name || 'No Image';
    
            const gameInfo = document.createElement('div');
            gameInfo.classList.add('game-info');
    
            const rating = game.bayes_average ? (game.bayes_average).toFixed(1) : (game.average ? (game.average).toFixed(1) : 'Unrated');
            const complexity = game.average_weight ? `<strong>Complexity:</strong> ${(game.average_weight * 2).toFixed(1)} / 10` : '<strong>Complexity:</strong> Unspecified';
            const players = game.min_players && game.max_players ? `<strong>Players:</strong> ${game.min_players} - ${game.max_players}` : '<strong>Players: Unspecified</strong>';
            const playingTime = game.playing_time ? `<strong>Playing Time:</strong> ${game.playing_time} mins` : '<strong>Playing Time: Unspecified</strong>';
            const age = game.age ? `<strong>Recommended Age:</strong> ${game.age}` : '<strong>Recommended Age: Unspecified</strong>';
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
    
            if (categoryFilter.value !== 'all' || mechanicsFilter.value !== 'all') {
                const gameRank = document.createElement('p');
                gameRank.classList.add('game-rank');
                gameRank.innerHTML = `<p class="game-overall"><strong>Overall Rank:</strong> ${game.rank || 'Unranked'}</p>`;
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
    
        renderPagination(filteredGamesToRender);
    
        // Scroll to the top based on the condition
        if (pageNumberSelected) {
            topPagination.scrollIntoView({ behavior: 'instant' });
        } else {
            window.scrollTo(0,0,{ behavior: 'instant' });
        }
    
        // Reset the flag
        pageNumberSelected = false;
    }
    

    function renderPagination(filteredGamesToRender) {
        topPagination.innerHTML = '';
        bottomPagination.innerHTML = '';

        const totalPages = Math.ceil(filteredGamesToRender.length / itemsPerPage);

        const createPaginationContent = (paginationElement) => {
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

            paginationElement.appendChild(pageNumbersDiv);

            const navButtonsDiv = document.createElement('div');
            navButtonsDiv.classList.add('nav-buttons');

            const firstButton = createPaginationButton('First', 1);
            const prevButton = createPaginationButton('Previous', currentPage - 1);
            const nextButton = createPaginationButton('Next', currentPage + 1);
            const lastButton = createPaginationButton('Last', totalPages);

            if (currentPage === 1) {
                firstButton.classList.add('disabled');
                prevButton.classList.add('disabled');
            }

            if (currentPage === totalPages) {
                nextButton.classList.add('disabled');
                lastButton.classList.add('disabled');
            }

            navButtonsDiv.appendChild(firstButton);
            navButtonsDiv.appendChild(prevButton);
            navButtonsDiv.appendChild(nextButton);
            navButtonsDiv.appendChild(lastButton);

            paginationElement.appendChild(navButtonsDiv);

            const pageInfo = document.createElement('div');
            pageInfo.classList.add('page-info');
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            paginationElement.appendChild(pageInfo);
        };

        createPaginationContent(topPagination);
        createPaginationContent(bottomPagination);
    }

    function createPaginationButton(text, page) {
        const button = document.createElement('button');
        button.textContent = text;
        button.addEventListener('click', () => {
            if (!button.classList.contains('disabled')) {
                currentPage = page;
                pageNumberSelected = true; 
                renderPage();
            }
        });
        return button;
    }

    function clearFilters() {
        categoryFilter.value = 'all';
        mechanicsFilter.value = 'all';
        searchInput.value = '';
        itemsPerPageSelect.value = '25';
        itemsPerPage = 25;  // Reset items per page to default
        applyFilter();
    }

    toggleAdvancedSearchButton.addEventListener('click', () => {
        const wasVisible = advancedSearch.style.display === 'block';
        advancedSearch.style.display = wasVisible ? 'none' : 'block';
        if (wasVisible) {
            clearFilters();
        }
    });

    searchInput.addEventListener('input', () => applySearch(searchInput.value));
    clearFiltersButton.addEventListener('click', clearFilters);

    itemsPerPageSelect.addEventListener('change', (event) => {
        itemsPerPage = parseInt(event.target.value, 10);
        currentPage = 1;
        renderPage();
    });

    fetchTotalChunks();
});
