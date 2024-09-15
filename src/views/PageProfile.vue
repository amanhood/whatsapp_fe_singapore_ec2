<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import TemplateComponents from './TemplateComponents.vue'
import CreateTemplate from './CreateTemplate.vue'
import LtoTemplate from './LtoTemplate.vue'
import DocsTemplate from './DocsTemplate.vue'
import ProductsTemplate from './ProductsTemplate.vue'
import FlowTemplate from './FlowTemplate.vue'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';

const userSession = useUserSessionStore();
const router = useRouter()

let templates = ref([])
let fixed_templates = ref([])
let template_components = ref([])
let template_name = ref(null)
let template_category = ref(null)
let username = ref(null)
let token = ref(null)
let fb_login_error_message = ref(null)
let selected_category = ref(null)
let selected_language = ref(null)
let categories = [
        { id:'MARKETING',title: "MARKETING" },
        { id:'UTILITY',title: "UTILITY" }
      ]
let languages = [
        { id:'zh_HK',title: "Chinese (HKG)" },
        { id:'en_US',title: "English (US)" },
        { id:'id',title: "Indonesia" },
        { id:'pt_BR',title: "Portugal" },
        { id:'es',title: "Spanish" }
      ]
let notification_message = ref(null)
//token = userSession.token
//username = userSession.username
//console.log(userSession.token)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
let whatsapp_accounts = ref([])
let fbcode = ref(null)
let phone_number = ref(null)
let waba = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)


function selectCategory(){

}

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

function displayTemplate(components,name,category){
  template_components.value = []
  template_components.value = components
  template_name = name
  template_category = category
}

async function getTemplates(waba_id,phone_number_id){
  templates.value = []
  fixed_templates.value = []
  if(whatsapp_accounts.value.length > 0){
    let payload = {}
    payload['waba_id'] = waba_id
    payload['phone_number_id'] = phone_number_id
    let data = await postRequest("get_fb_templates",payload,token)
    if(data['data']['error']){
      let error_message = data['data']['error']
      showToast(error_message['message'])
    } else {
      templates.value = data.data.data
      templates.value.forEach((item, i) => {
        item.components.forEach((sitem, i) => {
          if(sitem.type == "BUTTONS"){
            sitem.buttons.forEach((titem, i) => {
              if(titem.type == "MPM"){
                item['is_mpm'] = true
                item['can_delete'] = true
              } else {
                item['is_mpm'] = false
                if(titem.type == "FLOW"){
                  item['can_delete'] = false
                } else {
                  item['can_delete'] = true
                }
              }
            });
          }
        });
      });
      fixed_templates.value = templates.value
    }
  }
}

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  whatsapp_accounts.value = data['data']['whatsapp_accounts']
}

async function deleteTemplate(template_id,template_name){
  let data = await deleteRequest("delete_template/?template_id="+template_id+"&template_name="+template_name+"&waba_id="+ selected_waba_account.value+"&phone_number_id="+selected_phone_number_id.value,token)
  getTemplates(selected_waba_account.value,selected_phone_number_id.value)
}



function searchTemplates(){
  templates.value = fixed_templates.value
  let templates_result = []
  if(selected_language.value == null && selected_category.value == null){
    // all
    templates_result = fixed_templates.value
  } else if (selected_category.value != null && selected_language.value == null){
    templates_result = templates.value.filter(
      d => d.category == selected_category.value.id)
  } else if (selected_language.value != null && selected_category.value == null){
    templates_result = templates.value.filter(
      d => d.language == selected_language.value.id)
  } else {
    templates_result = templates.value.filter(
      d => d.category == selected_category.value.id &
           d.language == selected_language.value.id)
  }
  templates.value = templates_result
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

function selectWaBa(waba_id,phone_number_id){
  selected_waba_account.value = waba_id
  selected_phone_number_id.value = phone_number_id
  getTemplates(waba_id,phone_number_id)
}

function goMpmPage(template,selected_waba_account,selected_phone_number_id){
  router.push({
      path: '/page/set-mpm-message',
      state: {
        template: JSON.stringify(template),
        selected_waba_account:selected_waba_account,
        selected_phone_number_id:selected_phone_number_id
         // For complex objects, consider stringifying
      }
  });
}

function closeModal(){
  var toast = new Toast(document.getElementById("modalLg"));
  toast.hide();
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

  <div class="modal fade" id="modalLg">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{template_name}}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <template-components :template_name="template_name" :component="template_components" :template_category="template_category" @showtoast="showToast" @closeModal="closeModal" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id"></template-components>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

	<card>
    <card-body class="pb-2">
        <div class="row" style="margin-bottom:20px;">
          <div class="col-xl-6">
            <a href="#" class="btn btn-theme" id="fb_login" @click="logInWithFacebook()"><i class="fa fa-plus-circle fa-fw me-1"></i>Add whatsapp account</a>
          </div>
        </div>
        <hr>
        <div class="row" v-if="whatsapp_accounts.length > 0">
          <div class="col-xl-9">
            <div class="form-group mb-3">
              <div class="flex-fill fw-bold fs-16px">Select phone number for messaging</div>
            </div>
            <div class="form-group mb-3">
              <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="selectWaBa(account.waba_id,account.phone_number_id)" v-for="account in whatsapp_accounts">{{account.phone_number}}</button>
            </div>
          </div>
        </div>
        <div class="row" v-else>
          <div class="col-xl-9">
            <div class="form-group mb-3">
              <div class="flex-fill fw-bold fs-16px">Please add whatsapp account for messaging</div>
            </div>
          </div>
        </div>
        <hr>
    </card-body>

    <ul class="nav nav-tabs nav-tabs-v2 px-4" v-if="whatsapp_accounts.length > 0">
			<li class="nav-item me-3"><a href="#allTab" class="nav-link active px-2" data-bs-toggle="tab">Template</a></li>
			<li class="nav-item me-3" v-if="selected_phone_number_id"><a href="#createTemplate" class="nav-link px-2" data-bs-toggle="tab">Create Generic Template</a></li>
      <li class="nav-item me-3" v-if="selected_phone_number_id"><a href="#createLtoTemplate" class="nav-link px-2" data-bs-toggle="tab">Create Limited-Time Offer Template</a></li>
      <li class="nav-item me-3" v-if="selected_phone_number_id"><a href="#createDocsTemplate" class="nav-link px-2" data-bs-toggle="tab">Create Document Template</a></li>
      <li class="nav-item me-3" v-if="selected_phone_number_id"><a href="#createPrdouctsTemplate" class="nav-link px-2" data-bs-toggle="tab">Create Catalogue Template</a></li>
      <li class="nav-item me-3" v-if="selected_phone_number_id"><a href="#createFlowTemplate" class="nav-link px-2" data-bs-toggle="tab">Create Delivery Address Template</a></li>
		</ul>
		<div class="tab-content p-4" >
			<div class="tab-pane fade show active" id="allTab">
				<!-- BEGIN input-group -->
				<div class="mb-md-4 mb-3 d-md-flex">
      		<div class="ms-md-4 mt-md-0 mt-2">
            <v-select v-model="selected_category" :options="categories" label="title" @update:modelValue="selectCategory(event)"></v-select>
          </div>
      		<div class="ms-md-4 mt-md-0 mt-2">
            <v-select v-model="selected_language" :options="languages" label="title"></v-select>
          </div>
          <div class="ms-md-4 mt-md-0 mt-2">
      		    <button type="button" class="btn btn-default mb-1 me-1" @click="searchTemplates">Search</button>
          </div>
      	</div>

				<!-- BEGIN table -->
				<div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
								<th class="pt-0 pb-2">name</th>
								<th class="pt-0 pb-2">category</th>
								<th class="pt-0 pb-2">langauge</th>
								<th class="pt-0 pb-2">status</th>
                <th class="pt-0 pb-2">view</th>
                <th class="pt-0 pb-2">delete</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="template in templates">
								<td class="align-middle">{{template.name}}</td>
								<td class="align-middle">{{template.category}}</td>
								<td class="align-middle">{{template.language}}</td>
								<td class="align-middle">{{template.status}}</td>
                <td class="align-middle" v-if="template.is_mpm == true"><button type="button" @click="goMpmPage(template,selected_waba_account,selected_phone_number_id)" class="btn btn-default me-2">Multi-Product Message</button></td>
                <td class="align-middle" v-else><button type="button" @click="displayTemplate(template.components,template.name,template.category)" class="btn btn-default me-2" data-bs-toggle="modal" data-bs-target="#modalLg">General Message</button></td>
                <td class="align-middle" v-if="template.can_delete == true"><button type="button" @click="deleteTemplate(template.id,template.name)" class="btn btn-default me-2">delete</button></td>
                <td class="align-middle" v-else></td>
              </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
			</div>

      <div class="tab-pane fade show" id="createTemplate">
        <create-template @gettemplates="getTemplates(selected_waba_account,selected_phone_number_id)" @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id"></create-template>
      </div>
      <div class="tab-pane fade show" id="createLtoTemplate">
        <lto-template @gettemplates="getTemplates(selected_waba_account,selected_phone_number_id)" @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id"></lto-template>
      </div>
      <div class="tab-pane fade show" id="createDocsTemplate">
        <docs-template @gettemplates="getTemplates(selected_waba_account,selected_phone_number_id)" @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id"></docs-template>
      </div>
      <div class="tab-pane fade show" id="createPrdouctsTemplate">
        <products-template @gettemplates="getTemplates(selected_waba_account,selected_phone_number_id)" @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id"></products-template>
      </div>
      <div class="tab-pane fade show" id="createFlowTemplate">
        <flow-template @gettemplates="getTemplates(selected_waba_account,selected_phone_number_id)" @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id"></flow-template>
      </div>


		</div>

	</card>


</template>
