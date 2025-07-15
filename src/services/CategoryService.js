class CategoryService {
    static categories = {
        // Income categories
        'Gaji': { icon: '💰', color: '#10b981', type: 'pemasukan' },
        'Uang Saku': { icon: '💵', color: '#3b82f6', type: 'pemasukan' },
        'Hadiah': { icon: '🎁', color: '#8b5cf6', type: 'pemasukan' },
        'Investasi': { icon: '📈', color: '#06b6d4', type: 'pemasukan' },
        'Freelance': { icon: '💻', color: '#f59e0b', type: 'pemasukan' },
        // Expense categories
        'Makanan': { icon: '🍔', color: '#ef4444', type: 'pengeluaran' },
        'Transportasi': { icon: '🚗', color: '#f59e0b', type: 'pengeluaran' },
        'Belanja': { icon: '🛒', color: '#3b82f6', type: 'pengeluaran' },
        'Hiburan': { icon: '🎬', color: '#8b5cf6', type: 'pengeluaran' },
        'Kesehatan': { icon: '🏥', color: '#06b6d4', type: 'pengeluaran' },
        'Pendidikan': { icon: '📚', color: '#10b981', type: 'pengeluaran' },
        'Tagihan': { icon: '📄', color: '#ef4444', type: 'pengeluaran' },
        'Lain-lain': { icon: '💸', color: '#6b7280', type: 'both' }
    };

    static async getAllCategories() {
        // Convert from object to array
        return Object.entries(this.categories).map(([nama, data]) => ({
            nama,
            icon: data.icon,
            color: data.color,
            type: data.type
        }));
    }

    static getCategoryDisplay(categoryName) {
        const defaultDisplay = { icon: '💸', color: '#6b7280' };

        if (this.categories[categoryName]) {
            return {
                icon: this.categories[categoryName].icon,
                color: this.categories[categoryName].color
            };
        }

        return defaultDisplay;
    }

    static getCategoriesByType(type) {
        if (!type || type === '') {
            return this.getAllCategories();
        }

        const filteredCategories = Object.entries(this.categories)
            .filter(([_, data]) => data.type === type || data.type === 'both')
            .map(([nama, data]) => ({
                nama,
                icon: data.icon,
                color: data.color,
                type: data.type
            }));

        return filteredCategories;
    }
}

export default CategoryService;