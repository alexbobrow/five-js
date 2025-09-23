<script>
import KeyboardButton from "./KeyboardButton.vue";
import {Presence} from "../game/models.js";

export default {
    name: "Keyboard",
    components: {KeyboardButton},
    emits: ["clickLetter", "clickBackspace", "clickEnter"],
    props: ["presence", "showEnter"],
    methods: {
        handleClick(char) {
            if (char === '«') {
                this.$emit("clickBackspace")
            } else {
                this.$emit("clickLetter", char)
            }
        },
        calculateClass(char) {
            if (this.presence[char] === Presence.MISSING) {
                return ["keyboard__button--missing"]
            }
            if (this.presence[char] === Presence.CONTAINS) {
                return ["keyboard__button--contains"]
            }
            if (this.presence[char] === Presence.EXACT) {
                return ["keyboard__button--exact"]
            }
        },
    },
}
</script>

<template>
    <div class="keyboard">
        <div class="keyboard__rows sideMargin">
            <div class="keyboard__row">
                <KeyboardButton v-for="char in 'йцукенгшщзх'" @click="handleClick" :letter="char" :class="calculateClass(char)" />
            </div>
            <div class="keyboard__row">
                <KeyboardButton v-for="char in 'фывапролджэ'" @click="handleClick" :letter="char" :class="calculateClass(char)" />
            </div>
            <div class="keyboard__row">
                <KeyboardButton v-for="char in 'ъячсмитьбю«'" @click="handleClick" :letter="char" :class="calculateClass(char)" />
            </div>
            <div v-if="showEnter" class="keyboard__row">
                <button @click="$emit('clickEnter')" class="keyboard__button keyboard__button--enter">ввод</button>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>