<script>
import { useAppOptionStore } from '@/stores/app-option';
import { useRouter, RouterLink } from 'vue-router';
import { userRequest } from '../composables/api.js'

const appOption = useAppOptionStore();

export default {
	data(){
		return {
			username:null,
			email:null,
			password:null,
			confirmed_password:null,
			email_error_message:null,
			password_error_message:null,
			is_button_shown:true,
			register_error_message:null
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
			let payload = {'email':this.email,'username':this.username,'password':this.password}
			let data = await userRequest("register",payload)
			if(data.request.status == 201){
				alert("login success")
				this.$router.push('/page/login');
			} else {
				this.register_error_message = "Failed to register a new user"
			}
			//this.$router.push('/');
		},
		validateEmail(email) {
			if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
				this.email_error_message = null
						this.is_button_shown = true
			} else {
				this.email_error_message = "Invalid email address"
						this.is_button_shown = false
			}
		},
		confirmPassword(confirm_password){
			if (confirm_password == this.password){
				this.password_error_message = null
				this.is_button_shown = true
			} else {
				this.password_error_message = "Confirm password does not match with password"
				this.is_button_shown = false
			}
		}
	},
	watch: {
		email(value){
		this.email = value;
		this.validateEmail(value);
		},
		confirmed_password(value){
			this.confirmPassword(value)
		}
	}
}
</script>
<template>
	<!-- BEGIN register -->
	<div class="register">
		<!-- BEGIN register-content -->
		<div class="register-content">
			<form v-on:submit.prevent="submitForm()" method="POST" name="register_form">
				<p :style="{color: 'red'}">{{ register_error_message }}</p>
				<h1 class="text-center">Sign Up</h1>
				<div class="mb-3">
					<label class="form-label">Name <span class="text-danger">*</span></label>
					<input type="text" class="form-control form-control-lg fs-15px" placeholder="e.g John Smith" v-model="username" required/>
				</div>
				<div class="mb-3">
					<label class="form-label">Email Address <span class="text-danger">*</span></label>
					<input type="text" class="form-control form-control-lg fs-15px" placeholder="username@address.com" v-model="email" required/>
				</div>
				<p :style="{color: 'red'}">{{ email_error_message }}</p>
				<div class="mb-3">
					<label class="form-label">Password <span class="text-danger">*</span></label>
					<input type="password" class="form-control form-control-lg fs-15px" v-model="password" required/>
				</div>
				<div class="mb-3">
					<label class="form-label">Confirm Password <span class="text-danger">*</span></label>
					<input type="password" class="form-control form-control-lg fs-15px" v-model="confirmed_password" required/>
				</div>
				<p :style="{color: 'red'}">{{ password_error_message }}</p>
				<div class="mb-3">
					<button type="submit" class="btn btn-theme btn-lg fs-15px fw-500 d-block w-100" v-if="is_button_shown">Sign Up</button>
				</div>
				<div class="text-muted text-center">
					Already have an Admin ID? <a href="/page/login">Sign In</a>
				</div>
			</form>
		</div>
		<!-- END register-content -->
	</div>
	<!-- END register -->
</template>
