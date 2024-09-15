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

const router = useRouter()

let username = ref(null)
let token = ref(null)
let notification_message = ref(null)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

let whatsapp_accounts = ref([])
let fbcode = ref(null)
let phone_number = ref(null)
let waba = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let catalogs = ref([])
let catalog_link = ref(null)
let is_cart_enabled = ref(null)
let is_catalog_visible = ref(null)

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  whatsapp_accounts.value = data['data']['whatsapp_accounts']
  console.log(whatsapp_accounts.value)
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

function selectWaBa(waba_id,phone_number_id,phone_number){
  selected_waba_account.value = waba_id
  selected_phone_number_id.value = phone_number_id
  get_business_account(phone_number)
  whatsapp_commerce_setting()
}

function closeModal(){
  var toast = new Toast(document.getElementById("modalLg"));
  toast.hide();
}

async function get_business_account(phone_number){
	let payload = {}
	payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
  let data = await postRequest("get_business_account",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      console.log(data['data'])
			catalogs.value = data['data']['catalogs']['data']
      if(catalogs.value.length > 0){
        catalog_link.value = "https://wa.me/c/" + phone_number.replace(/[ +]/g, "")
      }
		}
  }
}

async function whatsapp_commerce_setting(){
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
  let data = await postRequest("whatsapp_commerce_setting",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      is_cart_enabled.value = data['data']['data'][0]['is_cart_enabled']
      is_catalog_visible.value = data['data']['data'][0]['is_catalog_visible']
		}
  }
}

async function update_cart_status(status){
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
  payload['status'] = status
  let data = await postRequest("update_cart_status",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      whatsapp_commerce_setting()
		}
  }
}

async function visible_catalog_icon(status){
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
  payload['status'] = status
  let data = await postRequest("visible_catalog_icon",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      whatsapp_commerce_setting()
		}
  }
}

checkLogin()
checkWaba()



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
          <h5 class="modal-title">Copy Catalog Link</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          {{catalog_link}}
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
              <div class="flex-fill fw-bold fs-16px">Select phone number for copying below catalog link</div>
            </div>
            <div class="form-group mb-3">
              <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="selectWaBa(account.waba_id,account.phone_number_id,account.phone_number)" v-for="account in whatsapp_accounts">{{account.phone_number}}</button>
            </div>
            <div class="form-group mb-6" v-if="selected_phone_number_id">
              <fragment>
                <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="update_cart_status('false')" v-if="is_cart_enabled">unable catalog</button>
                <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="update_cart_status('true')" v-else>enable catalog</button>
              </fragment>
              <fragment>
                <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="visible_catalog_icon('false')" v-if="is_catalog_visible">catalog icon invisible</button>
                <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="visible_catalog_icon('true')" v-else>catalog icon visible</button>
              </fragment>
            </div>
          </div>
        </div>
        <div class="row" v-else>
          <div class="col-xl-9">
            <div class="form-group mb-3">
              <div class="flex-fill fw-bold fs-16px">Please add whatsapp account</div>
            </div>
          </div>
        </div>
        <hr>
        <div class="row" v-if="catalog_link">
          <div class="col-xl-9">
            <div class="form-group mb-3">
              <div class="flex-fill fw-bold fs-16px">Whatsapp Catalog Link</div>
            </div>
            <div class="form-group mb-3">
              <div class="flex-fill fw-bold fs-16px">{{catalog_link}}</div>
            </div>
          </div>
        </div>
        <hr v-if="catalog_link">
    </card-body>
	</card>


</template>
