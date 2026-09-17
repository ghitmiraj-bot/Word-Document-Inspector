/**
 * Processes data fetched from wordApiHelper and parses it for the UI and Audit models.
 */
const SelectionAnalyzer = {
    analyze: function(apiData) {
        const ooxmlRuns = OOXMLParser.parseRuns(apiData.ooxml);
        
        let totalWords = 0;
        let totalChars = 0;
        
        let fontDist = {};
        let fontSizeDist = {};
        let alignDist = {};

        // 1. Analyze Runs (Fonts & Sizes)
        ooxmlRuns.forEach(run => {
            if (run.wordCount === 0) return;
            totalWords += run.wordCount;
            totalChars += run.charCount;

            // Font Name Only
            if (!fontDist[run.fontName]) fontDist[run.fontName] = 0;
            fontDist[run.fontName] += run.wordCount;

            // Font + Size
            const fsk = `${run.fontName} ${run.fontSize === 'Default' ? '' : run.fontSize + 'pt'}`;
            if (!fontSizeDist[fsk]) fontSizeDist[fsk] = { count: 0, font: run.fontName, size: run.fontSize };
            fontSizeDist[fsk].count += run.wordCount;
        });

        // 2. Analyze Paragraphs
        apiData.paragraphs.forEach(p => {
            const align = p.alignment || "Unknown";
            if (!alignDist[align]) alignDist[align] = 0;
            alignDist[align]++;
        });

        // Formatting arrays for sorting
        const fontArr = Object.keys(fontDist).map(k => ({
            name: k,
            words: fontDist[k],
            pct: Utils.calculatePercentage(fontDist[k], totalWords)
        })).sort((a, b) => b.words - a.words);

        const fontSizeArr = Object.keys(fontSizeDist).map(k => ({
            name: k,
            words: fontSizeDist[k].count,
            pct: Utils.calculatePercentage(fontSizeDist[k].count, totalWords)
        })).sort((a, b) => b.words - a.words);
        
        const alignArr = Object.keys(alignDist).map(k => ({
            name: k,
            count: alignDist[k]
        })).sort((a, b) => b.count - a.count);

        return {
            summary: {
                words: totalWords,
                chars: totalChars,
                paragraphs: apiData.paragraphs.length
            },
            fonts: fontArr,
            fontSizes: fontSizeArr,
            alignments: alignArr
        };
    }
};