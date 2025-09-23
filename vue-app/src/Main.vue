<script>
import Game from "./gameUi/Game.vue";
import Resolver from "./resolverUi/Resolver.vue";
import Help from "./Help.vue";


const tabs = [
  { key: "game", label: "Игра", component: Game },
  { key: "resolver", label: "Решатель", component: Resolver },
  { key: "help", label: "Помощь", component: Help },
]

export default {
    name: "Main",
    components: {Resolver, Game},
    data() {
        return {
            currentTab: "game",
        }
    },
    computed: {
        currentComponent() {
            return tabs.find(t => t.key === this.currentTab)?.component
        },
        tabs() {
            return tabs
        },
    }
}
</script>

<template>
    <div class="verticalSet verticalSet--center">
        <nav class="horSet menu sideMargin">
            <button v-for="tab in tabs" :class="{'link--selected': currentTab === tab.key }" @click="currentTab = tab.key" class="link">{{ tab.label }}</button>
        </nav>
        <component :is="currentComponent" />
    </div>
</template>
