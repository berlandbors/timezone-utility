// Инициализация элементов и опций
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

    // Поиск по названию города/страны
    searchInput.addEventListener('input', () => {
        const searchText = searchInput.value.toLowerCase();
        const options = timezoneSelect.options;

        for (let i = 0; i < options.length; i++) {
            const optionText = options[i].textContent.toLowerCase();
            options[i].style.display = optionText.includes(searchText) ? 'block' : 'none';
        }
    });

    // Конвертация времени по выбранному часовому поясу
    convertButton.addEventListener('click', () => {
        const timeZone = timezoneSelect.value;
        if (timeZone) {
            const localTime = new Date();
            const options = {
                timeZone: timeZone,
                hour12: false, // 24-часовой формат
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            };
            convertedTimeElement.textContent = `Time in ${timeZone}: ${localTime.toLocaleString('en-GB', options)}`;
        } else {
            convertedTimeElement.textContent = 'Please select a time zone.';
        }
    });
});
