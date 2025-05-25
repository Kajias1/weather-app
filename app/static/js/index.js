document.addEventListener('DOMContentLoaded', () => {
    const availableCityNames = [
        "Москва",
        "Санкт-Петербург",
        "Новосибирск",
        "Екатеринбург",
        "Нижний Новгород",
        "Казань",
        "Челябинск",
        "Омск",
        "Самара",
        "Ростов-на-Дону",
        "Уфа",
        "Красноярск",
        "Пермь",
        "Воронеж",
        "Волгоград",
        "Краснодар",
        "Саратов",
        "Тюмень",
        "Тольятти",
        "Ижевск",
        "Барнаул",
        "Ульяновск",
        "Иркутск",
        "Хабаровск",
        "Ярославль",
        "Владивосток",
        "Махачкала",
        "Томск",
        "Оренбург",
        "Кемерово",
        "Новокузнецк",
        "Рязань",
        "Астрахань",
        "Набережные Челны",
        "Пенза",
        "Липецк",
        "Киров",
        "Чебоксары",
        "Тула",
        "Калининград",
        "Брянск",
        "Иваново",
        "Магнитогорск",
        "Белгород",
        "Сочи",
        "Владимир",
        "Архангельск",
        "Череповец"
    ];

    const weatherCodeToEmoji = {
        0: "☀️",
        1: "🌤️",
        2: "⛅",
        3: "☁️",
        51: "🌧️",
        61: "🌦️",
        80: "⛈️",
    };

    const maxCities = 5;
    const storageKey = 'savedCities';

    function addCityToStorage(city) {
        let cities = JSON.parse(localStorage.getItem(storageKey)) || [];

        cities = cities.filter(c => c.toLowerCase() !== city.toLowerCase());

        cities.unshift(city);

        if (cities.length > maxCities) {
            cities = cities.slice(0, maxCities);
        }

        localStorage.setItem(storageKey, JSON.stringify(cities));
    }

    function loadCitiesFromStorage() {
        return JSON.parse(localStorage.getItem(storageKey)) || [];
    }

    function fillForecastGrid(data) {
        const monthTranslationsShort = {
            0: "Янв",
            1: "Фев",
            2: "Мар",
            3: "Апр",
            4: "Май",
            5: "Июнь",
            6: "Июль",
            7: "Авг",
            8: "Сен",
            9: "Окт",
            10: "Ноя",
            11: "Дек"
        };

        const grid = document.querySelector('.forecast-grid');
        grid.innerHTML = '';

        for (let i = 0; i < data.daily.time.length; i++) {
            const dateStr = data.daily.time[i];
            const weatherCode = data.daily.weather_code[i];

            const dateObj = new Date(dateStr);
            const day = dateObj.getDate();
            const monthRu = monthTranslationsShort[dateObj.getMonth()] || '';

            const formattedDate = `${monthRu} ${day}`;

            const weatherEmoji = weatherCodeToEmoji[weatherCode] || "☀️";

            const card = document.createElement('div');
            card.classList.add('forecast-card');
            card.innerHTML = `
            <div class="date">${formattedDate}</div>
            <div class="weather-code">${weatherEmoji}</div>
        `;

            grid.appendChild(card);
        }
    }


    const cityNameSearchBar = document.getElementById('city-name-search-input');
    const cityNameSearchDropdown = document.getElementById('city-name-search-dropdown');
    const cityNameSearchSubmitButton = document.getElementById('city-name-search-input-submit-button');
    const loading = document.getElementById('loading');
    const savedCities = loadCitiesFromStorage();

    cityNameSearchBar.value = '';

    document.addEventListener('click', (event) => {
        if (!cityNameSearchBar.contains(event.target) && !cityNameSearchDropdown.contains(event.target)) {
            cityNameSearchDropdown.classList.remove('show');
            cityNameSearchBar.classList.remove('adjust');
        }
    });

    cityNameSearchBar.addEventListener('focus', () => {
        cityNameSearchDropdown.innerHTML = '';

        if (savedCities.length > 0) {
            savedCities.forEach(city => {
                const div = document.createElement('div');
                div.classList.add('dropdown-entry');
                div.textContent = city;

                div.addEventListener('click', () => {
                    cityNameSearchBar.value = city;
                    cityNameSearchDropdown.classList.remove('show');
                    cityNameSearchBar.classList.remove('adjust');
                });

                cityNameSearchDropdown.appendChild(div);
            });

            cityNameSearchBar.classList.add('adjust');
            cityNameSearchDropdown.classList.add('show');
        } else {
            cityNameSearchBar.classList.remove('adjust');
            cityNameSearchDropdown.classList.remove('show');
        }
    });


    cityNameSearchBar.addEventListener('keyup', () => {
        const inputValue = cityNameSearchBar.value.trim().toLowerCase();

        if (inputValue !== '') {
            const filteredCities = availableCityNames.filter(city =>
                city.toLowerCase().includes(inputValue)
            );

            cityNameSearchDropdown.innerHTML = '';

            if (filteredCities.length > 0) {
                filteredCities.forEach(city => {
                    const div = document.createElement('div');
                    div.classList.add('dropdown-entry');
                    div.textContent = city;

                    div.addEventListener('click', () => {
                        cityNameSearchBar.value = city;
                        cityNameSearchDropdown.classList.remove('show');
                        cityNameSearchBar.classList.remove('adjust');
                    });

                    cityNameSearchDropdown.appendChild(div);
                });

                cityNameSearchBar.classList.add('adjust');
                cityNameSearchDropdown.classList.add('show');
            } else {
                cityNameSearchBar.classList.remove('adjust');
                cityNameSearchDropdown.classList.remove('show');
            }
        } else {
            cityNameSearchBar.classList.remove('adjust');
            cityNameSearchDropdown.classList.remove('show');
            cityNameSearchDropdown.innerHTML = '';
        }
    });

    cityNameSearchSubmitButton.addEventListener('click', () => {
        const inputValue = cityNameSearchBar.value.trim();

        if (inputValue !== '') {
            loading.style.display = 'block';
            addCityToStorage(inputValue);

            fetch(`/api/get_weather/${encodeURIComponent(inputValue)}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Weather data:', data);
                    fillForecastGrid(data);
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                })
                .finally(() => {
                    loading.style.display = 'none';  // hide loading gif when done (success or error)
                });
        }
    });
});
