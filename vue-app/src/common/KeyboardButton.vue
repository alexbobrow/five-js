<script>
export default {
    name: "KeyboardButton",
    props: ["letter"],
    emits: ["click"],
}
</script>

<template>
    <button @click="$emit('click', letter)" class="keyboard__button"><span>{{ letter }}</span></button>
</template>

<style scoped>

</style>