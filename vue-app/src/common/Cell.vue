<script>


import {Presence} from "../game/models.js";

export default {
    props: ["status", "letter", "isActive"],
    emits: ["click"],
    computed: {
        cellClass() {
             const cls = []
             if (this.status === Presence.MISSING) {
                 cls.push("cell--missing")
             } else if (this.status === Presence.EXACT) {
                 cls.push("cell--exact")
             } else if (this.status === Presence.CONTAINS) {
                 cls.push("cell--contains")
             }
             if (this.isActive) {
                 cls.push("cell--active")
             }
             return cls
        },
    },
}
</script>

<template>
<button class="cell" :class="cellClass" @click="$emit('click')" tabindex="-1">
    {{ letter }}
</button>
</template>

<style scoped>

</style>