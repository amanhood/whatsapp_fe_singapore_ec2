<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch } from 'vue';
import { getRequest,postRequest } from '../composables/api.js';
import { Toast } from 'bootstrap';
import datepicker from '@/assets/components/plugins/Datepicker.vue';
import moment from 'moment';
import { responseMessage } from '../composables/response_message.js'
import { fileProcess } from '../composables/file_process.js'


let username = ref(null)
let token = ref(null)
let selected_language = ref(null)
let template_name = ref(null)
let uploaded_file = ref(null)
let file_name = ref(null)
let file_length = ref(null)
let file_type = ref(null)
let customImageMaxSize = ref(3)
let limited_time_offer_text = ref(null)
let body = ref('')
let body_text = ref('')
let offer_code = ref(null)
let url = ref('')
let url_text = ref(null)
let url_variable = ref('')
let body_status = ref(true)
let body_text_message = ref(null)
let body_variables = []
let number_of_body_variables = ref(0)
let is_submit_button_shown = ref(true)
let coupon_code_error_message = ref(null)
let number_url_variable = ref(0)
let url_variables = []
let url_variable_message = ref(null)
let notification_message = ref(null)

const emit = defineEmits(["gettemplates","showtoast"])
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

async function uploadFile(event) {
  try {
    let data = await fileProcess(event);
    file_type.value = data.file_type
    file_name.value = data.file_name
    file_length.value = data.file_length
    uploaded_file.value = data.file// Again, assuming fileProcess is adjusted to resolve with data
  } catch (error) {
    console.error("Error processing file:", error);
  }
}

function submit(){
  let data = {}
  var re = /\{\{.*?\}\}/g
  let re_variables = body.value.match(re)
  let url_re_variables = url.value.match(re)
  if(re_variables && re_variables.length != body_variables.length){
    let notification_message = ""
    notification_message = "Unmatch variables, you have " + re_variables.length + " variables at body. But got "  + body_variables.length + "variables at body text"
    emit('showtoast',notification_message)
  } else if(url_re_variables && url_re_variables.length != url_variables.length){
    let notification_message = ""
    notification_message = "Unmatch variables, you have " + url_re_variables.length + " variables at url. But got "  + url_variables.length + "variables at url variable text"
    emit('showtoast',notification_message)
  } else {
    data['waba_id'] = props.waba_id
    data['phone_number_id'] = props.phone_number_id
    data['name'] = template_name.value
    data['language'] = selected_language.value.id
    data['category'] = 'marketing'
    data['component'] = [
      {
        "type": "header",
        "format": "image",
        "example": {
          "header_handle": [
            uploaded_file.value
          ],
          "file_name":file_name.value,
          "file_length":file_length.value,
          "file_type":file_type.value
        }
      },
      {
        "type":"limited_time_offer",
        "limited_time_offer": {
          "text": limited_time_offer_text.value,
          "has_expiration": "true"
        }
      },
      {
        "type": "body",
        "text": body.value,
        "example": {
          "body_text": body_variables
        }
      },
      {
        "type": "buttons",
        "buttons": [
          {
            "type": "copy_code",
            "example": offer_code.value
          },
          {
            "type": "url",
            "text": url_text.value,
            "url": url.value,
            "example": url_variables
          }
        ]
      }
    ]
    submitForm(data)
  }

}

async function submitForm(payload){
  let data = await postRequest("generate_ltotemplate",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
      let notification_message = responseMessage(data)
      emit('showtoast',notification_message)
    } else {
      let notification_message = "template is created successfully."
      emit('showtoast',notification_message)
      emit("gettemplates");
      //resetData();
    }
  } else {
    console.log(data)
  }
}

function addBodyVariables(){
    number_of_body_variables.value += 1
    if(!body.value){
      body.value = ''
    }
    body.value = body.value + "{{" + number_of_body_variables.value + "}}"
}

watch(body,(newValue,oldValue)=>{
    if(body.value){
      const matches = body.value.match(/\{\{.*?\}\}/g);
      const count = matches ? matches.length : 0;
      number_of_body_variables.value = count
    } else {
      number_of_body_variables.value = 0
    }
    if(number_of_body_variables.value != body_variables.length){
      body_text_message.value = "unmatched variables at body, please check"
    } else {
      body_text_message.value = null
    }
})

watch(body_text,(newValue,oldValue)=>{
    if(body_text.value.includes(",")){
      body_variables = []
      body_text_message.value = null
      body_variables = body_text.value.split(",")
      body_text_message.value = body_variables.length + " variables are inputted"
    } else {
      body_variables = []
      body_variables.push(body_text.value)
      body_text_message.value = body_text.value + " is value of variable 1"
      //console.log(body_text_message)
    }
})

function restrictSpecialChars() {
  let badchrs = /[$%\^]/;
  if(badchrs.test(offer_code.value)) {
    coupon_code_error_message.value = "you can't use $ or % or ^"
  } else {
    coupon_code_error_message.value = null
  }
}

function addUrlVariables(){
  if(number_url_variable.value > 0){
    notification_message.value = "You have already added 1 variable at URL"
    emit('showtoast',notification_message)
  } else {
    number_url_variable.value += 1
    url.value = url.value + "{{1}}"
  }
}

watch(url,(newValue,oldValue)=>{
  var re = /\{\{.*?\}\}/g
  let re_variables = url.value.match(re)
  if(!re_variables){
    number_url_variable.value = 0
  }
})

watch(url_variable,(newValue,oldValue)=>{
  if(url_variable.value.includes(",")){
    url_variable.value = ''
    url_variable_message.value = "only 1 variable is available, no "," is allowed"
  } else {
    url_variables = []
    url_variables.push(url_variable.value)
    url_variable_message.value = url_variable.value + " is value of variable 1"
    //console.log(body_text_message)
  }
})

function resetData(){
  selected_language.value = null
  template_name.value = null
  uploaded_file.value = null
  file_name.value = null
  file_length.value = null
  file_type.value = null
  customImageMaxSize.value = 3
  limited_time_offer_text.value = null
  body.value = ''
  body_text.value = ''
  number_text_variables.value = 0
  offer_code.value = null
  url.value = ''
  url_text.value = null
  url_variable.value = ''
  body_status.value = true
  body_text_message.value = null
  body_variables.value = []
  notification_message.value = null
  is_submit_button_shown.value = true
  coupon_code_error_message.value = null
  number_url_variable.value = 0
  url_variables.value = []
  url_variable_message.value = null
}

function getDateTime(){
  limited_time_offer_text.value = Date.parse(limited_time_offer_text.value)
  console.log(limited_time_offer_text.value)
}
</script>


<template>
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
          <div class="flex-fill fw-bold fs-16px">Header</div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6" v-if="!header">
            <input type="file" class="form-control" id="defaultFile" @change="uploadFile" accept="image/*"/>
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
          <div class="flex-fill fw-bold fs-16px">Set expiry time of discount offer</div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6">
            <datepicker v-model="limited_time_offer_text" @update:model-value="getDateTime"/>
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
          <div class="flex-fill fw-bold fs-16px">Body</div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6">
            <textarea class="form-control" id="exampleFormControlTextarea1" rows="3" v-model="body" placeholder="Body {{1}} {{2}} {{3}}"></textarea>
          </div>
          <div class="col-md-3">
            <input type="text" class="form-control" placeholder="variables" v-model="body_text"/>
          </div>
          <div class="col-md-3">
            <button type="button" class="btn btn-default mb-1 me-1" @click="addBodyVariables()">Add Variables</button>
          </div>
        </div>
        <div v-if="body_text_message" style="color:red;">
          {{body_text_message}}
        </div>
      </div>
    </div>
  </card-body>
  <hr>
  <card-body class="pb-2">
    <div class="row">
      <div class="col-md-12">
        <div class="row" style="margin-bottom:10px;">
          <div class="flex-fill fw-bold fs-16px">Coupon Code Button</div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="offer code" v-model="offer_code" @keyup="restrictSpecialChars"/>
          </div>
        </div>
        <div v-if="coupon_code_error_message" style="color:red;">
          {{coupon_code_error_message}}
        </div>
      </div>
    </div>
  </card-body>
  <hr>
  <card-body class="pb-2">
    <div class="row">
      <div class="col-md-12">
        <div class="row" style="margin-bottom:10px;">
          <div class="flex-fill fw-bold fs-16px">Website Link Button</div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-3">
            <input type="text" class="form-control" placeholder="text" v-model="url_text"/>
          </div>
          <div class="col-md-3">
            <input type="text" class="form-control" placeholder="website url" v-model="url"/>
          </div>
          <div class="col-md-3">
            <input type="text" class="form-control" placeholder="variable" v-model="url_variable"/>
          </div>
          <div class="col-md-3">
            <button type="button" class="btn btn-default mb-1 me-1" @click="addUrlVariables()">Add Variables</button>
          </div>
        </div>
        <div v-if="url_variable_message">
          {{url_variable_message}}
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
            <button type="button" class="btn btn-default mb-1 me-1" @click="submit" v-if="is_submit_button_shown">Submit</button>
          </div>
        </div>
      </div>
    </div>
  </card-body>
</template>
