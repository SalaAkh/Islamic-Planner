/**
 * Barakah Store - State management via LocalStorage
 */

const Store = {
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
    },

    // Получить данные доски (Tafakkur Board)
    getBoardData() {
        const board = localStorage.getItem('barakah_board_state');
        return board ? JSON.parse(board) : {
            notes: [], // Array of objects
            viewport: { x: 0, y: 0, zoom: 1 } // Save user's last position
        };
    },

    // Сохранить данные доски
    saveBoardData(boardData) {
        localStorage.setItem('barakah_board_state', JSON.stringify(boardData));
    }
};
