<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch,onMounted, onUnmounted,getCurrentInstance } from 'vue'
import { getRequest,postRequest,deleteRequest} from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import draggable from 'vuedraggable'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import Loading from 'vue-loading-overlay';
import { responseMessage } from '../composables/response_message.js'
import readXlsxFile from 'read-excel-file'
import TemplateComponents from './TemplateComponents.vue'
import 'vue-select/dist/vue-select.css';
import 'vue-loading-overlay/dist/css/index.css';

const router = useRouter()

let spin_loading = ref(false)
let username = ref(null)
let token = ref(null)
let template = ref(null)
let select_account = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let recipient = ref(null)
let contacts = ref([])
let whatsapp_accounts = ref([])
let template_name = ref(null)
let template_category = ref(null)
let template_components = ref([])
let notification_message = ref(null)
let template_type = ref(false)
let business_account_id = ref(null)
let selected_catalog = ref(null)
let connected_catalog = ref([])
let catalogues = ref([])
let products = ref([])


token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
const state = history.state
template = JSON.parse(state.template)

function updateTemplateComponent(){
  template_components.value = template.components
}


function selectAccount(){
  selected_phone_number_id.value = select_account.value.id
  selected_waba_account.value = select_account.value.waba
  template_name.value = template.name
  template_category.value = template.category
  get_business_account()
}


async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  data['data']['whatsapp_accounts'].forEach((item, i) => {
    whatsapp_accounts.value.push({'id':item.phone_number_id,'value':item.phone_number,'waba':item.waba_id})
  });
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

function checkProductTemplate(){
  template.components.forEach((sitem, i) => {
    if(sitem.type == "BUTTONS"){
      sitem.buttons.forEach((titem, i) => {
        if(titem.type == "MPM" || titem.type == "CATALOG"){
          template_type.value = "product"
        } else {
          template_type.value = "non-product"
        }
      });
    }
  });
}

async function get_business_account(){
	let payload = {}
	payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("get_business_account",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
			if(data['data']['business_account_id']){
				business_account_id.value = data['data']['business_account_id']
				catalogues.value = data['data']['catalogs']['data']
        checkConnectedCatalogue()
			}
		}
  }
}

async function checkConnectedCatalogue(){
  spin_loading.value = true
  let payload = {}
	payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
	let response = await postRequest("get_connected_catalog",payload,token)
  if(response.request.status == 200){
		if(response['data']['error']){
			let message = response['data']['error']['message']
			showToast(message)
		} else {
			connected_catalog.value = response['data']['data']
      selected_catalog.value = connected_catalog.value
      if(selected_catalog.value.length > 0){
        showProducts(selected_catalog.value[0].id)
      }
		}
  }
  spin_loading.value = false
}

async function connectCatalogue(){
  spin_loading.value = true
  console.log(selected_catalog.value)
  let payload = {}
	payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
  payload['catalog_id'] = selected_catalog.value.id
  let response = await postRequest("connect_catalog",payload,token)
	if(response.request.status == 200){
		if(response['data']['error']){
			let message = response['data']['error']['error_user_msg']
			showToast(message)
		} else {
			checkConnectedCatalogue()
      showProducts(selected_catalog.value.id)
      console.log(products.value)
		}
  }
  spin_loading.value = false
}

async function showProducts(catalog_id){
  let payload = {}
  payload['catalog_id'] = catalog_id
  payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
  let data = await postRequest("show_products",payload,token)
  if(data.request.status == 200){
    products.value = data['data']
  } else {
    let message = "error to load products"
		showToast(message)
	}
}

checkWaba()
updateTemplateComponent()
checkProductTemplate()
</script>

<style scoped>

.ps {
  max-height: 500px; /* or height: 100px; */
}
</style>

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
    <loading v-model:active="spin_loading"
                 :is-full-page="true"/>
    <card-body class="pb-2">
      <div class="row">
        <div class="col-md-12">
          <div class="row" style="margin-bottom:10px;">
            <div class="flex-fill fw-bold fs-16px">Select sender</div>
          </div>
          <div class="row">
            <div class="col-md-6">
              <v-select v-model="select_account" :options="whatsapp_accounts" label="value" @update:modelValue="selectAccount"></v-select>
            </div>
          </div>
        </div>
      </div>
    </card-body>
    <hr>
    <fragment v-if="template_type == 'product'">
      <card-body class="pb-2" v-if="business_account_id">
        <div class="row">
          <div class="col-md-12">
            <div class="row" style="margin-bottom:10px;">
              <div class="flex-fill fw-bold fs-16px">Catalogue</div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <v-select v-model="selected_catalog" :options="catalogues" label="name" @update:modelValue="connectCatalogue"></v-select>
              </div>
            </div>
          </div> 
        </div>
      </card-body>
      <card-body class="pb-2" v-else>
        <div class="row">
          <div class="alert alert-warning">
            <strong>Ohh, No business account!</strong> <a href="#" @click="go">Please connect your business account id</a>
          </div>
        </div>
      </card-body>
      <hr>
    </fragment>

    <fragment v-if="selected_waba_account && template_type == 'non-product'">
      <template-components :template_name="template_name" :component="template_components" :template_category="template_category" @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" :template_type="template_type" :business_account_id="business_account_id" :products="products"></template-components>
    </fragment>
    <fragment v-else-if="selected_waba_account && template_type == 'product' && business_account_id && connected_catalog.length > 0">
      <template-components :template_name="template_name" :component="template_components" :template_category="template_category" @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" :template_type="template_type" :business_account_id="business_account_id" :products="products"></template-components>
    </fragment>
    <fragment v-if="template_category == 'UTILITY'">
      <template-components :template_name="template_name" :component="template_components" :template_category="template_category" @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" :template_type="template_type" :business_account_id="business_account_id" :products="products"></template-components>
    </fragment>
    
    
  </card>

</template>
