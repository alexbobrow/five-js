export const Presence = Object.freeze({
    EXACT: 0,
    CONTAINS: 1,
    MISSING: 2,
});

export class GameResponseLetter {
    constructor(letter, presence) {
        this.letter = letter;
        this.presence = presence;
    }

    static fromString(letter) {
        if (letter.length > 2) {
            throw new Error("Неверное значение для буквы (много символов)");
        }
        if (letter.length === 1) {
            return new GameResponseLetter(letter, Presence.MISSING);
        }
        if (letter[1] === "?") {
            return new GameResponseLetter(letter[0], Presence.CONTAINS);
        }
        if (letter[1] === "!") {
            return new GameResponseLetter(letter[0], Presence.EXACT);
        }
        throw new Error("Неверное значение для буквы (неверный модификатор символов)");
    }

    toString() {
        if (this.presence === Presence.EXACT) return this.letter + "!";
        if (this.presence === Presence.CONTAINS) return this.letter + "?";
        if (this.presence === Presence.MISSING) return this.letter;
    }
}

export class GameResponse {
    constructor(letters) {
        this.letters = letters;
    }

    static fromString(word) {
        const letters = word.split(" ");
        if (letters.length !== 5) {
            throw new Error("Неверное кол-во букв");
        }
        return new GameResponse(letters.map((x) => GameResponseLetter.fromString(x)));
    }

    toString() {
        return this.letters.map((x) => x.toString()).join(" ");
    }

    isGuessed() {
        return this.letters.every((x) => x.presence === Presence.EXACT);
    }

    get word() {
        return this.letters.map((x) => x.letter).join("");
    }
}
