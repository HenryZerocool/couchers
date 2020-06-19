<template>
  <v-content>
    <v-container fill-height>
      <v-col>
        <v-row>
          <div class="mx-auto mb-5">
            <h1>Welcome to Couchers.org</h1>
            <v-alert v-if="reason" type="warning">
              {{ reason }}
            </v-alert>
          </div>
        </v-row>
        <v-row>
          <v-col class="ml-auto" cols="4" sm="8" md="6" lg="5" xl="4">
            <h2>Login</h2>
            <v-card flat v-if="loginStep == 'user' || loginStep == 'pass'">
              <v-card-text>
                <v-form v-on:submit.prevent="loginSubmit">
                  <v-row>
                    <v-text-field
                      :autofocus="loginStep == 'user'"
                      v-model="username"
                      :rules="[rules.required]"
                      :disabled="loginLoading"
                      :loading="loginLoading && loginStep == 'user'"
                      :error-messages="loginErrorMessages"
                      :success-messages="loginSuccessMessages"
                      v-on:keydown.enter="loginSubmit"
                      name="username"
                      label="Username/email"
                    ></v-text-field>
                  </v-row>
                  <v-row v-if="loginStep == 'pass'">
                    <v-text-field
                      :autofocus="loginStep == 'pass'"
                      v-model="password"
                      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      :rules="[rules.required]"
                      :type="showPassword ? 'text' : 'password'"
                      :disabled="loginLoading"
                      :loading="loginLoading"
                      v-on:keydown.enter="loginSubmit"
                      name="password"
                      label="Password"
                      :error-messages="passErrorMessages"
                      @click:append="showPassword = !showPassword"
                    ></v-text-field>
                  </v-row>
                  <v-row class="mt-5"><v-btn v-on:click="loginSubmit" :disabled="loginLoading" color="primary">{{ loginStep == 'user' ? 'Next' : 'Login' }}</v-btn></v-row>
                </v-form>
              </v-card-text>
            </v-card>
            <v-card flat v-if="loginStep == 'email'">
              <v-card-text>
                <p>We sent you a login email. Please click the link to sign in!</p>
              </v-card-text>
            </v-card>
          </v-col>
          <v-divider class="mx-5" vertical />
          <v-col class="mr-auto" cols="4" sm="8" md="6" lg="5" xl="4">
            <h2>Sign up</h2>
            <v-card flat v-if="signupStep == 'form'">
              <v-card-text>
                <v-form v-on:submit.prevent="signupSubmit">
                  <v-row>
                    <v-text-field
                      autofocus
                      v-model="email"
                      :rules="[rules.required, rules.validEmail]"
                      :disabled="signupLoading"
                      :loading="signupLoading"
                      :error-messages="signupErrorMessages"
                      :success-messages="signupSuccessMessages"
                      v-on:keyup.enter="signupSubmit"
                      name="email"
                      label="Email"
                    ></v-text-field>
                  </v-row>
                  <v-row><p>We'll email you a link!</p></v-row>
                  <v-row><v-btn v-on:click="signupSubmit" color="success">Sign up</v-btn></v-row>
                </v-form>
              </v-card-text>
            </v-card>
            <v-card flat v-if="signupStep == 'email'">
              <v-card-text>
                <p>We sent you a signup email. Please click on the link to continue!</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue'

import { AuthClient } from '../pb/AuthServiceClientPb'
import { AuthReq, LoginReq, LoginRes, SignupReq, SignupRes } from '../pb/auth_pb'

import * as grpcWeb from 'grpc-web'

const authClient = new AuthClient("http://127.0.0.1:8888")

import Store, { AuthenticationState } from '../store'

import Router from '../router'

export default Vue.extend({
  data: () => ({
    showPassword: false,
    loginLoading: false,
    signupLoading: false,
    username: '',
    password: '',
    passErrorMessages: [] as Array<string>,
    loginErrorMessages: [] as Array<string>,
    loginSuccessMessages: [] as Array<string>,
    signupErrorMessages: [] as Array<string>,
    signupSuccessMessages: [] as Array<string>,
    loginStep: 'user',
    email: '',
    signupStep: 'form',
    rules: {
      required: (value: string) => !!value || 'Required.',
      validEmail: function (email: string) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email) || 'Sorry! That doesn\'t look like a proper email.';
      }
    },
  }),

  computed: {
    reason: function () {
      return this.$route.params.reason
    },
  },

  watch: {
    // empty error and success messages if we change user/pass combo
    username: function () {
      this.clearLoginMessages()
    },
    password: function () {
      this.clearLoginMessages()
    }
  },

  methods: {
    clearLoginMessages: function () {
      this.loginErrorMessages = []
      this.loginSuccessMessages = []
      this.passErrorMessages = []
    },
    loginSubmit: function () {
      if (this.loginStep == 'user') {
        this.loginLoading = true;
        this.clearLoginMessages()

        const req = new LoginReq()

        req.setUser(this.username)
        authClient.login(req, null).then(res => {
          switch (res.getNextStep()) {
            case LoginRes.LoginStep.NEED_PASSWORD:
              this.loginStep = 'pass'
              break
            case LoginRes.LoginStep.SENT_LOGIN_EMAIL:
              this.loginStep = 'email'
              break
            case LoginRes.LoginStep.INVALID_USER:
              this.loginErrorMessages = ['User not found!']
              break
          }
          this.loginLoading = false
        }).catch(err => {
          this.loginErrorMessages = ['Unknown error.']
          this.loginLoading = false
        })
      } else if (this.loginStep == 'pass') {
        this.loginLoading = true;
        this.clearLoginMessages()

        const req = new AuthReq()

        req.setUser(this.username)
        req.setPassword(this.password)
        authClient.authenticate(req, null).then(res => {
          this.loginLoading = false
          this.loginSuccessMessages = ['Success.']
          Store.commit('auth', {
            authState: AuthenticationState.Authenticated,
            authToken: res.getToken()
          })
          Router.push('/')
        }).catch(err => {
          this.loginLoading = false
          if (err.code == grpcWeb.StatusCode.UNAUTHENTICATED) {
            this.passErrorMessages = ['Invalid username or password.']
          } else {
            this.passErrorMessages = ['Unknown error.']
          }
        })
      }
    },
    signupSubmit: function () {
      this.signupLoading = true;
      this.signupErrorMessages = []
      this.signupSuccessMessages = []

      const req = new SignupReq()

      req.setEmail(this.email)
      authClient.signup(req, null).then(res => {
        switch (res.getNextStep()) {
          case SignupRes.SignupStep.SENT_SIGNUP_EMAIL:
            this.signupStep = 'email'
            break
          case SignupRes.SignupStep.EMAIL_EXISTS:
            this.signupErrorMessages = ['Email exists! Please login.']
            break
          case SignupRes.SignupStep.INVALID_EMAIL:
            this.signupErrorMessages = ['Sorry! That doesn\'t look like a proper email.']
            break
        }
        this.signupLoading = false
      }).catch(err => {
        this.signupErrorMessages = ['Unknown error.']
        this.signupLoading = false
      })
    },
  },
})
</script>
