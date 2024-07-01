document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('game-list');
    const topPagination = document.getElementById('top-pagination');
    const bottomPagination = document.getElementById('bottom-pagination');
    const categoryFilter = document.getElementById('category-filter');
    const mechanicsFilter = document.getElementById('mechanics-filter');
    const publisherFilter = document.getElementById('publisher-filter');
    const searchInput = document.getElementById('search-input');
    const toggleAdvancedSearchButton = document.getElementById('toggle-advanced-search');
    const advancedSearch = document.getElementById('advanced-search');
    const clearFiltersButton = document.getElementById('clear-filters');
    const itemsPerPageSelect = document.getElementById('items-per-page');
    const categoryFilterInput = document.getElementById('category-filter-input');
    const mechanicsFilterInput = document.getElementById('mechanics-filter-input');
    const publisherFilterInput = document.getElementById('publisher-filter-input');
    const categorySuggestions = document.getElementById('category-suggestions');
    const mechanicsSuggestions = document.getElementById('mechanics-suggestions');
    const publisherSuggestions = document.getElementById('publisher-suggestions');
    let currentPage = 1;
    let itemsPerPage = 25;  
    const maxPageButtons = 5;
    let games = [];
    let filteredGames = [];
    let categoryFilteredGames = [];
    let allCategories = [];
    let allMechanics = [];
    let allPublishers = [];

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
                    mechanics: game.mechanics ? game.mechanics.split(',').map(m => m.trim()) : [],
                    publishers: game.publishers ? game.publishers.split(',').map(p => p.trim()) : []
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
        allCategories = [...new Set(games.flatMap(game => game.categories || []))].sort((a, b) => a.localeCompare(b));
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        allMechanics = [...new Set(games.flatMap(game => game.mechanics || []))].sort((a, b) => a.localeCompare(b));
        allMechanics.forEach(mechanic => {
            const option = document.createElement('option');
            option.value = mechanic;
            option.textContent = mechanic;
            mechanicsFilter.appendChild(option);
        });

        const publisherCounts = games.reduce((acc, game) => {
            game.publishers.forEach(publisher => {
                if (!acc[publisher]) {
                    acc[publisher] = 0;
                }
                acc[publisher]++;
            });
            return acc;
        }, {});

        allPublishers = Object.keys(publisherCounts).sort((a, b) => publisherCounts[b] - publisherCounts[a]);
        allPublishers.forEach(publisher => {
            const option = document.createElement('option');
            option.value = publisher;
            option.textContent = publisher.length > 20 ? `${publisher.slice(0, 17)}...` : publisher;
            option.title = publisher;
            publisherFilter.appendChild(option);
        });
    }

    categoryFilterInput.addEventListener('input', () => {
        if (categoryFilterInput.value === '') {
            categorySuggestions.innerHTML = '';
        } else {
            showSuggestions(categoryFilterInput.value, categorySuggestions, allCategories, setCategoryFilter);
        }
    });

    mechanicsFilterInput.addEventListener('input', () => {
        if (mechanicsFilterInput.value === '') {
            mechanicsSuggestions.innerHTML = '';
        } else {
            showSuggestions(mechanicsFilterInput.value, mechanicsSuggestions, allMechanics, setMechanicFilter);
        }
    });

    publisherFilterInput.addEventListener('input', () => {
        if (publisherFilterInput.value === '') {
            publisherSuggestions.innerHTML = '';
        } else {
            showSuggestions(publisherFilterInput.value, publisherSuggestions, allPublishers, setPublisherFilter);
        }
    });

    function showSuggestions(input, suggestionsContainer, options, setFilterFunction) {
        suggestionsContainer.innerHTML = '';
        const filteredOptions = options.filter(option => option.toLowerCase().includes(input.toLowerCase())).slice(0, 5);
        filteredOptions.forEach(option => {
            const suggestionElement = document.createElement('div');
            suggestionElement.textContent = option.length > 20 ? `${option.slice(0, 17)}...` : option;
            suggestionElement.title = option;
            suggestionElement.addEventListener('click', () => {
                setFilterFunction(option);
                suggestionsContainer.innerHTML = '';
            });
            suggestionsContainer.appendChild(suggestionElement);
        });
    }

    function setCategoryFilter(category) {
        categoryFilter.value = category;
        categoryFilterInput.value = category;
        applyFilter();
    }

    function setMechanicFilter(mechanic) {
        mechanicsFilter.value = mechanic;
        mechanicsFilterInput.value = mechanic;
        applyFilter();
    }

    function setPublisherFilter(publisher) {
        publisherFilter.value = publisher;
        publisherFilterInput.value = publisher;
        applyFilter();
    }

    document.addEventListener('click', function(event) {
        if (!categoryFilterInput.contains(event.target) && !categorySuggestions.contains(event.target)) {
            categorySuggestions.innerHTML = '';
        }
        if (!mechanicsFilterInput.contains(event.target) && !mechanicsSuggestions.contains(event.target)) {
            mechanicsSuggestions.innerHTML = '';
        }
        if (!publisherFilterInput.contains(event.target) && !publisherSuggestions.contains(event.target)) {
            publisherSuggestions.innerHTML = '';
        }
    });

    categoryFilter.addEventListener('change', applyFilter);
    mechanicsFilter.addEventListener('change', applyFilter);
    publisherFilter.addEventListener('change', applyFilter);

    function applyFilter() {
        const selectedCategory = categoryFilter.value;
        const selectedMechanic = mechanicsFilter.value;
        const selectedPublisher = publisherFilter.value;
        const minComplexity = minComplexityFilter.value ? parseFloat(minComplexityFilter.value) : 0;
        const maxComplexity = maxComplexityFilter.value ? parseFloat(maxComplexityFilter.value) : 10;
        
        filteredGames = games.filter(game => {
            const categoryMatch = selectedCategory === 'all' || game.categories.includes(selectedCategory);
            const mechanicMatch = selectedMechanic === 'all' || game.mechanics.includes(selectedMechanic);
            const publisherMatch = selectedPublisher === 'all' || game.publishers.includes(selectedPublisher);
            const complexitySpecified = game.average_weight !== undefined && game.average_weight !== null;
            const complexityMatch = complexitySpecified && (game.average_weight * 2 >= minComplexity && game.average_weight * 2 <= maxComplexity);
            return categoryMatch && mechanicMatch && publisherMatch && (!minComplexityFilter.value && !maxComplexityFilter.value ? true : complexityMatch);
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
    
            if (categoryFilter.value !== 'all' || mechanicsFilter.value !== 'all' || publisherFilter.value !== 'all' || minComplexityFilter.value != '' || maxComplexityFilter.value != '') {
                const gameRank = document.createElement('p');
                gameRank.classList.add('game-rank');
                gameRank.innerHTML = `<p class="game-overall"><strong>Overall Rank:</strong> ${game.rank || 'Unranked'}</p>`;
                gameInfo.appendChild(gameRank);
            }

            gameCard.addEventListener('click', () => handleGameClick(game));
    
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
        window.scrollTo(0,0,{ behavior: 'instant' });
    
        // Reset the flag
        pageNumberSelected = false;
    }

    function renderPagination(filteredGamesToRender) {
        topPagination.innerHTML = '';
        bottomPagination.innerHTML = '';

        const totalPages = Math.ceil(filteredGamesToRender.length / itemsPerPage);
        const totalGames = filteredGamesToRender.length;

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

            const totalGamesInfo = document.createElement('div');
            totalGamesInfo.classList.add('total-games-info');
            totalGamesInfo.textContent = `Total Games: ${totalGames}`;
            paginationElement.appendChild(totalGamesInfo);

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
        publisherFilter.value = 'all';
        searchInput.value = '';
        categoryFilterInput.value = '';
        mechanicsFilterInput.value = '';
        publisherFilterInput.value = '';
        categorySuggestions.innerHTML = '';
        mechanicsSuggestions.innerHTML = '';
        publisherSuggestions.innerHTML = '';
        itemsPerPageSelect.value = '25';
        itemsPerPage = 25;  
        minComplexityFilter.value = '';
        maxComplexityFilter.value = '';
        applyComplexityFilter(); 
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

    const backToTopButton = document.getElementById('back-to-top');
    
    // Show the button when the user scrolls down 20px from the top
    window.onscroll = function() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            backToTopButton.style.display = "block";
        } else {
            backToTopButton.style.display = "none";
        }
    };
    
    // Scroll to the top of the document when the button is clicked
    backToTopButton.addEventListener('click', function() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE, and Opera
    });

   
    const minComplexityFilter = document.getElementById('min-complexity-filter');
    const maxComplexityFilter = document.getElementById('max-complexity-filter');
    
    function applyComplexityFilter() {
        const minComplexity = minComplexityFilter.value ? parseInt(minComplexityFilter.value) : 0;
        const maxComplexity = maxComplexityFilter.value ? parseInt(maxComplexityFilter.value) : 10;
        
        if (minComplexity > maxComplexity) return;
        
        maxComplexityFilter.querySelectorAll('option').forEach(option => {
            option.disabled = parseInt(option.value) < minComplexity;
        });
        
        minComplexityFilter.querySelectorAll('option').forEach(option => {
            option.disabled = parseInt(option.value) > maxComplexity;
        });
    }
    
    minComplexityFilter.addEventListener('change', () => {
        applyComplexityFilter();
        applyFilter();
    });
    
    maxComplexityFilter.addEventListener('change', () => {
        applyComplexityFilter();
        applyFilter();
    });
    
        
    function handleGameClick(game) {
        const queryParams = new URLSearchParams({
            id: game.id
        });
        window.location.href = `game.html?${queryParams.toString()}`;
    }
 
    
});
