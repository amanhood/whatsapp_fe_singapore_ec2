<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref, watch } from 'vue'
import { getRequest,postRequest } from '../composables/api.js'
import { responseMessage } from '../composables/response_message.js'
import { fileProcess } from '../composables/file_process.js'
import Loading from 'vue-loading-overlay';


let username = ref(null)
let token = ref(null)
let template_name = ref(null)
let notification_message = ref(null)
let flow_name = ref(null)
let spin_loading = ref(false)

const emit = defineEmits(["gettemplates","showtoast"])
const props = defineProps(['waba_id','phone_number_id'])

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

function submit(){
    spin_loading.value = true
    if(template_name.value){
      let data = {}
      template_name.value = template_name.value.replace(" ","_")
      data['waba_id'] = props.waba_id
      data['phone_number_id'] = props.phone_number_id
      data['template_name'] = template_name.value
      submitForm(data)
    } else {
      notification_message.value = "Please input template name"
      emit('showtoast',notification_message.value)
    }
}

async function submitForm(payload){
  let data = await postRequest("create_delivery_address",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
      let notification_message = responseMessage(data)
      emit('showtoast',notification_message)
    } else {
      spin_loading.value = true
      let notification_message = "template is created successfully."
      getAddress()
      emit('showtoast',notification_message)
      emit("gettemplates");
    }
  } else {
    console.log(data)
  }
}

async function getAddress(){
  let data = await postRequest("get_address",null,token)
  if(data['status'] == 200){
    flow_name.value = data['data']['flow_name']
  } else {
    notification_message.value = "unable to get address"
    emit('showtoast',notification_message)
  }
}

getAddress()


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

  <div v-if="flow_name">
    <card-body class="pb-2">
      <div class="row">
        <div class="col-md-12">
          <div class="row" style="margin-bottom:10px;">
            <div class="flex-fill fw-bold fs-16px">Delivery Address Template</div>
          </div>
          <div class="row">
            <div class="col-md-3">
              {{flow_name}} is already existed
            </div>
          </div>
        </div>
      </div>
    </card-body>
  </div>

  <div v-else>
    <loading v-model:active="spin_loading"
                 :is-full-page="true"/>
    <card-body class="pb-2">
      <div class="row">
        <div class="col-md-12">
          <div class="row" style="margin-bottom:10px;">
            <div class="flex-fill fw-bold fs-16px">Template Name</div>
          </div>
          <div class="row">
            <div class="col-md-3">
              <input type="text" class="form-control" placeholder="name" v-model="template_name"/>
            </div>
          </div>
        </div>
      </div>
    </card-body>
    <hr>
    <card-body class="pb-2">
      <div class="row">
        <div class="col-md-12">
          <div class="row">
            <div class="col-md-3">
              <button type="button" class="btn btn-teal mb-1 me-1" @click="submit">Submit</button>
            </div>
          </div>
        </div>
      </div>
    </card-body>
  </div>
</template>
