<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import TemplateComponents from './TemplateComponents.vue'
import CreateTemplate from './CreateTemplate.vue'
import LtoTemplate from './LtoTemplate.vue'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import { responseMessage } from '../composables/response_message.js'
import { fileProcess } from '../composables/file_process.js'

const userSession = useUserSessionStore();
const router = useRouter()


let username = ref(null)
let token = ref(null)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

let notification_message = ref(null)
let uploaded_file = ref(null)
let file_name = ref(null)
let file_type = ref(null)
let receipent = ref(null)
let whatsapp_accounts = []
let is_shown_templates = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let text_message = ref(null)

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  whatsapp_accounts = data['data']['whatsapp_accounts']
  if(whatsapp_accounts.length > 0){
    //getTemplates()
    is_shown_templates.value = true
  } else {
    is_shown_templates.value = false
  }
}

async function uploadFile(event) {
  try {
    let data = await fileProcess(event);
    file_type.value = data.file_type
    file_name.value = data.file_name
    uploaded_file.value = data.file// Again, assuming fileProcess is adjusted to resolve with data
  } catch (error) {
    console.error("Error processing file:", error);
  }
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

async function sendMessage(){
  let payload = {}
  payload['phone_number_id'] = selected_phone_number_id.value
  payload['waba_id'] = selected_waba_account.value
  payload['file'] = uploaded_file.value
  payload['file_name'] = file_name.value
  payload['file_type'] = file_type.value
  payload['receipent'] = receipent.value
  let data = await postRequest("send_media_message",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
      let notification_message = responseMessage(data)
      showToast(notification_message)
    } else {
      let notification_message = "template is created successfully."
      showToast(notification_message)
    }
  } else {
    console.log(data)
  }
}

async function sendTextMessage(){
  let payload = {}
  payload['phone_number_id'] = selected_phone_number_id.value
  payload['waba_id'] = selected_waba_account.value
  payload['text_message'] = text_message.value
  payload['receipent'] = receipent.value
  let data = await postRequest("send_text_message",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
      let notification_message = responseMessage(data)
      showToast(notification_message)
    } else {
      let notification_message = "template is created successfully."
      showToast(notification_message)
    }
  } else {
    console.log(data)
  }
}

function selectWaBa(waba_id,phone_number_id){
  selected_waba_account.value = waba_id
  selected_phone_number_id.value = phone_number_id
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

  <div class="d-flex align-items-center mb-3">
    <div>
      <h1 class="page-header mb-0">Send Messages</h1>
    </div>
  </div>


  <card v-if="is_shown_templates">
    <card-body class="pb-2">
        <div class="row">
          <div class="col-xl-6">
            <div class="form-group mb-3">
              <div class="flex-fill fw-bold fs-16px">Please select your business whatsapp account for sending message</div>
            </div>
            <div class="form-group mb-3">
              <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="selectWaBa(account.waba_id,account.phone_number_id)" v-for="account in whatsapp_accounts">{{account.phone_number}}</button>
            </div>
          </div>
        </div>
    </card-body>

    <ul class="nav nav-tabs nav-tabs-v2 px-4">
      <li class="nav-item me-3"><a href="#allTab" class="nav-link active px-2" data-bs-toggle="tab">Media Message</a></li>
      <li class="nav-item me-3"><a href="#text_message" class="nav-link" data-bs-toggle="tab">Text Message</a></li>
    </ul>
    <div class="tab-content p-4" v-if="selected_waba_account">
      <div class="tab-pane fade show active" id="allTab">
        <card-body>
          <div class="row">
            <div class="col-xl-12">
              <div class="row">
                <div class="col-md-4">
                  <input type="file" class="form-control" id="defaultFile" @change="uploadFile" accept="image/*,application/pdf"/>
                </div>
                <div class="col-md-4">
                  <input type="text" class="form-control" placeholder="852+mobile number" v-model="receipent"/>
                </div>
                <div class="col-md-4">
                  <button class="btn btn-default rounded-0" type="button" @click="sendMessage"><span class="d-none d-md-inline">Send</span></button>
                </div>
              </div>
            </div>
          </div>
        </card-body>
        <hr>
      </div>
      <div class="tab-pane fade" id="text_message">
        <card-body>
          <div class="row">
            <div class="col-xl-12">
              <div class="row">
                <div class="col-md-6">
                  <textarea class="form-control" id="defaultFile" rows="6" v-model="text_message"/>
                </div>
                <div class="col-md-4">
                  <input type="text" class="form-control" placeholder="852+mobile number" v-model="receipent"/>
                </div>
                <div class="col-md-2">
                  <button class="btn btn-default rounded-0" type="button" @click="sendTextMessage"><span class="d-none d-md-inline">Send</span></button>
                </div>
              </div>
            </div>
          </div>
        </card-body>
        <hr>
      </div>
    </div>
  </card>

  <card v-else>
    <card-body class="pb-2">
        <div class="row">
          <div class="col-xl-6">
            <div class="form-group mb-3">
              <div class="flex-fill fw-bold fs-16px">No Business whatsapp accounts are linked. Please go to message boardcasting for adding business whatsapp account</div>
            </div>
          </div>
        </div>
    </card-body>
    <!-- END row -->
  </card>
</template>
