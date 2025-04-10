const classMap = {
    bladedancer: ['ROGUE', 'BLADEDANCER'],
    marksman: ['ROGUE', 'MARKSMAN'],
    falconer: ['ROGUE', 'FALCONER'],
    beastmaster: ['PRIMALIST', 'BEASTMASTER'],
    shaman: ['PRIMALIST', 'SHAMAN'],
    druid: ['PRIMALIST', 'DRUID'],
    sorcerer: ['MAGE', 'SORCERER'],
    spellblade: ['MAGE', 'SPELLBLADE'],
    runemaster: ['MAGE', 'RUNEMASTER'],
    voidknight: ['SENTINEL', 'VOIDKNIGHT'],
    forgeguard: ['SENTINEL', 'FORGEGUARD'],
    paladin: ['SENTINEL', 'PALADIN'],
    necromancer: ['ACOLYTE', 'NECROMANCER'],
    lich: ['ACOLYTE', 'LICH'],
    warlock: ['ACOLYTE', 'WARLOCK']
};

document.getElementById('class-select').addEventListener('change', () => {
    //const selected = document.getElementById('class-select').value;
    //updateVisibility(classMap[selected] || []);
    fetchAndRender();
});

function updateVisibility(selectedTags) {
    // Get all elements with data-tags attribute
    const taggedElements = document.querySelectorAll('[data-tags]');
    
    taggedElements.forEach(element => {
        const elementTags = JSON.parse(element.dataset.tags);
        // Show if any tag matches the selected tags, hide otherwise
        if (elementTags.some(tag => selectedTags.includes(tag)) || elementTags.length === 0) {
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    });
}

function fetchAndRender() {
    const selected = document.getElementById('class-select').value;
    fetch('campaign.md')
        .then(r => r.text())
        .then(text => {
            renderMarkdown(text, classMap[selected] || []);
            updateVisibility(classMap[selected] || []);
        });
}

function renderMarkdown(text, tags) {
    const container = document.getElementById('cheatsheet-container');
    container.innerHTML = '';
    const lines = text.split('\n');
    let sectionDiv = null;
    let subsectionDiv = null;
    let col1 = [], col2 = [], col3 = [];

    let parsedData = [];
    let sectionCount = 0;

    const render = () => {
        console.log(parsedData);

        parsedData.forEach((sec) => {
            const secDiv = document.createElement('div');
            const cols = document.createElement('div');
            cols.classList.add('columns');

            const div12 = document.createElement('div');
            div12.classList.add('column80');
            //div12.style.add('width:80%');
            cols.appendChild(div12);

            const div3 = document.createElement('div');
            div3.classList.add('column20');
            cols.appendChild(div3);

            sec.col3.forEach(el => div3.appendChild(el));

            sec.subsections.forEach((subSec) => {
                const sub = document.createElement('div');
                sub.classList.add('subsection');

                const subtitle = document.createElement('div');
                subtitle.classList.add('subtitle');
                subtitle.textContent = subSec.subsectionName;

                const subContent = document.createElement('div');
                subContent.classList.add('sub-content');
                //subContent.style.display = 'none';

                const subCols = document.createElement('div');
                subCols.classList.add('columns');
                [subSec.col1, subSec.col2].forEach(arr => {
                    const div = document.createElement('div');
                    div.classList.add('column');
                    arr.forEach(el => div.appendChild(el));
                    subCols.appendChild(div);
                });
                subContent.appendChild(subCols);

                subtitle.onclick = () => toggleVisibility(subContent);
                sub.appendChild(subtitle);
                sub.appendChild(subContent);
                div12.appendChild(sub);
            });
            secDiv.appendChild(cols);
            sec.section.querySelector('.content').appendChild(secDiv);
        });
    };

    const flush = () => {
        if(sectionDiv == null) return;

        if (subsectionDiv) {
            parsedData[sectionCount - 1].subsections.push({
                subsectionName: subsectionDiv,
                col1: col1,
                col2: col2
            });
            if( col3.length > 0 )
                console.log("col3 should be empty", col3);
            col1 = [];
            col2 = [];
        } else {
            parsedData.push({
                section: sectionDiv,
                col3: col3,
                subsections: []
            });
            sectionCount++;
            if( col1.length + col2.length > 0 )
                console.log("col1, col2 be empty", col1, col2);
            col3 = [];
        }
    };

    let currentSectionTitle = '';
    lines.forEach(line => {
        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
            flush();
            sectionDiv = document.createElement('div');
            sectionDiv.classList.add('section');

            const title = document.createElement('div');
            title.classList.add('title');
            title.textContent = trimmed.substring(2);

            const content = document.createElement('div');
            content.classList.add('content');
            //content.style.display = 'none';

            title.onclick = () => toggleVisibility(content);
            sectionDiv.appendChild(title);
            sectionDiv.appendChild(content);
            container.appendChild(sectionDiv);
            subsectionDiv = null;
            //console.log("--"+title.textContent);
        } else if (trimmed.startsWith('## ')) {
            flush();
            subsectionDiv = trimmed.substring(3);
            //console.log("--"+subsectionDiv);
        } else {
            let workingLine = trimmed;

            // Handle images first
            const imageMatches = [...workingLine.matchAll(/!\[\[(.*?)\]\]/g)];
            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            var hadImages = false;
            imageMatches.forEach(match => {
                hadImages = true;
                //console.log("replacing", match[0])
                const file = match[1];

                const img = document.createElement('img');
                img.src = "images/" + file;
                img.className = 'thumb';
                //img.onclick = () => window.open(file, '_blank');

                const placeholder = document.createElement('div');
                placeholder.className = 'img-placeholder';
                placeholder.textContent = file;

                // Initially, only the image is visible
                placeholder.style.display = 'none';

                img.onerror = () => {
                    img.style.display = 'none';
                    //placeholder.style.display = 'flex';
                };

                img.onload = () => {
                    placeholder.remove(); // Clean up placeholder if not needed
                };

                wrapper.appendChild(img);
                wrapper.appendChild(placeholder);

                // Strip this match from the text content
                workingLine = workingLine.replace(match[0], '');
            });


            // Handle class tags second
            const tagMatches = [...workingLine.matchAll(/\[(.*?)\]/g)];
            let tagList = tagMatches.map(m => m[1].toUpperCase());
            if (tagList.length && !tagList.some(tag => tags.includes(tag))) return;

            workingLine = workingLine.replace(/\[(.*?)\]/g, (match, p1) => {
                return "";//return `<img src="icons/${p1.toLowerCase()}.svg" alt="${p1}" width="16" />`;
            }).trim();

            if ( hadImages ) {
                // We already dealt with it
                if(subsectionDiv)
                    col2.push(wrapper);
                else
                    col3.push(wrapper);
            } else {
                //console.log ("remaining line", workingLine);
                const li = document.createElement('div');


                workingLine = workingLine.replace(/\*\*(.*?)\*\*/g, (match, p1) => {
                    return `<b>${p1}</b>`;
                });

                workingLine = workingLine.replace(/\*(.*?)\*/g, (match, p1) => {
                    return `<i>${p1}</i>`;
                });

                li.innerHTML = workingLine;
                if (subsectionDiv)
                    col1.push(li);
                else col3.push(li);
            }
        }
    });

    flush();

    render();
}

function toggleVisibility(el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

fetchAndRender();
