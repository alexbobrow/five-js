import {Game} from "../game/game.js";
import {Session} from "./session.js";

export class Tester {
    constructor(resolver, words) {
        this.resolver = resolver;
        this.words = words;
        this.winCount = 0;
        this.loseWords = [];
        this.attemptsLog = Array(6).fill(0);
    }

    testWord(word) {
        const game = new Game(this.words, word);
        const session = new Session(this.resolver, game);
        let isWin = null;

        try {
            session.play();
        } catch (e) {
            if (e instanceof Game.Win) {
                this.winCount += 1;
                this.attemptsLog[game.tries] += 1;
                isWin = true;
            } else if (e instanceof Game.Lose) {
                this.loseWords.push(word);
                isWin = false;
            } else {
                console.error(`Unexpected error on ${word}`, e);
                throw e;
            }
        }
        if (isWin === null) {
            this.loseWords.push(word);
        }
        this.resolver.reset();
    }

    test() {
        const started = new Date();
        console.log(`Запуск тестировщика, ${started.toISOString()}`);

        this.words.forEach((word, i) => {
            if ((i + 1) % 500 === 0) {
                console.log(`${i + 1}/${this.words.length}`);
            }
            this.testWord(word);
        });

        console.log(`Успешно: ${this.winCount}`);
        console.log(`Fail: ${this.loseWords.length}`);
        if (this.loseWords.length > 0) {
            console.log(`Fail words: ${this.loseWords}`);
            const successRate = 100 - (this.loseWords.length * 100) / this.words.length;
            console.log(`Процент успеха: ${successRate.toFixed(2)}%`);
        }

        const elapsedMs = new Date() - started;
        console.log(`Заняло времени: ${(elapsedMs / 1000).toFixed(2)} сек.`);

        const avgAttempts =
            this.winCount > 0
                ? this.attemptsLog.reduce(
                (acc, v, i) => acc + v * (i + 1),
                0
            ) / this.winCount
                : 0;

        console.log(`Распределение по попыткам: ${this.attemptsLog}`);
        console.log(`Среднее кол-во попыток: ${avgAttempts.toFixed(4)}`);
    }
}