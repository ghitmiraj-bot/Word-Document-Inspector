/**
 * Dedicated Read-Only OOXML Parser for extremely accurate font and paragraph distribution analysis.
 */
const OOXMLParser = {
    parseRuns: function(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const paragraphs = xmlDoc.getElementsByTagName("w:p");
        
        let runsData = [];

        for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i];
            const runs = p.getElementsByTagName("w:r");
            
            for (let j = 0; j < runs.length; j++) {
                const r = runs[j];
                const textNodes = r.getElementsByTagName("w:t");
                let text = "";
                for (let k = 0; k < textNodes.length; k++) {
                    text += textNodes[k].textContent;
                }

                if (!text.trim()) continue;

                const rPr = r.getElementsByTagName("w:rPr")[0];
                let fontName = "Theme/Default Font"; 
                let fontSize = null;

                if (rPr) {
                    const rFonts = rPr.getElementsByTagName("w:rFonts")[0];
                    if (rFonts) {
                        const csFont = rFonts.getAttribute("w:cs");
                        const asciiFont = rFonts.getAttribute("w:ascii");
                        const hAnsiFont = rFonts.getAttribute("w:hAnsi");
                        
                        if (csFont && /[ঀ-৿]/.test(text)) {
                            fontName = csFont;
                        } else {
                            fontName = asciiFont || hAnsiFont || csFont || fontName;
                        }
                    }

                    const sz = rPr.getElementsByTagName("w:sz")[0];
                    const szCs = rPr.getElementsByTagName("w:szCs")[0];
                    
                    if (szCs && /[ঀ-৿]/.test(text)) {
                        fontSize = parseInt(szCs.getAttribute("w:val")) / 2;
                    } else if (sz) {
                        fontSize = parseInt(sz.getAttribute("w:val")) / 2;
                    }
                }

                runsData.push({
                    text: text,
                    fontName: fontName,
                    fontSize: fontSize || "Default", 
                    wordCount: Utils.countWords(text),
                    charCount: Utils.countCharacters(text)
                });
            }
        }
        return runsData;
    },

    // Extracts Line Spacing Rule, Scale, and Character Spacing from OOXML
    parseLiveProperties: function(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        
        let lineSpacingDisplay = "Single"; 
        let charScale = "100%";
        let charSpacing = "Normal";

        // 1. Paragraph Spacing Rule
        const pPr = xmlDoc.getElementsByTagName("w:pPr")[0];
        if (pPr) {
            const spacing = pPr.getElementsByTagName("w:spacing")[0];
            if (spacing) {
                const lineRule = spacing.getAttribute("w:lineRule") || "auto";
                const lineValStr = spacing.getAttribute("w:line");
                const lineVal = lineValStr ? parseInt(lineValStr, 10) : 240; 
                
                if (lineRule === "exact") {
                    lineSpacingDisplay = "Exactly";
                } else if (lineRule === "atLeast") {
                    lineSpacingDisplay = "At Least";
                } else if (lineRule === "auto") {
                    const multiplier = lineVal / 240;
                    if (multiplier === 1) lineSpacingDisplay = "Single";
                    else if (multiplier === 1.5) lineSpacingDisplay = "1.5 Lines";
                    else if (multiplier === 2) lineSpacingDisplay = "Double";
                    else lineSpacingDisplay = "Multiple at " + (Math.round(multiplier * 100) / 100);
                }
            }
        }

        // 2. Character Spacing & Scale
        const rPr = xmlDoc.getElementsByTagName("w:rPr")[0];
        if (rPr) {
            const w = rPr.getElementsByTagName("w:w")[0];
            if (w) {
                charScale = w.getAttribute("w:val") + "%";
            }
            
            const spacing = rPr.getElementsByTagName("w:spacing")[0];
            if (spacing) {
                const valStr = spacing.getAttribute("w:val");
                if (valStr) {
                    const val = parseInt(valStr, 10);
                    if (val > 0) {
                        charSpacing = "Expanded by " + (val / 20) + " pt";
                    } else if (val < 0) {
                        charSpacing = "Condensed by " + (Math.abs(val) / 20) + " pt";
                    }
                }
            }
        }

        return {
            lineSpacingText: lineSpacingDisplay,
            charScale: charScale,
            charSpacing: charSpacing
        };
    }
};