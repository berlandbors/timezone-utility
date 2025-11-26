document.addEventListener('DOMContentLoaded', () => {
    const localTimeElement = document.getElementById('localTime');
    const timezoneSelect = document.getElementById('timezoneSelect');
    const convertedTimeElement = document.getElementById('convertedTime');
    const convertButton = document.getElementById('convertButton');
    const searchInput = document.getElementById('searchInput');

    // Функция для отображения локального времени
    function updateLocalTime() {
        const now = new Date();
        const options = {
            hour12: false, // 24-часовой формат
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        };
        localTimeElement.textContent = now.toLocaleString('en-GB', options);
    }
    updateLocalTime();
    setInterval(updateLocalTime, 1000);

    // Заполнение списка часовых поясов
    const timezones = Intl.supportedValuesOf('timeZone');
    timezones.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        timezoneSelect.appendChild(option);
    });

    // Функция поиска города или страны
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        const options = timezoneSelect.options;

        for (const option of options) {
            if (option.textContent.toLowerCase().includes(query)) {
                option.style.display = ''; // Показывать совпадающие элементы
            } else {
                option.style.display = 'none'; // Скрывать неподходящие элементы
            }
        }
    });

    // Конвертация местного времени в выбранный часовой пояс
    convertButton.addEventListener('click', () => {
        const selectedTimezone = timezoneSelect.value;
        if (selectedTimezone) {
            const now = new Date();
            const options = {
                timeZone: selectedTimezone,
                hour12: false, // 24-часовой формат
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            };
            convertedTimeElement.textContent = `Time in ${selectedTimezone}: ${now.toLocaleString('en-GB', options)}`;
        } else {
            convertedTimeElement.textContent = 'Please select a time zone.';
        }
    });
});
