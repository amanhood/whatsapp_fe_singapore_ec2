<script>
import { useAppOptionStore } from '@/stores/app-option';
import { useUserSessionStore } from '@/stores/user-session';
import { useRouter, RouterLink } from 'vue-router';
import { userRequest,postRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import axios from "axios";

const appOption = useAppOptionStore();
const userSession = useUserSessionStore();

export default {
	data(){
		return {
			password:null,
			notification_message:null,
      token:null
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
      let result = this.validatePassword(this.password)
      if(result){
				const data = {
					token: this.token,
					password: this.password
				}
        let response = await axios.post(`https://biz-api.com/api/password_reset/confirm/?token=${data.token}`,data)
        if(response.request.status == 200){
          this.showToast("Success, please login")
					this.$router.push('/page/login');
  			} else if(response.request.status == 400) {
  				console.log("ok")
  			}
      } else {
        this.showToast("mininum 8 characters with at least 1 Upper case letter, 1 lower case letter, 1 special character")
      }
		},
		showToast(message) {
		  //event.preventDefault();
		  var toast = new Toast(document.getElementById('toast-1'));
		  this.notification_message = message
		  toast.show();
		},
    getToken(){
      this.token = this.$route.params.ref
      console.log(this.token)
    },
    validatePassword(password) {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return regex.test(password);
    }
	},
	created(){
		//console.log(userSession.token)
		sessionStorage.removeItem("username")
		sessionStorage.removeItem("token")
    this.getToken()
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
					Retrieve Password
				</div>
				<div class="mb-3">
					<input type="password" class="form-control form-control-lg fs-15px" placeholder="password" v-model="password"/>
				</div>

				<button type="submit" class="btn btn-theme btn-lg d-block w-100 fw-500 mb-3">Reset Password</button>

			</form>
		</div>
		<!-- END login-content -->
	</div>
	<!-- END login -->
</template>
