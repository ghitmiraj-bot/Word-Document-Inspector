const Utils = {
    /** Unicode-aware word count handling Bangla, English, Numbers */
    countWords: function(text) {
        if (!text) return 0;
        // Match standard whitespace and punctuation as delimiters. 
        // Note: '।' (dari) is Bengali full stop (\u0964).
        const words = text.trim().split(/[\s,.;:!?"'()[\]{}।\n\r\t]+/);
        return words.filter(w => w.length > 0).length;
    },
    
    countCharacters: function(text, excludeSpaces = false) {
        if (!text) return 0;
        if (excludeSpaces) return text.replace(/\s+/g, '').length;
        return text.length;
    },

    calculatePercentage: function(value, total) {
        if (total === 0) return "0%";
        return ((value / total) * 100).toFixed(1) + "%";
    }
};