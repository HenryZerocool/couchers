import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Store from '../store'
import Home from '../views/Home.vue'
import User from '../views/User.vue'
import Login from '../views/Login.vue'
import Profile from '../views/Profile.vue'
import Logout from '../views/Logout.vue'
import SSO from '../views/SSO.vue'
import Signup from '../views/Signup.vue'
import CompleteLogin from '../views/CompleteLogin.vue'
import CompleteSignup from '../views/CompleteSignup.vue'

import ErrorPage from '../views/Error.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/signup/',
    name: 'Signup',
    component: Signup,
    meta: { noAuth: true }
  },
  {
    path: '/signup/:token',
    name: 'CompleteSignup',
    component: CompleteSignup,
    meta: { noAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { noAuth: true }
  },
  {
    path: '/login/:token',
    name: 'CompleteLogin',
    component: CompleteLogin,
    meta: { noAuth: true }
  },

  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/sso',
    name: 'SSO',
    component: SSO
  },
  {
    path: '/logout',
    name: 'Logout',
    component: Logout
  },
  {
    path: '/user/:user',
    name: 'User',
    component: User
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },

  {
    path: '*',
    name: 'Not found',
    component: ErrorPage,
    props: {
      title: 'Page Not Found',
      message: 'That page wasn\'t found! Sorry.'
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if (!to.matched.some(record => record.meta.noAuth) && !Store.getters.authenticated) {
    next({ name: 'Login', params: { reason: 'Please log in to continue' } })
  } else {
    next()
  }
})

export default router
