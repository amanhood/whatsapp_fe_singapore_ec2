<script>
import { useAppOptionStore } from '@/stores/app-option';
import { useRouter, RouterLink } from 'vue-router';
const appOption = useAppOptionStore();


export default {
	data(){
		return {
			is_fb_logged_in:false
		}
	},
	created(){
		this.initFacebook();
		this.loadFacebookSDK(document, "script", "facebook-jssdk");
	},
	mounted(){
		appOption.appSidebarHide = true;
		appOption.appHeaderHide = true;
		appOption.appContentClass = 'p-0';
		//window.addEventListener("message", (event) => {
		//	this.sessionInfoListener(event)
		//})
	},
	beforeUnmount() {
		appOption.appSidebarHide = false;
		appOption.appHeaderHide = false;
		appOption.appContentClass = '';
	},
	methods: {
		sessionInfoListener(event){
			if (event.origin !== "https://www.facebook.com") return;
		  try {
		    const data = JSON.parse(event.data);
		    if (data.type === 'WA_EMBEDDED_SIGNUP') {
		      // if user finishes the Embedded Signup flow
		      if (data.event === 'FINISH') {
		        const {phone_number_id, waba_id} = data.data;
		      }
		      // if user cancels the Embedded Signup flow
		      else {
		       const{current_step} = data.data;
		      }
		    }
		  } catch {
		    // Don’t parse info that’s not a JSON
		    console.log('Non JSON Response', event.data);
		  }
		},
		logInWithFacebook() {
			window.addEventListener("message", (event) => {
				this.sessionInfoListener(event)
			})
      // Launch Facebook login
	    FB.login((response)=>
			  {
		    	if (response.authResponse) {
		        const accessToken = response.authResponse.accessToken;
						console.log(response.authResponse)
						this.is_fb_logged_in = true
						// The returned code must be transmitted to your backend,
		  			// which will perform a server-to-server call from there to our servers for an access token
		    	} else {
		        console.log('User cancelled login or did not fully authorize.');
		      }
		    },
				{
		      config_id: '1058568108496704', // configuration ID goes here
		      response_type: 'code',    // must be set to 'code' for System User access token
		      override_default_response_type: true, // when true, any response types passed in the "response_type" will take precedence over the default types
					scope:"business_management,whatsapp_business_management",
					extras:{
						feature:"whatsapp_embedded_signup",
						version:2,
						sessionInfoVersion: 1,
						setup: {
		          // Prefilled data can go here
		        }
					}
	    	}
			);
      return false;
    },
		initFacebook() {
      window.fbAsyncInit = ()=> {
        window.FB.init({
          appId: "1060499497949619", //You will need to change this
          cookie: true, // This is important, it's not enabled by default
					xfbml: true,
          version: "v17.0"
        });
      };
    },
		loadFacebookSDK(d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }
	}
}
</script>
<template>
	<!-- BEGIN login -->
	<div class="login">
		<!-- BEGIN login-content -->
		<div class="login-content">
			<form v-on:submit.prevent="logInWithFacebook()" method="POST" name="login_form" v-if="!is_fb_logged_in">
				<h1 class="text-center">Sign In</h1>
				<div class="text-muted text-center mb-4">
					For your protection, please verify your identity.
				</div>
				<button type="submit" class="btn btn-theme btn-lg d-block w-100 fw-500 mb-3"> Login with Facebook</button>
			</form>

			<div class="text-muted text-center mb-4" v-else>
				Facebook Logged In
			</div>

		</div>
		<!-- END login-content -->
	</div>
	<!-- END login -->
</template>
