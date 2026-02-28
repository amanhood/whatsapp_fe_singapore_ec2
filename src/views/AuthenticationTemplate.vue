<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch,onMounted } from 'vue';
import { getRequest,postRequest } from '../composables/api.js';
import { Toast } from 'bootstrap';
import datepicker from '@/assets/components/plugins/Datepicker.vue';
import moment from 'moment';
import { responseMessage } from '../composables/response_message.js'
import { fileProcess } from '../composables/file_process.js'
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';


let username = ref(null)
let token = ref(null)
let selected_language = ref(null)
let template_name = ref(null)
let is_submit_button_shown = ref(true)
let spin_loading = ref(false)
let code_expiration_minutes = ref(null)


const emit = defineEmits(["showtoast"])
const props = defineProps(['waba_id','phone_number_id'])

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")


let languages = [
        { id:'zh_HK',title: "Chinese (HKG)" },
        { id:'en_US',title: "English (US)" },
        { id:'id',title: "Indonesia" },
        { id:'pt_BR',title: "Portugal" },
        { id:'es',title: "Spanish" }
      ]

function submit(){
    let data = {}
    if(!template_name.value){
      let notification_message = ""
      notification_message = "Please input template name"
      emit('showtoast',notification_message)
      return
    }
    if(!code_expiration_minutes.value){
      let notification_message = ""
      notification_message = "Please input code expiration minutes"
      emit('showtoast',notification_message)
      return
    }
    data['waba_id'] = props.waba_id
    data['phone_number_id'] = props.phone_number_id
    data['name'] = template_name.value
    data['language'] = selected_language.value.id
    data['category'] = 'AUTHENTICATION'
    data['component'] = [
      {
        "type": "body",
        "add_security_recommendation": true
      },
      {
        "type": "footer",
        "code_expiration_minutes": code_expiration_minutes.value
      },
      {
        "type": "buttons",
        "buttons": [
          {
            "type": "otp",
            "otp_type": "copy_code"
          }
        ]
      }
    ]
    submitForm(data)
}

async function submitForm(payload){
  spin_loading.value = true
  let data = await postRequest("generate_authentication_template",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
      spin_loading.value = false
      let notification_message = responseMessage(data)
      emit('showtoast',notification_message)
    } else {
      spin_loading.value = false
      let notification_message = "template is created successfully."
      emit('showtoast',notification_message)
    }
  } else {
    spin_loading.value = false
  }
}

</script>


<template>
  <loading v-model:active="spin_loading"
  :is-full-page="true"/>
  <card-body class="pb-2">
    <div class="row">
      <div class="col-md-12">
        <div class="row" style="margin-bottom:10px;">
          <div class="flex-fill fw-bold fs-16px">Template</div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <input type="text" class="form-control" placeholder="name" v-model="template_name"/>
          </div>
          <div class="col-md-3">
            <v-select v-model="selected_language" :options="languages" label="title"></v-select>
          </div>
        </div>
      </div>
    </div>
  </card-body>
  <hr>
  <card-body class="pb-2">
    <div class="row">
      <div class="col-md-12">
        <div class="row" style="margin-bottom:10px;">
          <div class="flex-fill fw-bold fs-16px">Code expiration minutes</div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <input type="number" class="form-control" placeholder="name" v-model="code_expiration_minutes"/>
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
            <button type="button" class="btn btn-teal mb-1 me-1" @click="submit" v-if="is_submit_button_shown">Create Template</button>
          </div>
        </div>
      </div>
    </div>
  </card-body>
</template>
