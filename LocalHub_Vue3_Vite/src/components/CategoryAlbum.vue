<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: String,
  items: { type:Array, default:()=>[] }
})

const start = ref(0)

function move(dir){
  const max=Math.max(0, props.items.length-3)
  start.value=Math.min(max, Math.max(0,start.value+dir))
}
</script>

<template>
<section class="category-section">
  <div class="category-head">
    <h2>{{ title }}</h2>
    <div class="category-buttons">
      <button @click="move(-1)">←</button>
      <button @click="move(1)">→</button>
    </div>
  </div>

  <div class="category-window">
    <div class="category-track" :style="{transform:`translateX(-${start*33.333}%)`}">
      <article v-for="item in items" :key="item.title" class="category-card">
        <img :src="item.image" :alt="item.title" @error="(e)=>e.currentTarget.src='https://images.unsplash.com/photo-1492684223066-81342ee5ff30'" />
        <div>
          <span>{{ item.type }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.location }}</p>
        </div>
      </article>
    </div>
  </div>
</section>
</template>

<style scoped>
.category-section{margin-top:18px}
.category-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.category-head h2{font-size:28px;font-weight:800}
.category-buttons button{width:42px;height:42px;border-radius:50%;margin-left:8px;border:1px solid #ddd;background:#fff}
.category-window{overflow:hidden}
.category-track{display:flex;transition:.35s}
.category-card{min-width:33.333%;padding:0 10px}
.category-card img{width:100%;height:260px;object-fit:cover;border-radius:18px}
.category-card span{font-size:12px;color:#e0362b;font-weight:700;display:block;margin-top:4px;margin-bottom:4px}
.category-card h3{margin-top:4px;font-size:20px}
.category-card p{color:#777}
@media(max-width:768px){
.category-card{min-width:100%}
}
</style>
