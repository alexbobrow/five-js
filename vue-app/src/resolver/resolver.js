import {Presence} from "../game/models.js";
import {Game} from "../game/game.js";


export class Resolver {
    static NoOptions = class NoOptions extends Error {};

    constructor(words, startWords = null) {
        this.words = words;
        this.gameResponses = [];
        this.attempts = 0;
        this.filtered = new Set([...Array(words.length).keys()]);
        this.index = this.makeIndex();
        const defaultStartWords = ["норка", "билет"];
        this.startWords = startWords ?? defaultStartWords;
    }

    static ResolverResponse = class {
        constructor({ guessWords, discloseWords, nextWord }) {
            this.guessWords = guessWords;
            this.discloseWords = discloseWords;
            this.nextWord = nextWord;
        }
    };

    makeIndex() {
        const index = {};
        for (let i = 0; i < this.words.length; i++) {
            const word = this.words[i];
            for (let j = 0; j < word.length; j++) {
                const letter = word[j];
                if (!(letter in index)) {
                    index[letter] = [new Set(), new Set(), new Set(), new Set(), new Set(), new Set()];
                }
                index[letter][j].add(i);
                index[letter][5].add(i);
            }
        }
        return index;
    }

    applyResponse(response) {
        this.gameResponses.push(response);
        this.filtered = this.filterByGameResponse(this.filtered, response);
        this.attempts += 1;
    }

    resolve() {
        if (this.attempts < this.startWords.length) {
            return new Resolver.ResolverResponse({
                guessWords: [],
                discloseWords: [],
                nextWord: this.startWords[this.attempts],
            });
        }

        if (this.filtered.size === 1) {
            const wi = [...this.filtered][0];
            const word = this.words[wi];
            return new Resolver.ResolverResponse({
                guessWords: [word],
                discloseWords: [],
                nextWord: word,
            });
        }

        if (this.filtered.size === 0) {
            throw new Resolver.NoOptions();
        }

        const wordsForCalc = this.reduceForCalc(this.filtered);
        const discloseWords = this.calculateDisclose(wordsForCalc);

        const triesLeft = 6 - this.attempts;
        let nextWord;
        if (triesLeft > 1 && discloseWords.length > 0) {
            nextWord = discloseWords[0];
        } else {
            nextWord = this.words[[...this.filtered][0]];
        }

        return new Resolver.ResolverResponse({
            guessWords: [...this.filtered].map((i) => this.words[i]),
            discloseWords,
            nextWord,
        });
    }

    reduceForCalc(filtered) {
        const opened = new Set(this.getOpenedLetters());
        let toOpen = new Set();

        for (const wi of filtered) {
            const wordLetters = new Set(this.words[wi]);
            toOpen = toOpen.union(wordLetters.difference(opened));
        }

        const res = [];
        for (const word of this.words) {
            const match = new Set(word).intersection(toOpen).size;
            res.push([word, match]);
        }

        res.sort((a, b) => b[1] - a[1]);
        return res.filter(([_, score]) => score > 0).map(([w]) => w).slice(0, 50);
    }

    calculateDisclose(sourceWords) {
        const res = [];
        for (const wordFromSrc of sourceWords) {
            let wordScore = 0;
            for (const wi of this.filtered) {
                const wordFromFiltered = this.words[wi];
                const testGame = new Game(this.words, wordFromFiltered);
                let testGameResponse;
                try {
                    testGameResponse = testGame.generateGameResponse(wordFromSrc);
                } catch (e) {
                    if (e instanceof Game.Win) {
                        continue;
                    }
                    throw e;
                }
                wordScore += this.filterByGameResponse(this.filtered, testGameResponse).size;
            }
            res.push([wordFromSrc, wordScore]);
        }
        res.sort((a, b) => a[1] - b[1]);
        return res.slice(0, 10).map(([w]) => w);
    }

    filterByGameResponse(filtered, gameResponse) {
        let res = new Set(filtered);

        const letterConstraints = {};
        gameResponse.letters.forEach((grl, i) => {
            if (!letterConstraints[grl.letter]) {
                letterConstraints[grl.letter] = [];
            }
            letterConstraints[grl.letter].push([i, grl.presence]);
        });

        for (const [letter, constraints] of Object.entries(letterConstraints)) {
            for (const [pos, presence] of constraints) {
                if (presence === Presence.EXACT) {
                    res = res.intersection(this.index[letter][pos]);

                } else if (presence === Presence.CONTAINS) {
                    res = res.intersection(this.index[letter][5].difference(this.index[letter][pos]));

                } else if (presence === Presence.MISSING) {
                    const hasOther = constraints.some(([_, p]) => p !== Presence.MISSING);
                    if (hasOther) {
                        res = res.difference(this.index[letter][pos]);
                    } else {
                        res = res.difference(this.index[letter][5]);
                    }
                }
            }
        }

        return res;
    }

    getOpenedLetters() {
        const openedLetters = [];
        for (const gameResponse of this.gameResponses) {
            openedLetters.push(...gameResponse.letters.map((x) => x.letter));
        }
        return [...new Set(openedLetters)];
    }

    reset() {
        this.filtered = new Set([...Array(this.words.length).keys()]);
        this.gameResponses = [];
        this.attempts = 0;
    }
}
