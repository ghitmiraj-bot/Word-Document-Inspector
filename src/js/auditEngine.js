/**
 * Analyzes the SelectionAnalyzer output to find formatting inconsistencies.
 */
const AuditEngine = {
    runAudit: function(analysisData) {
        let results = [];

        // 1. Font Audit
        if (analysisData.fonts.length > 1) {
            const dominant = analysisData.fonts[0];
            let exceptions = analysisData.fonts.slice(1);
            
            results.push({
                category: "Font Consistency",
                dominant: `${dominant.name} (${dominant.pct} of words)`,
                exceptions: exceptions.map(e => `${e.name} (${e.words} words, ${e.pct})`)
            });
        } else if (analysisData.fonts.length === 1) {
            results.push({
                category: "Font Consistency",
                dominant: `${analysisData.fonts[0].name} is consistently used.`,
                exceptions: []
            });
        }

        // 2. Paragraph Alignment Audit
        if (analysisData.alignments.length > 1) {
            const dominant = analysisData.alignments[0];
            let exceptions = analysisData.alignments.slice(1);

            results.push({
                category: "Paragraph Alignment",
                dominant: `${dominant.name} (${dominant.count} paragraphs)`,
                exceptions: exceptions.map(e => `${e.name} (${e.count} paras)`)
            });
        }

        return results;
    }
};