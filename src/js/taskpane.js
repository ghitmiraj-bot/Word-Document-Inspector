let debounceTimer;
let currentMode = "LIVE";

Office.onReady((info) => {
    if (info.host === Office.HostType.Word) {
        document.getElementById("btn-refresh").onclick = refreshData;
        setupTabs();
        
        Office.context.document.addHandlerAsync(
            Office.EventType.DocumentSelectionChanged,
            onSelectionChanged
        );
        
        UI.setStatus("Live");
        refreshData();
    }
});

function setupTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
            
            tab.classList.add("active");
            document.getElementById(tab.getAttribute("data-target")).classList.add("active");
            
            currentMode = tab.getAttribute("data-target") === "tab-live" ? "LIVE" : "SELECTION";
            refreshData(); 
        });
    });
}

function onSelectionChanged() {
    clearTimeout(debounceTimer);
    UI.setStatus("Selection changed...", true);
    debounceTimer = setTimeout(() => {
        refreshData();
    }, 500); 
}

async function refreshData() {
    try {
        UI.setStatus("Analyzing...", true);

        if (currentMode === "LIVE") {
            const liveData = await WordApiHelper.getLiveCursorInfo();
            UI.updateLiveTab(liveData);
            UI.setStatus("Live");
        } else {
            const apiData = await WordApiHelper.getSelectionAnalysis();
            if (apiData.text.trim().length === 0) {
                UI.setStatus("No text selected.");
                return;
            }
            const analysis = SelectionAnalyzer.analyze(apiData);
            UI.updateSelectionTab(analysis);
            
            const auditData = AuditEngine.runAudit(analysis);
            UI.updateAuditTab(auditData);
            
            UI.setStatus("Selection Analyzed");
        }
    } catch (error) {
        console.error(error);
        const errorMsg = error instanceof Error ? error.message : "Unknown Error";
        UI.setStatus("Err: " + errorMsg.substring(0, 30));
    }
}