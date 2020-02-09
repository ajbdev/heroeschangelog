const patches = require('heroes-patch-data');
const axios = require('axios');
const cheerio = require('cheerio');
const heroestalents = require('heroes-talents');
const fs = require('fs');
const turndown = require('turndown');
const util = require('util');

const _fsstat = util.promisify(fs.stat);
const _fswriteFile = util.promisify(fs.writeFile);
const _fsreadFile = util.promisify(fs.readFile);

const td = new turndown();

td.addRule('remove-images', {
    filter: ['img'],
    replacement: (content) => ''
});

const CACHE_FILENAME = '._heroes.cached';


let heroes = {};

async function scrapePatchNotes(patch) {
    const response = await axios(patch.officialLink);
    const $ = cheerio.load(response.data);

    const patchRootContainer = (patch.officialLink.indexOf('blizztrack.com') > -1) ? '.patch-notes' : '.article-container';

    const articleHtml = $(patchRootContainer).html();

    if (!articleHtml) {
        console.log(`Skipping ${patch.patchName} [${patch.officialLink}] - ${patch.liveDate} - no article body font`);
        return;
    }

    patch.fullNotesMarkdown = td.turndown(articleHtml);

    patch.changedHeroes =  [];

    $('.article-container h4').each((i,el) => {
        const title = $(el).text().trim();

        if (heroes[title]) {
            let sibling = el.next;

            // Select all next siblings 
            const selections = [];
            while (sibling && ['h1','h2','h3','h4','h5'].indexOf(sibling.name) === -1) {
                if ($(sibling).text().trim()==='Return' || sibling.name === 'img') {
                    // Don't capture return links or images
                    sibling = sibling.next;
                    continue;
                }
                selections.push(sibling);
                sibling = sibling.next;
            }

            const changesAsMarkdown = td.turndown(cheerio.html(selections));

            heroes[title].changes[patch.fullVersion] = { patch: patch, changes: changesAsMarkdown};

            patch.changedHeroes.push(title);
        }
    });

    $('.article-container h3').each((i, el) => {
        if ($(el).text() === 'Bug Fixes') {

            sibling = el.next;
            const selections = [];
            while (sibling) {
                selections.push(sibling);
                sibling = sibling.next;
            }

            const bugfixes = $(selections).text().split('\n');

            Object.keys(heroes).forEach((hero) => {
                bugfixes.forEach((bugfix, i) => {
                    if (bugfix.toUpperCase().indexOf(hero.toUpperCase()) > -1) {
                        if (!heroes[hero].changes[patch.fullVersion]) {
                            heroes[hero].changes[patch.fullVersion] = { patch: patch, changes: ''} ;
                        }
                        
                        heroes[hero].changes[patch.fullVersion].changes += '\nBug fix: ' + bugfix.trim();

                        patch.changedHeroes.push(hero);
                    }
                });
            });        
        }
    });

    patch.changedHeroes = patch.changedHeroes.filter((v, i, s) => s.indexOf(v) === i);

    console.log(`Parsed ${patch.patchName} [${patch.officialLink}] - ${patch.liveDate} - Changed Heroes: ${Array.from(patch.changedHeroes).join(', ')}`);
}

async function iteratePatches(patches, cacheTime) {
    heroes = await heroestalents.loadHeroJSONFiles();

    if (!cacheTime) cacheTime = 86400 * 1000;

    if (!fs.existsSync(CACHE_FILENAME)) {
        await _fswriteFile(CACHE_FILENAME, JSON.stringify({}));
    }

    const stat = await _fsstat(CACHE_FILENAME);
    const cacheRaw = await _fsreadFile(CACHE_FILENAME);
    const cache = JSON.parse(cacheRaw);

    if (stat.mtime.getTime() + cacheTime > (new Date()).getTime() && cache.hasOwnProperty('heroes') && cache.hasOwnProperty('patches')) {
        return cache;
    }

    Object.keys(heroes).map((h) => heroes[h].changes = {});

    for (patch of patches) {
        if (patch.officialLink) {
            await scrapePatchNotes(patch, heroes);
        }
    }

    payload =  {
        patches: patches,
        heroes: heroes
    }

    _fswriteFile(CACHE_FILENAME, JSON.stringify(payload));

    return payload;
}

module.exports = () => iteratePatches(patches);
