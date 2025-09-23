<script>
import {GameResponse, GameResponseLetter, Presence} from "../game/models.js";
import Cell from "../common/Cell.vue";
import {Resolver} from "../resolver/resolver.js";
import {words} from "../game/words.js";
import Keyboard from "../common/Keyboard.vue";


export const ErrorCodes = Object.freeze({
    NOT_FOUND: 0,
    NO_OPTIONS: 1,
    UNKNOWN: 2,
});

class IncompleteRow extends Error {}

export default {
    components: {Keyboard, Cell},
    data() {
        return {
            filledRows: [],
            typing: [],
            activeRow: 0,
            currentPresence: Presence.MISSING,
            discloseWords: [],
            guessWords: [],
            nextWord: null,
            errorCode: null,
        }
    },
    created() {
        this.resolver = this.makeResolver()
        this.resolve()
        this.calcTid = null
    },
    mounted() {
        this.addKeyListeners()
      },
    beforeUnmount() {
        this.removeKeyListeners()
    },
    methods: {
        addKeyListeners() {
            window.addEventListener('keydown', this.handleKeyPress)
        },
        makeResolver() {
            return new Resolver(words)
        },
        removeKeyListeners() {
            window.removeEventListener('keydown', this.handleKeyPress)
        },
        handleKeyPress(e) {
            const key = e.key.toLowerCase()
            if (/^[а-яё]$/i.test(key)) {
                this.addLetter(key)
            } else if (e.key === 'Backspace') {
                this.removeLetter()
            } else if (e.key === ' ') {
                e.preventDefault()
                this.rotatePresence()
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                this.moveCurrentRowUp()
            } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                this.moveCurrentRowDown()
            }
        },
        moveCurrentRowUp() {
            if (this.activeRow > 0) {
                this.setCurrentRow(this.activeRow - 1)
            }
        },
        moveCurrentRowDown() {
            if (this.activeRow < this.filledRows.length) {
                this.setCurrentRow(this.activeRow + 1)
            }
        },
        addLetter(letter) {
            if (!this.filledRows[this.activeRow]) {
                this.filledRows[this.activeRow] = []
            }
            if (this.filledRows[this.activeRow].length < 5) {
                this.filledRows[this.activeRow].push([letter, this.currentPresence])
            }
            if (this.resolver && this.resolver.gameResponses.length && this.resolver.gameResponses.length > this.activeRow) {
                this.resolver = null
            }
            if (this.filledRows[this.activeRow].length === 5) {
                const word = (this.filledRows[this.activeRow].map((x) => x[0])).join('')
                if (words.includes(word)) {
                    this.moveCursorToNextLine()
                    this.calculate()
                } else {
                    this.errorCode = ErrorCodes.NOT_FOUND
                }

            }
        },
        removeLetter() {
            if (!this.filledRows[this.activeRow]) {
                this.moveCurrentRowUp()
            }
            if (!this.filledRows[this.activeRow]) {
                return
            }
            this.filledRows[this.activeRow].pop()
            if (this.filledRows[this.activeRow].length === 0) {
                this.filledRows.splice(this.activeRow, 1)
                this.resolver = null
                this.calculate()
            }
        },
        moveCursorToNextLine() {
            let nextRow = this.filledRows.findIndex(
                row => row.length < 5 || row.some(cell => cell[0] === "")
            )
            if (nextRow < 0) {
                nextRow = Math.min(this.filledRows.length, 5)
            }
            this.setCurrentRow(nextRow)
        },
        setCurrentRow(rowId) {
            if (this.activeRow !== rowId) {
                this.activeRow = rowId
                this.currentPresence = Presence.MISSING
            }
        },
        handleCellClick(row, col) {
            this.setCurrentRow(Math.min(this.filledRows.length, row))
            if (this.filledRows[row] && this.filledRows[row][col]) {
                this.filledRows[row][col][1] = this.getNextPresence(this.filledRows[row][col][1])
                this.resolver = null
                if (this.filledRows[row].length === 5) {
                    this.queueCalculation()
                }
            }
        },
        generateGameResponse(rowId) {
            if (this.filledRows[rowId].length < 5) {
                throw new IncompleteRow()
            }
            const letters = this.filledRows[rowId].map((x) => new GameResponseLetter(x[0], x[1]))
            return new GameResponse(letters)
        },
        queueCalculation() {
            clearTimeout(this.calcTid)
            this.calcTid = setTimeout(this.calculate.bind(this), 500)
        },
        calculate() {
            if (this.resolver === null) {
                this.resolver = this.makeResolver()
            }
            try {
                for (let i = this.resolver.gameResponses.length; i < this.filledRows.length; i++) {
                    this.resolver.applyResponse(this.generateGameResponse(i))
                }
                this.resolve()
            } catch (e) {
                if (!(e instanceof IncompleteRow)) {
                    throw e
                }
            }
        },
        getNextPresence(src) {
            if (src === Presence.MISSING) {
                return Presence.CONTAINS
            } else if (src === Presence.CONTAINS) {
                return Presence.EXACT
            } else if (src === Presence.EXACT) {
                return Presence.MISSING
            }
        },
        rotatePresence() {
            this.currentPresence = this.getNextPresence(this.currentPresence)
        },
        resolve() {
            try {
                const resolverResponse = this.resolver.resolve()
                this.nextWord = resolverResponse.nextWord
                this.discloseWords = resolverResponse.discloseWords
                this.guessWords = resolverResponse.guessWords
                this.errorCode = null
            } catch (e) {
                if (e instanceof Resolver.NoOptions) {
                    this.errorCode = ErrorCodes.NO_OPTIONS
                } else {
                    console.error(e)
                    this.errorCode = ErrorCodes.UNKNOWN
                }
            }
        },
        applyWord(word) {
            this.filledRows[this.filledRows.length] = word.split('').map((x) => [x, Presence.MISSING])
            this.setCurrentRow(Math.min(this.filledRows.length, 5))
            this.calculate()
        },
        reset(e) {
            e.target.blur()
            this.filledRows = []
            this.typing = []
            this.activeRow = 0
            this.currentPresence = Presence.MISSING
            this.resolver = new Resolver(words)
            this.resolve()
        },
        handleKeyboardBackspace() {
            this.removeLetter()
        },
        handleKeyboardLetter(letter) {
            this.addLetter(letter)
        },
    },
    computed: {
        errorMessage() {
            if (this.errorCode === ErrorCodes.NO_OPTIONS) {
                return "Нет слов попадающих под фильтр. Проверьте правильность подсказок."
            }
            if (this.errorCode === ErrorCodes.NOT_FOUND) {
                return "Указанное слово не найдено. Проверьте правильность написания."
            }
            if (this.errorCode === ErrorCodes.UNKNOWN) {
                return "Неизвестная ошибка."
            }
        },
        rows() {
            const res = []
            const cp = this.currentPresence
            for (let i=0; i <= 5; i++) {
                let row = []
                if (this.filledRows[i]) {
                    row = this.filledRows[i].map((x) => [x[0], x[1]])
                }
                const rowLength = row.length || 0
                for (let j = rowLength; j < 5; j++) {
                    const presence = (i === this.activeRow && j === rowLength) ?  cp : ""
                    row.push(["", presence])
                }
                res.push(row)
            }
            return res
        },
    }
}
</script>

<template>
    <div class="verticalSet verticalSet--center sideMargin">
        <div class="table">
            <div class="row" v-for="(row, rowId) in rows">
                <Cell
                    v-for="(cell, colId) in row" :status="cell[1]"
                    :letter="cell[0]"
                    :isActive="rowId === activeRow"
                    @click="handleCellClick(rowId, colId)"
                />
            </div>
        </div>

        <template v-if="errorCode === null">
            <template v-if="guessWords.length === 1">
                <strong>Загаданное слово &mdash; {{ guessWords[0] }} 🎉</strong>
            </template>
            <template v-else>
                <div class="verticalSet verticalSet--s verticalSet--center">
                    <strong>Рекомендуемое слово</strong>
                    <div>
                        <button @click="applyWord(nextWord)" class="link">{{ nextWord }}</button>
                    </div>
                </div>

                <div v-if="guessWords.length > 0" class="verticalSet verticalSet--s verticalSet--center">
                    <strong>Подходят слова</strong>
                    <div class="horSet horSet--s horSet--wrap horSet--center">
                        <button v-for="item in guessWords" @click="applyWord(item)" class="link">{{ item }}</button>
                    </div>
                </div>

                <div v-if="discloseWords.length > 0" class="verticalSet verticalSet--s verticalSet--center">
                    <strong>Варианты для раскрытия</strong>
                    <div class="horSet horSet--s horSet--wrap horSet--center">
                        <button v-for="item in discloseWords" @click="applyWord(item)" class="link">{{ item }}</button>
                    </div>
                </div>
            </template>
        </template>

        <template v-else>
            <div>
                <div class="error">{{ errorMessage }}</div>
            </div>
        </template>

        <div>
            <button @click="reset" class="button">сброс</button>
        </div>

    </div>

    <Keyboard
        @click-backspace="handleKeyboardBackspace"
        @click-letter="handleKeyboardLetter"
        :presence="[]"
        :showEnter="false"
    />

</template>

<style scoped>

</style>