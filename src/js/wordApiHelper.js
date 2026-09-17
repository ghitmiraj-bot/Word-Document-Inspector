/**
 * Wrapper for Office.js Word.run calls to isolate API logic.
 */
const WordApiHelper = {
    getLiveCursorInfo: async function() {
        return Word.run(async (context) => {
            const selection = context.document.getSelection();
            selection.load("text, font/name, font/size, font/bold, font/italic, font/underline, font/color, style");
            
            const paragraph = selection.paragraphs.getFirst();
            paragraph.load("alignment, lineSpacing, spaceBefore, spaceAfter, leftIndent, rightIndent, firstLineIndent, style");
            
            // SYNC 1: Get all native properties safely first
            await context.sync();

            // SYNC 2: Attempt to get OOXML for advanced properties (Rule, Scale, Char Spacing)
            // Fix: We use the Paragraph's range instead of Selection. 
            // Word API throws "GeneralException" if you call getOoxml() on a collapsed (blinking) cursor.
            let advancedProps = { lineSpacingText: "Mixed", charScale: "100%", charSpacing: "Normal" };
            try {
                const paraRange = paragraph.getRange();
                const ooxml = paraRange.getOoxml();
                await context.sync();
                
                if (typeof OOXMLParser !== 'undefined') {
                    advancedProps = OOXMLParser.parseLiveProperties(ooxml.value);
                }
            } catch (err) {
                console.warn("Silent OOXML fallback:", err);
                // The tool will continue functioning perfectly using native properties if this fails
            }

            const ptToInches = (pt) => {
                if (pt === 0 || pt == null) return '0"';
                return (Math.round((pt / 72) * 100) / 100) + '"';
            };

            const fontName = selection.font.name ? selection.font.name : "Mixed";
            const fontSize = selection.font.size ? selection.font.size + " pt" : "Mixed";
            let fontStyle = "Regular";
            if (selection.font.bold && selection.font.italic) fontStyle = "Bold Italic";
            else if (selection.font.bold) fontStyle = "Bold";
            else if (selection.font.italic) fontStyle = "Italic";

            let computedPt = paragraph.lineSpacing ? Math.round(paragraph.lineSpacing * 100) / 100 : 0;
            let formattedLineSpacing = advancedProps.lineSpacingText;
            
            if (formattedLineSpacing === "Mixed" && computedPt > 0) {
                formattedLineSpacing = computedPt + " pt";
            } else if (computedPt > 0 && formattedLineSpacing !== "Mixed") {
                formattedLineSpacing += ` (${computedPt} pt)`;
            }

            let rawLeft = paragraph.leftIndent || 0;
            let rawFirstLine = paragraph.firstLineIndent || 0;
            
            let displayLeft = rawLeft;
            let displaySpecial = "None";

            if (rawFirstLine < 0) {
                displayLeft = rawLeft + rawFirstLine; 
                displaySpecial = "Hanging by " + ptToInches(Math.abs(rawFirstLine));
            } else if (rawFirstLine > 0) {
                displaySpecial = "First Line by " + ptToInches(rawFirstLine);
            }

            return {
                font: {
                    name: fontName,
                    size: fontSize,
                    style: fontStyle,
                    color: selection.font.color || "Mixed",
                    scale: advancedProps.charScale,
                    spacing: advancedProps.charSpacing
                },
                paragraph: {
                    alignment: paragraph.alignment || "Mixed",
                    lineSpacing: formattedLineSpacing,
                    spaceBefore: (paragraph.spaceBefore || 0) + " pt",
                    spaceAfter: (paragraph.spaceAfter || 0) + " pt",
                    style: paragraph.style || "Normal"
                },
                indent: {
                    left: ptToInches(displayLeft),
                    right: ptToInches(paragraph.rightIndent || 0),
                    firstLine: displaySpecial
                }
            };
        });
    },

    getSelectionAnalysis: async function() {
        return Word.run(async (context) => {
            const selection = context.document.getSelection();
            selection.load("text");
            
            const paragraphs = selection.paragraphs;
            paragraphs.load("alignment, lineSpacing, spaceBefore, spaceAfter");

            const ooxml = selection.getOoxml();
            
            await context.sync();

            return {
                text: selection.text,
                ooxml: ooxml.value,
                paragraphs: paragraphs.items.map(p => ({
                    alignment: p.alignment,
                    lineSpacing: p.lineSpacing,
                    spaceBefore: p.spaceBefore,
                    spaceAfter: p.spaceAfter
                }))
            };
        });
    }
};