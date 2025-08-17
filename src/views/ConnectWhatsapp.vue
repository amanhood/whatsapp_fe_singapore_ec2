<script setup>
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
const router = useRouter()

let username = ref(null)
let token = ref(null)
let role = ref(null)
let fb_login_error_message = ref(null)
let notification_message = ref(null)
//token = userSession.token
//username = userSession.username
//console.log(userSession.token)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")
let whatsapp_accounts = ref([])
let fbcode = ref(null)
let phone_number = ref(null)
let waba = ref(null)


async function generateClientAccessToken(fbcode,waba,phone_number,token){
  let payload = {}
  payload['code'] = fbcode
  payload['phone_number_id'] = phone_number
  payload['waba_id'] = waba
  let data = await postRequest("generate_fb_client_access_token",payload,token)
  if(data.request.status == 200){
    checkWaba()
  }
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  whatsapp_accounts.value = data['data']['whatsapp_accounts']
  console.log(whatsapp_accounts.value)
  data['data']['whatsapp_accounts'].forEach(element => {
    let waba_id = element['waba_id']
    let phone_number_id = element['phone_number_id']
    let permissions = getPermissions(phone_number_id,waba_id)
  });
}

function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if(role.value == 'child'){
        router.push('/page/login');
    } 
  }
}

async function getPermissions(phone_number_id,waba_id,){
  let payload = {}
  payload['waba_id'] = waba_id
  payload['phone_number_id'] = phone_number_id
  let response = await postRequest("get_fb_permissions",payload,token)
  if(response.request.status == 200){
    const acc = whatsapp_accounts.value.find(wa => wa.waba_id === waba_id)
    if (acc){
      acc['permissions'] = JSON.parse(response['data']['permissions'])
    }
  } else {
    notification_message.value = "Failed to create choice template"
    showToast(notification_message.value)
  }
}

function hasCatalogManagement(permissions) {
  return !!permissions?.data?.some(
    p => p.permission === "catalog_management" && p.status === "granted"
  );
}


function go_marketing_templates(){
  router.push({
      path: '/page/marketing-templates'
  });
}

function go_message(){
  router.push({
      path: '/page/check-messages'
  });
}

function go_landing_pages(){
  router.push({
      path: '/page/landing-pages'
  });
}

function go_auto_reply(){
  router.push({
      path: '/page/flow-index'
  });
}

function go_ecommerce(){
  router.push({
      path: '/page/whatsapp-ecommerce'
  });
}

function go_order(){
  router.push({
      path: '/page/order'
  });
}

checkLogin()
checkWaba()
//getTemplates()

window.fbAsyncInit = ()=> {
  window.FB.init({
    appId: "1060499497949619", //You will need to change this
    cookie: true, // This is important, it's not enabled by default
    xfbml: true,
    version: "v17.0"
  });
};

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));

function logInWithFacebook() {
  FB.login((response)=>
    {
      if (response.authResponse) {
        const accessToken = response.authResponse.accessToken;
        var code = response.authResponse.code
        fbcode.value = code
        generateClientAccessToken(fbcode.value,waba.value,phone_number.value,token)
        // The returned code must be transmitted to your backend,
        // which will perform a server-to-server call from there to our servers for an access token
      } else {
        fb_login_error_message = 'User cancelled login or did not fully authorize.'
      }
    },
    {
      "config_id": 1058568108496704, // configuration ID goes here
      "response_type": "code",    // must be set to 'code' for System User access token
      "override_default_response_type": true, // when true, any response types passed in the "response_type" will take precedence over the default types
      "scope":"business_management, whatsapp_business_management, whatsapp_business_messaging,catalog_management",
      "extras": {
        "sessionInfoVersion": 2,  //  Receive Session Logging Info
      }
    }
  )
}

const sessionInfoListener = (event) => {
  if (event.origin !== "https://www.facebook.com") return;
  try {
    const data = JSON.parse(event.data);
    if (data.type === 'WA_EMBEDDED_SIGNUP') {
      // if user finishes the Embedded Signup flow
      if (data.event === 'FINISH') {
        const {phone_number_id, waba_id} = data.data;
        phone_number.value = phone_number_id
        waba.value = waba_id
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
};


window.addEventListener('message', sessionInfoListener);

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
	<card>
    <card-body class="pb-2">
        <div class="row" style="margin-bottom:20px;">
          <div class="col-xl-6">
            <a href="#" class="btn btn-theme" id="fb_login" @click="logInWithFacebook()"><i class="fa fa-plus-circle fa-fw me-1"></i>Connect Whatsapp Account</a>
             
          </div>
        </div>
        <div class="row" v-if="whatsapp_accounts.length > 0">
          <div class="col-xl-12">
            <div class="table-responsive">
              <table class="table table-hover text-nowrap">
    						<thead>
    							<tr>
    								<th class="border-top-0 pt-0 pb-2">Whatsapp account</th>
                    <th class="border-top-0 pt-0 pb-2">Messaging with customers</th>
                    <th class="border-top-0 pt-0 pb-2">Marketing message templates</th>
    								<th class="border-top-0 pt-0 pb-2">Auto Reply of Whatsapp Account</th>
                    <th class="border-top-0 pt-0 pb-2">Landing Pages</th>
    								<th class="border-top-0 pt-0 pb-2">Whatsapp Ecommerce</th>
                    <th class="border-top-0 pt-0 pb-2">Check Ecommerce orders</th>
    							</tr>
    						</thead>
                <tbody>
    							<tr v-for="account in whatsapp_accounts" v-if="whatsapp_accounts.length > 0">
    								<td class="align-middle">{{account.phone_number}}</td>
                    <td class="align-middle"><button type="button" class="btn btn-yellow" @click="go_message">Access</button></td>
                    <td class="align-middle"><button type="button" class="btn btn-yellow" @click="go_marketing_templates">Access</button></td>
                    <td class="align-middle"><button type="button" class="btn btn-yellow" @click="go_auto_reply">Access</button></td>
                    <td class="align-middle"><button type="button" class="btn btn-yellow" @click="go_landing_pages">Access</button></td>
    								<template v-if="hasCatalogManagement(account.permissions)">
                      <td class="align-middle"><button type="button" class="btn btn-yellow" @click="go_ecommerce">Access</button></td>
                      <td class="align-middle"><button type="button" class="btn btn-yellow" @click="go_order">Access</button></td>
                    </template>
                    <template v-else>
                      <td class="align-middle"><button type="button" class="btn btn-primary" @click="go_ecommerce">Grant Permission</button></td>
                      <td class="align-middle"><button type="button" class="btn btn-primary" @click="go_ecommerce">Grant Permission</button></td>
                    </template>
                    
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

    </card-body>
	</card>


</template>
