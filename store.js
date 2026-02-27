/**
 * Barakah Store - State management via LocalStorage
 */

export const Store = {
    // Получить данные для конкретного дня
    getDayData(dateString) {
        const data = localStorage.getItem(`barakah_day_${dateString}`);
        return data ? JSON.parse(data) : { tasks: {}, texts: {} };
    },

    // Сохранить данные для конкретного дня
    saveDayData(dateString, data) {
        localStorage.setItem(`barakah_day_${dateString}`, JSON.stringify(data));
    },

    // Получить глобальные цели
    getGoals() {
        const goals = localStorage.getItem('barakah_goals');
        return goals ? JSON.parse(goals) : {};
    },

    // Сохранить глобальные цели
    saveGoals(goals) {
        localStorage.setItem('barakah_goals', JSON.stringify(goals));
    }
};
