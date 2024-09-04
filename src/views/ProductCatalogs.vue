<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import draggable from 'vuedraggable'
import 'vue-select/dist/vue-select.css';

const router = useRouter()

let username = ref(null)
let token = ref(null)
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let catalogs = ref([])
let business_account_id = ref(null)
let input_business_account_id = ref(null)
let notification_message = ref(null)
let catalog_name = ref(null)
let selected_catalog = ref(null)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  whatsapp_accounts.value = data['data']['whatsapp_accounts']
}

async function selectWaBa(waba_id,phone_number_id){
  selected_waba_account.value = waba_id
  selected_phone_number_id.value = phone_number_id
  get_business_account()
}


async function addBusinessAccount(){
	let payload = {}
	payload['business_account_id'] = input_business_account_id.value
	payload['waba_id'] = selected_waba_account.value
	payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("add_business_account",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
      if(data['data']['catalogs']['error']){
        let message = data['data']['catalogs']['error']['message']
				showToast(message)
			} else {
				business_account_id.value = data['data']['business_account_id']
				catalogs.value = data['data']['catalogs']['data']
			}
		}
  }
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
      if(data['data']['catalogs']['error']){
        let message = data['data']['catalogs']['error']['message']
				showToast(message)
			} else {
        if(data['data']['business_account_id']){
  				business_account_id.value = data['data']['business_account_id']
  				catalogs.value = data['data']['catalogs']['data']
  			}
			}
		}
  }
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

function onMouseOver(catalog) {
  console.log(catalog)
  selected_catalog.value = catalog
}

async function addCatalog(){
  let payload = {}
	payload['catalog_name'] = catalog_name.value
  payload['business_account_id'] = business_account_id.value
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("add_product_catalog",payload,token)
  if(data.request.status == 200){
    get_business_account()
    catalog_name.value = null
  } else {
    console.log(data)
  }
}

async function editCatalog(catalog){
  let payload = {}
	payload['catalog_name'] = catalog.name
  payload['catalog_id'] = catalog.id
  payload['business_account_id'] = business_account_id.value
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("update_product_catalog",payload,token)
  if(data.request.status == 200){
    get_business_account()
    catalog_name.value = null
  } else {
    console.log(data)
  }
}

checkLogin()
checkWaba()
</script>

<style scoped>
#margin_top_10 {
  margin-top:10px;
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
    <card-body class="pb-2">
      <div class="row" v-if="whatsapp_accounts.length > 0">
        <div class="col-xl-9">
          <div class="form-group mb-3">
            <div class="flex-fill fw-bold fs-16px">Select business whatsapp account for creating product catalogues</div>
          </div>
          <div class="form-group mb-3">
            <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="selectWaBa(account.waba_id,account.phone_number_id)" v-for="account in whatsapp_accounts">{{account.phone_number}}</button>
          </div>
        </div>
        <hr>
      </div>
    </card-body>

    <fragment v-if="selected_waba_account">
      <card-body class="pb-2" v-if="!business_account_id">
          <div class="row">
            <div class="col-xl-12">
              <div class="form-group mb-3">
                <div class="flex-fill fw-bold fs-16px">At Meta Business Manager, Go to Business settings. Select Business info from the sidebar. Below your business portfolio name, you'll find your business ID number.</div>
              </div>
            </div>
          </div>
      </card-body>

      <card-body class="pb-2" v-if="!business_account_id">
          <div class="row">
            <div class="col-md-6">
              <div class="row">
                <div class="col-md-8">
                  <input type="number" class="form-control ps-35px" placeholder="add business account id and get catalogs" v-model="input_business_account_id"/>
                </div>
                <div class="col-md-4">
                  <button class="btn btn-default rounded-0" type="button" @click="addBusinessAccount"><span class="d-none d-md-inline">Add</span></button>
                </div>
              </div>
            </div>
          </div>
          <hr>
      </card-body>
    </fragment>


    <card-body class="pb-2" v-if="business_account_id">
      <div class="row">
        <div class="col-xl-3" style="border:1px solid #ccc;">
          <div class="flex-fill fw-bold fs-16px" style="margin-top:10px;margin-bottom:10px;">Product Catalogues</div>

          <div class="row" v-for="catalog in catalogs" v-if="catalogs.length > 0">
            <div class="row" style="margin-bottom:10px;">
              <div class="col-md-10">
                <input type="text" class="form-control" placeholder="Title" v-model="catalog.name" @mouseover="onMouseOver(catalog)">
              </div>
              <div class="col-md-2">
                <button type="button" class="btn btn-default mb-1 me-1" @click="editCatalog(catalog)">Edit</button>
              </div>
            </div>
            <hr>
          </div>


          <div class="row">
            <div class="row" id="margin_top_10">
              <div class="col-md-10">
                <input type="text" class="form-control" placeholder="Catalog Name" v-model="catalog_name">
              </div>
            </div>
            <div class="form-group mb-3" id="margin_top_10">
              <button type="button" class="btn btn-default mb-1 me-1" @click="addCatalog">Add Catalog</button>
            </div>
          </div>
        </div>

        <div class="col-xl-9" style="border-right:1px solid #ccc;border-top:1px solid #ccc;border-bottom:1px solid #ccc;">
          <div class="flex-fill fw-bold fs-16px" id="margin_top_10">Content</div>

        </div>
      </div>
      <!-- END row -->
    </card-body>
  </card>
</template>
