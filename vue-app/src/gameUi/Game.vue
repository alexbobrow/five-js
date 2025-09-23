<script>
import {Game} from "../game/game.js";
import {words} from "../game/words.js";
import {GameResponse, GameResponseLetter, Presence} from "../game/models.js";
import {GameStatus} from "./models.js";
import Cell from "../common/Cell.vue";
import Keyboard from "../common/Keyboard.vue";


export default {
    components: {Keyboard, Cell},
    data() {
        return {
            status: GameStatus.IN_PROGRESS,
            gameResponses: [],
            typing: [],
        }
    },
    created() {
        this.game = new Game(words)
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
        removeKeyListeners() {
            window.removeEventListener('keydown', this.handleKeyPress)
        },
        handleKeyPress(e) {
            const key = e.key.toLowerCase()
            if (/^[а-яё]$/i.test(key)) {
                this.addLetter(key)
            } else if (e.key === 'Backspace') {
                this.removeLetter()
            } else if (e.key === 'Enter') {
                this.apply()
            }
        },
        addLetter(letter) {
            if (this.status === GameStatus.IN_PROGRESS && this.typing.length < 5) {
                this.typing.push(letter)
            }
        },
        removeLetter() {
            if (this.status === GameStatus.IN_PROGRESS) {
                this.typing.pop()
            }
        },
        apply() {
            if (this.status === GameStatus.IN_PROGRESS && this.typing.length !== 5) {
                return
            }
            this.makeTry()
        },
        reset(e) {
            e.target.blur()
            this.status = GameStatus.IN_PROGRESS
            this.gameResponses = []
            this.typing = []
            this.game = new Game(words)
        },
        makeTry() {
            try {
                const gameResponse = this.game.makeTry(this.typing.join(""))
                this.gameResponses.push(gameResponse)
            } catch (e) {
                if (e instanceof Game.Win) {
                    this.status = GameStatus.WIN
                    this.gameResponses.push(
                        new GameResponse(this.typing.map((x) => new GameResponseLetter(x, Presence.EXACT)))
                    )
                    this.typing = []
                    alert("Вы выиграли")
                    return
                } else if (e instanceof Game.Lose) {
                    this.status = GameStatus.LOSE
                    this.gameResponses.push(e.gameResponse)
                    alert("Вы проиграли")
                    return
                } else if (e instanceof Game.NoWordError) {
                    alert("Это слово не найдено в словаре")
                    return
                }
                throw e;
            }
            this.typing = []
        },
        handleKeyboardBackspace() {
            this.removeLetter()
        },
        handleKeyboardLetter(letter) {
            this.addLetter(letter)
        },
        handleKeyboardEnter() {
            this.apply()
        },
    },
    computed: {
        rows() {
            const res = []
            for (let i = 0; i < 6; i++) {
                if (this.gameResponses.length > i) {
                    const row = this.gameResponses[i].letters.map((x) => [x.letter, x.presence])
                    res.push(row)
                } else if (this.gameResponses.length === i) {
                    const row = Array.from({length: 5}, (_, i) => [this.typing[i] ?? "", ""]);
                    res.push(row)
                } else {
                    res.push([["", ""], ["", ""], ["", ""], ["", ""], ["", ""]])
                }
            }
            return res
        },
        activeRow() {
            return this.status === GameStatus.IN_PROGRESS ? this.gameResponses.length : null
        },
        letterPresenceMap() {
            const priority = {
                [Presence.MISSING]: 0,
                [Presence.CONTAINS]: 1,
                [Presence.EXACT]: 2,
            };
            const map = {};
            for (const response of this.gameResponses) {
                for (const {letter, presence} of response.letters) {
                    if (
                        !(letter in map) ||
                        priority[presence] > priority[map[letter]]
                    ) {
                        map[letter] = presence;
                    }
                }
            }
            return map;
        },
    },
}
</script>

<template>
    <div class="verticalSet verticalSet--center sideMargin">
        <div class="table">
            <div class="row" v-for="(row, i) in rows">
                <Cell v-for="cell in row" :status="cell[1]" :letter="cell[0]" :isActive="i === activeRow" />
            </div>
        </div>
        <div>
            <button @click="reset" class="button">сброс</button>
        </div>
    </div>

    <Keyboard
        @click-backspace="handleKeyboardBackspace"
        @click-letter="handleKeyboardLetter"
        @click-enter="handleKeyboardEnter"
        :presence="letterPresenceMap"
        :showEnter="true"
    />

</template>

<style scoped>

</style>