const UI = {
    setStatus: function(text, isAnalyzing = false) {
        document.getElementById("status-text").innerText = text;
        const dot = document.getElementById("status-indicator");
        if (isAnalyzing) dot.classList.add("analyzing");
        else dot.classList.remove("analyzing");
    },

    formatValue: function(val) {
        if (val === "Mixed" || val === "") return `<span class="badge-mixed">Mixed</span>`;
        if (val === "null" || val === null) return "Default";
        return val;
    },

    updateLiveTab: function(data) {
        const safeSet = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = this.formatValue(val);
        };

        safeSet("live-font-name", data.font.name);
        safeSet("live-font-size", data.font.size);
        safeSet("live-font-style", data.font.style);
        safeSet("live-font-color", data.font.color);
        safeSet("live-font-scale", data.font.scale);
        safeSet("live-font-spacing", data.font.spacing);

        safeSet("live-para-align", data.paragraph.alignment);
        safeSet("live-para-linespace", data.paragraph.lineSpacing);
        safeSet("live-para-before", data.paragraph.spaceBefore);
        safeSet("live-para-after", data.paragraph.spaceAfter);
        safeSet("live-para-style", data.paragraph.style);

        safeSet("live-indent-left", data.indent.left);
        safeSet("live-indent-right", data.indent.right);
        safeSet("live-indent-first", data.indent.firstLine);
    },

    updateSelectionTab: function(data) {
        document.getElementById("sel-words").innerText = data.summary.words;
        document.getElementById("sel-chars").innerText = data.summary.chars;
        document.getElementById("sel-paras").innerText = data.summary.paragraphs;

        const renderDist = (arr, labelSuffix) => arr.map(item => `
            <div class="dist-item">
                <div class="dist-item-details">
                    <div>${item.name}</div>
                    <div class="dist-bar" style="width: ${item.pct || '100%'}"></div>
                </div>
                <div class="dist-item-stats">
                    ${item.words || item.count} ${labelSuffix}<br/>
                    ${item.pct ? item.pct : ''}
                </div>
            </div>
        `).join('');

        const fontDist = document.getElementById("sel-font-dist");
        if(fontDist) fontDist.innerHTML = renderDist(data.fonts, "words");
        
        const sizeDist = document.getElementById("sel-font-size-dist");
        if(sizeDist) sizeDist.innerHTML = renderDist(data.fontSizes, "words");
        
        const alignDist = document.getElementById("sel-align-dist");
        if(alignDist) alignDist.innerHTML = renderDist(data.alignments, "paras");
    },

    updateAuditTab: function(auditResults) {
        const container = document.getElementById("audit-results");
        if (!container) return;
        
        if (auditResults.length === 0) {
            container.innerHTML = "<em>No inconsistencies found.</em>";
            return;
        }

        container.innerHTML = auditResults.map(res => `
            <div class="audit-section">
                <div class="audit-title">${res.category}</div>
                <div class="audit-dominant">✓ ${res.dominant}</div>
                ${res.exceptions.map(e => `<div class="audit-exception">⚠ Exception: ${e}</div>`).join('')}
            </div>
        `).join('');
    }
};