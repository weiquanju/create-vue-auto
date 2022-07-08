import { createRouter, createWebHistory } from 'vue-router'
import { getRoutes } from 'v-route-generate'
const routes = getRoutes(import.meta.glob('../views/**/**.vue'), {
  pathRoot: '../views/'
})
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

console.log(routes)

export default router
