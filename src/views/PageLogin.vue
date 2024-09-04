<script>
import { useAppOptionStore } from '@/stores/app-option';
import { useUserSessionStore } from '@/stores/user-session';
import { useRouter, RouterLink } from 'vue-router';
import { userRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';

const appOption = useAppOptionStore();
const userSession = useUserSessionStore();

export default {
	data(){
		return {
			username:null,
			password:null,
			notification_message:null
		}
	},
	mounted() {
		appOption.appSidebarHide = true;
		appOption.appHeaderHide = true;
		appOption.appContentClass = 'p-0';
	},
	beforeUnmount() {
		appOption.appSidebarHide = false;
		appOption.appHeaderHide = false;
		appOption.appContentClass = '';
	},
	methods: {
		async submitForm() {
			let payload = {'username':this.username,'password':this.password}
			let data = await userRequest("api-user-login",payload)
			if(data.request.status == 200){
				let token = data.data.token
				let username = data.data.username
				let access_token = data.data.access_token
				sessionStorage.setItem("token",token)
				sessionStorage.setItem("username",username)
				this.$router.push('/page/profile');
			} else {
				let message = "Login Failed, Your account may be blocked by some reasons"
				this.showToast(message)
			}
			//this.$router.push('/');
		},
		showToast(message) {
		  //event.preventDefault();
		  var toast = new Toast(document.getElementById('toast-1'));
		  this.notification_message = message
		  toast.show();
		}
	},
	created(){
		//console.log(userSession.token)
		sessionStorage.removeItem("username")
		sessionStorage.removeItem("token")
	}
}
</script>
<template>
	<div class="toasts-container">
    <div class="toast fade hide" data-autohide="false" id="toast-1">
      <div class="toast-header">
        <i class="far fa-bell text-muted me-2"></i>
        <strong class="me-auto">Alert</strong>
        <small></small>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">
        {{notification_message}}
      </div>
    </div>
  </div>
	<!-- BEGIN login -->
	<div class="login">
		<!-- BEGIN login-content -->
		<div class="login-content">
			<form v-on:submit.prevent="submitForm()" method="POST" name="login_form">
				<h1 class="text-center">CloudMedia Business Solution Platform</h1>
				<div class="text-muted text-center mb-4">
					Please Sign in
				</div>
				<div class="mb-3">
					<label class="form-label">Username</label>
					<input type="text" class="form-control form-control-lg fs-15px" placeholder="username" v-model="username"/>
				</div>
				<div class="mb-3">
					<div class="d-flex">
						<label class="form-label">Password</label>
						<a href="/page/forgot_password" class="ms-auto text-muted">Forgot password?</a>
					</div>
					<input type="password" class="form-control form-control-lg fs-15px" placeholder="Enter your password" v-model="password"/>
				</div>
				<button type="submit" class="btn btn-theme btn-lg d-block w-100 fw-500 mb-3">Sign In</button>
				<div class="text-center text-muted">
					Don't have an account yet? <RouterLink to="/page/register">Sign up</RouterLink>.
				</div>
			</form>
		</div>
		<!-- END login-content -->
	</div>
	<!-- END login -->
</template>
