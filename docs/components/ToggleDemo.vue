<template>
  <div class="demo-container">
    <div class="demo-preview">
      <div class="demo-value">Value: {{ value }}</div>
    </div>
    <div class="demo-actions">
      <button class="demo-button" @click="toggle()">Toggle</button>
      <button class="demo-button" @click="setTrue()">Set True</button>
      <button class="demo-button" @click="setFalse()">Set False</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToggle } from 'my-hooks'

const { value, toggle, setTrue, setFalse } = useToggle(false)
</script>

