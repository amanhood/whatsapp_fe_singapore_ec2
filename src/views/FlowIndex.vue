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
let role = ref(null)
let whatsapp_accounts = ref([])
let select_account = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let selected_phone_number = ref(null)
let auto_reply_messages = ref([])
let selected_message = ref(null)


token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")

function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if (role.value != 'parent'){
        router.push('/page/login');
    } 
  }
}

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  data['data']['whatsapp_accounts'].forEach((item, i) => {
    whatsapp_accounts.value.push({'id':item.phone_number_id,'value':item.phone_number,'waba':item.waba_id})
  });
}

function selectAccount(){
  selected_phone_number_id.value = select_account.value.id
  selected_waba_account.value = select_account.value.waba
  selected_phone_number.value = select_account.value.value
  getAutoReplyMessages()
}


async function getAutoReplyMessages(){
  let payload = {}
  let response_message = null
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  let data = await postRequest("get_auto_reply_messages",payload,token)
  if(data.request.status == 200){
    auto_reply_messages.value = data['data']
  } else {
    response_message = "Failed to get auto reply messages"
    showToast(response_message)
  }
}


function getReplyType(reply_type){
  if(reply_type == 'text_message'){
    return "Text"
  } else if(reply_type == 'button'){
    return "Button"
  } else if(reply_type == 'flow'){
    return "Flow"
  } else {
    return "Url"
  }
}


function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
}

function goChatFlow(){
  router.push({
      path: '/page/new-chat-flow/',
      state: { waba_id: selected_waba_account.value, phone_number_id: selected_phone_number_id.value, phone_number: selected_phone_number.value, action:"create" }
  });
}

function edit(message){
  selected_message.value = JSON.stringify(message)
  editChatFlow()
}

function editChatFlow(){
  router.push({
      path: '/page/new-chat-flow/',
      state: { waba_id: selected_waba_account.value, phone_number_id: selected_phone_number_id.value, phone_number: selected_phone_number.value, action:"edit", message:selected_message.value}
  });
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

    <card-body class="pb-2" v-if="selected_waba_account">
      <div class="row">
        <div class="form-group mb-3">
          <button type="button" class="btn btn-teal mb-1 me-1" @click="goChatFlow">Create Auto Reply</button>
        </div>
      </div>
    </card-body>

    <card-body class="pb-2">
      <div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
                <th class="border-top-0 pt-0 pb-2">Key</th>
								<th class="border-top-0 pt-0 pb-2">Message</th>
                <th class="border-top-0 pt-0 pb-2">Type</th>
								<th class="border-top-0 pt-0 pb-2">Update</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="message in auto_reply_messages">
                <td class="align-middle">{{ message.key }}</td>
                <template v-if="message.reply_type =='flow'">
                  <td class="align-middle">{{ message.message }}</td>
                  <td class="align-middle">{{ message.reply_type}}</td>
                </template>
                <template v-else>
                  <td class="align-middle">{{ message.header }}</td>
                  <td class="align-middle">Interactive Lists</td>
                </template>
                <td class="align-middle"><button type="button" class="btn btn-warning mb-1 me-1" @click="edit(message)">Edit</button></td>
              </tr>
						</tbody>
					</table>
				</div>
    </card-body>
  </card>
</template>

<style scoped>
.form-label {
  font-weight:bold;
}
</style>
