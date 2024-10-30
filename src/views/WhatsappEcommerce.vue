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
let catalogs = ref([])
let catalog_link = ref(null)

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
          console.log(business_account_id.value)
  				catalogs.value = data['data']['catalogs']['data']
          if(catalogs.value.length > 0){
            catalog_link.value = "https://wa.me/c/" + phone_number.replace(/[ +]/g, "")
          }
  			}
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

function go(){
  router.push({
      path: '/page/connect-business-account'
  });
}


checkLogin()
checkWaba()

</script>

<template>
  <div class="modal fade" id="modalLg">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm to delete ?</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">

        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

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
          <div class="row">
            <div class="flex-fill fw-bold fs-16px">Select phone number</div>
          </div>
          <div class="row" id="marin_top_10">
            <div class="col-md-6">
              <v-select v-model="select_account" :options="whatsapp_accounts" label="value" @update:modelValue="selectAccount"></v-select>
            </div>
          </div>

          <div class="row" id="marin_top_10">
            <div class="col-md-6">
              <button type="button" class="btn btn-yellow me-2" data-bs-toggle="modal" data-bs-target="#modalLg">Cart setting</button>
            </div>
          </div>


        </div>
      </div>
    </card-body>
    <hr>


    <card-body class="pb-2" v-if="business_account_id">

    </card-body>

    <card-body class="pb-2" v-if="select_account && !business_account_id">
      <div class="alert alert-warning">
        <strong>Ohh, No business account!</strong> <a href="#" @click="go">Please connect your business account id</a>
      </div>
    </card-body>
  </card>
</template>

<style scoped>
.form-label {
  font-weight:bold;
}
#marin_top_10 {
  margin-top:10px;
}
</style>
