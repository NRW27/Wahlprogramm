(() => {
    'use strict';

    // ==========================================
    // 1. ZENTRALE KONFIGURATION
    // ==========================================
    const KONFIGURATION = {
        anbieter: {
            chatgpt: { name: "ChatGPT", url: "https://chatgpt.com/" },
            claude:  { name: "Claude",  url: "https://claude.ai/" },
            grok:    { name: "Grok",    url: "https://grok.com/" }
        },
        kandidaten: {
            p1: { name: "Jolin Althoff", bild: "Portraits/P1.png", promptHinweis: "" },
            p2: { name: "Halil Izci",    bild: "Portraits/P2.png", promptHinweis: "" },
            p3: { name: "Pia Waschko",   bild: "Portraits/P3.png", promptHinweis: "" }
        },
        standardAnbieter: "chatgpt",
        standardKandidat: "p1"
    };

    // ==========================================
    // 2. STATE (Aktueller Zustand)
    // ==========================================
    let aktuellerAnbieter = KONFIGURATION.standardAnbieter;
    let aktuellerKandidat = KONFIGURATION.standardKandidat;

    // ==========================================
    // 3. DOM ELEMENTE
    // ==========================================
    const providerGroup = document.getElementById('provider-group');
    const candidateGroup = document.getElementById('candidate-group');
    const ctaButton = document.getElementById('wp-start-chat-btn');

    // ==========================================
    // 4. RENDER-FUNKTIONEN
    // ==========================================
    
    /**
     * Rendert die Auswahlbuttons für KI-Anbieter
     */
    function renderProviders() {
        providerGroup.innerHTML = '';
        Object.entries(KONFIGURATION.anbieter).forEach(([key, data]) => {
            const label = document.createElement('label');
            label.className = 'wp-provider-label';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'wp-provider';
            input.value = key;
            input.className = 'wp-sr-only wp-provider-input';
            if (key === aktuellerAnbieter) {
                input.checked = true;
            }

            const span = document.createElement('span');
            span.className = 'wp-provider-btn';
            span.textContent = data.name;

            label.appendChild(input);
            label.appendChild(span);
            providerGroup.appendChild(label);

            input.addEventListener('change', (e) => {
                aktuellerAnbieter = e.target.value;
                updateCTA();
            });
        });
    }

    /**
     * Rendert die animierten und überlappenden Kandidatenportraits
     */
    function renderCandidates() {
        candidateGroup.innerHTML = '';
        
        // Wrapper wird für das Flex-Layout (nebeneinander & Überlappung) benötigt
        const wrapper = document.createElement('div');
        wrapper.className = 'wp-candidate-wrapper';

        Object.entries(KONFIGURATION.kandidaten).forEach(([key, data], index) => {
            const label = document.createElement('label');
            label.className = 'wp-candidate-label';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'wp-candidate';
            input.value = key;
            input.className = 'wp-sr-only wp-candidate-input';
            if (key === aktuellerKandidat) {
                input.checked = true;
            }

            // Visueller Container für Bild und Text
            const visual = document.createElement('div');
            visual.className = 'wp-candidate-visual';
            
            const img = document.createElement('img');
            img.src = data.bild;
            img.alt = `Portrait von ${data.name}`;
            img.className = 'wp-candidate-img';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'wp-candidate-name';
            nameSpan.textContent = data.name;

            visual.appendChild(img);
            
            label.appendChild(input);
            label.appendChild(visual);
            label.appendChild(nameSpan);
            wrapper.appendChild(label);

            input.addEventListener('change', (e) => {
                aktuellerKandidat = e.target.value;
                updateCandidateStyles();
                updateCTA();
            });
        });
        
        candidateGroup.appendChild(wrapper);
        updateCandidateStyles(); // Initialen "Active"-Zustand setzen
    }

    /**
     * Aktualisiert die visuelle Hervorhebung des gewählten Kandidaten
     */
    function updateCandidateStyles() {
        const labels = candidateGroup.querySelectorAll('.wp-candidate-label');
        
        // Finde den aktuell ausgewählten Index für die Z-Index Berechnung
        let activeIndex = 0;
        labels.forEach((label, index) => {
            if (label.querySelector('input').checked) {
                activeIndex = index;
            }
        });

        const inactiveLabels = [];
        labels.forEach((label, index) => {
            const input = label.querySelector('input');
            const distance = Math.abs(index - activeIndex);
            
            if (input.checked) {
                label.style.zIndex = 100; // Aktiver Kandidat ist immer ganz vorn
                label.classList.add('wp-is-active');
            } else {
                label.style.zIndex = 10 - distance; // Je weiter weg vom aktiven, desto weiter hinten
                label.classList.remove('wp-is-active');
                inactiveLabels.push(label);
            }
        });

        // Verhindere Animations-Sprünge beim Wechseln, indem das verbleibende inaktive Label sein Delay behält
        let existingDelay = null;
        let labelWithExistingDelay = null;
        
        inactiveLabels.forEach(label => {
            const delay = label.querySelector('.wp-candidate-visual').style.animationDelay;
            if (delay === '0s' || delay === '2s') {
                existingDelay = delay;
                labelWithExistingDelay = label;
            }
        });

        if (existingDelay !== null) {
            // Ein Kandidat war bereits inaktiv, behalte sein Delay bei und gib dem neu inaktiven das andere
            const otherDelay = (existingDelay === '0s') ? '2s' : '0s';
            inactiveLabels.forEach(label => {
                if (label !== labelWithExistingDelay) {
                    label.querySelector('.wp-candidate-visual').style.animationDelay = otherDelay;
                }
            });
        } else {
            // Initial beim Laden
            inactiveLabels[0].querySelector('.wp-candidate-visual').style.animationDelay = '0s';
            if (inactiveLabels[1]) {
                inactiveLabels[1].querySelector('.wp-candidate-visual').style.animationDelay = '2s';
            }
        }
    }

    /**
     * Baut die finale Ziel-URL zusammen.
     * Aktuell passiv, bereitet aber die Möglichkeit vor, Prompts als Query-Parameter anzuhängen.
     */
    function baueZielUrl(anbieterKey, kandidatKey) {
        const anbieterUrl = KONFIGURATION.anbieter[anbieterKey].url;
        // const kandidatDaten = KONFIGURATION.kandidaten[kandidatKey];
        // Beispiel für zukünftige Erweiterung: 
        // return `${anbieterUrl}?q=${encodeURIComponent(kandidatDaten.promptHinweis)}`;
        return anbieterUrl;
    }

    /**
     * Aktualisiert die Beschriftung des Haupt-Buttons (CTA)
     */
    function updateCTA() {
        const anbieterName = KONFIGURATION.anbieter[aktuellerAnbieter].name;
        ctaButton.textContent = `Weiter zu ${anbieterName}`;
    }

    // ==========================================
    // 5. INITIALISIERUNG
    // ==========================================
    function init() {
        if (!providerGroup || !candidateGroup || !ctaButton) {
            console.warn('Wahlprogramm-Widget: Notwendige DOM-Elemente nicht gefunden.');
            return;
        }
        
        renderProviders();
        renderCandidates();
        updateCTA();

        ctaButton.addEventListener('click', () => {
            const zielUrl = baueZielUrl(aktuellerAnbieter, aktuellerKandidat);
            window.open(zielUrl, '_blank', 'noopener,noreferrer');
        });
    }

    // Skript ausführen, sobald das DOM geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
