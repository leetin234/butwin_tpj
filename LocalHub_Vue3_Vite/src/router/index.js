import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BoardView from '../views/BoardView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import PostFormView from '../views/PostFormView.vue'
import MapView from '../views/MapView.vue'
import FinderView from '../views/FinderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/board', name: 'board', component: BoardView },
    { path: '/posts/:id', name: 'post-detail', component: PostDetailView, props: true },
    { path: '/write', name: 'post-write', component: PostFormView },
    { path: '/posts/:id/edit', name: 'post-edit', component: PostFormView, props: true },
    { path: '/map', name: 'map', component: MapView },
    { path: '/finder', name: 'finder', component: FinderView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
