export const BONUS_TYPES = Object.freeze({
    SHIELD: {
        name: 'shield', emoji: '🛡️', duration: 10000, color: '#2196F3',
        displayName: 'Щит',
        description: 'Полная неуязвимость на 10 секунд'
    },
    TRIPLE: {
        name: 'triple', emoji: '⚡', duration: 15000, color: '#FFEB3B',
        displayName: 'Тройной выстрел',
        description: '3 снаряда в разных направлениях за один выстрел'
    },
    RICOCHET: {
        name: 'ricochet', emoji: '🔄', duration: 12000, color: '#9C27B0',
        displayName: 'Рикошет',
        description: 'Снаряды отскакивают от любых стен (до 10 раз)'
    },
    STAR: {
        name: 'star', emoji: '⭐', duration: 15000, color: '#FFC107',
        displayName: 'Звезда скорости',
        description: 'Ускорение танка и пуль на 15 секунд'
    },
    GRENADE: {
        name: 'grenade', emoji: '💣', duration: 0, color: '#F44336',
        displayName: 'Граната',
        description: 'Мгновенно уничтожает всех врагов на поле'
    },
    LIFE: {
        name: 'life', emoji: '❤️', duration: 0, color: '#E91E63',
        displayName: 'Доп. жизнь',
        description: '+1 дополнительная жизнь'
    }
});