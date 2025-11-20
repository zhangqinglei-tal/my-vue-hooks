<template>
  <div class="demo-container">
    <div class="demo-preview">
      <div class="demo-value">Count: {{ count }}</div>
    </div>
    <div class="demo-actions">
      <button class="demo-button" @click="inc()">+1</button>
      <button class="demo-button" @click="inc(5)">+5</button>
      <button class="demo-button" @click="dec()">-1</button>
      <button class="demo-button" @click="dec(5)">-5</button>
      <button class="demo-button" @click="set(100)">Set to 100</button>
      <button class="demo-button" @click="reset()">Reset</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCounter } from 'my-hooks'

const { count, inc, dec, set, reset } = useCounter(0)
</script>

