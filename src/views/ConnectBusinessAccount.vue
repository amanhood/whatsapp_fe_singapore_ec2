<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest,putRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';

const router = useRouter()

let username = ref(null)
let token = ref(null)
let whatsapp_accounts = ref([])
let select_account = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let selected_phone_number = ref(null)
let business_account_id = ref(null)
let input_business_account_id = ref(null)
let notification_message = ref(null)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  data['data']['whatsapp_accounts'].forEach((item, i) => {
    whatsapp_accounts.value.push({'id':item.phone_number_id,'value':item.phone_number,'waba':item.waba_id})
  });
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
      if(data['data']['catalogs']['error']){
        let message = data['data']['catalogs']['error']['message']
				showToast(message)
			} else {
        if(data['data']['business_account_id']){
  				business_account_id.value = data['data']['business_account_id']
  			}
			}
		}
  }
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
			}
		}
  }
}

function selectAccount(){
  selected_phone_number_id.value = select_account.value.id
  selected_waba_account.value = select_account.value.waba
  selected_phone_number.value = select_account.value.value
  get_business_account(selected_phone_number.value)
}

function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
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

  <card>
    <card-body class="pb-2">
      <div class="row">
        <div class="col-md-6">
          <div class="row" style="margin-bottom:10px;">
            <div class="flex-fill fw-bold fs-16px">Select phone number</div>
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

    <fragment v-if="select_account && !business_account_id">
      <card-body class="pb-2">
        <div class="row">
          <div class="col-xl-6">
            <div class="form-group mb-3">
              <div class="flex-fill fw-bold fs-16px">
                Meta Business Manager -> Business settings. Select Business info from the sidebar. <br>
                Below your business portfolio name, you'll find your business ID number.
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Business account id</label>
                <input type="number" class="form-control ps-35px" placeholder="" v-model="input_business_account_id"/>
              </div>
            </div>
            <div class="row" id="marin_top_20">
              <div class="col-md-4">
                <button class="btn btn-teal mb-1 me-1" type="button" @click="addBusinessAccount"><span class="d-none d-md-inline">Add business account id</span></button>
              </div>
            </div>
          </div>
          <hr id="marin_top_20">
        </div>
      </card-body>
    </fragment>

    <card-body class="pb-2">

    </card-body>
  </card>
</template>

<style scoped>
.form-label {
  font-weight:bold;
}
#marin_top_20 {
  margin-top:20px;
}
</style>
