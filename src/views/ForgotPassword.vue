<script>
import { useAppOptionStore } from '@/stores/app-option';
import { useUserSessionStore } from '@/stores/user-session';
import { useRouter, RouterLink } from 'vue-router';
import { userRequest,postRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';

const appOption = useAppOptionStore();
const userSession = useUserSessionStore();

export default {
	data(){
		return {
			email:null,
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
		async retrieve_password() {
			let payload = {'email':this.email}
			let data = await userRequest("password_reset",payload)
			if(data.request.status == 200){
        this.showToast("Success, please check your email for retrieve password")
			} else if(data.request.status == 400) {
				console.log(data['response']['data']['email'][0])
				this.showToast(data['response']['data']['email'][0])
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
			<form v-on:submit.prevent="retrieve_password()" method="POST" name="login_form">
				<h1 class="text-center">CloudMedia Business Solution Platform</h1>
				<div class="text-muted text-center mb-4">
					Forgot Password
				</div>
				<div class="mb-3">
					<input type="email" class="form-control form-control-lg fs-15px" placeholder="email" v-model="email"/>
				</div>

				<button type="submit" class="btn btn-theme btn-lg d-block w-100 fw-500 mb-3">Retrieve password</button>

			</form>
		</div>
		<!-- END login-content -->
	</div>
	<!-- END login -->
</template>
