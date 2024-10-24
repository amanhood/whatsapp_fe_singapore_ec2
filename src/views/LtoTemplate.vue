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
let offer_code = ref(null)
let url = ref(null)
let url_text = ref(null)
let url_variables = ref([])
let url_warning_message = ref(null)
let body = ref(null)
let body_warning_message = ref(null)
let body_variables = ref([])
let is_submit_button_shown = ref(true)
let coupon_code_error_message = ref(null)
let notification_message = ref(null)

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
  if(selected_language.value){
    let data = {}
    var re = /\{\{.*?\}\}/g
    let re_variables = null
    let url_re_variables = null
    if(body.value){
      re_variables = body.value.match(re)
    }
    if(url.value){
      url_re_variables = url.value.match(re)
    }
    if(re_variables && re_variables.length != body_variables.value.length){
      let notification_message = ""
      notification_message = "Unmatched body variables, you have " + re_variables.length + " variables. But got "  + body_variables.value.length + " variables at body"
      emit('showtoast',notification_message)
    } else if(url_re_variables && url_re_variables.length != url_variables.value.length){
      let notification_message = ""
      notification_message = "Unmatch url variables, you have " + url_re_variables.length + " variables at url. But got "  + url_variables.value.length + "variables at url"
      emit('showtoast',notification_message)
    } else {
      let variables = body_variables.value.map(item => item.value);
      let url_variable = ''
      if(url_variables.value.length > 0){
        let url_variable = url_variables.value[0].value
      }
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
            "body_text": variables
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
              "example": url_variable
            }
          ]
        }
      ]
      submitForm(data)
    }
  } else {
    let notification_message = "Please select language"
    emit('showtoast',notification_message)
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
      //emit("gettemplates");
      resetData();
    }
  } else {
    console.log(data)
  }
}

function addBodyVariables(){
    body_variables.value.push({'id':body_variables.value.length,'value':''})
    if(!body.value){
      body.value = ''
    }
    body.value = body.value + "{{" + body_variables.value.length + "}}"
}

watch(body,(newValue,oldValue)=>{
    if(body.value){
      const openBrackets = (newValue.match(/\{\{/g) || []).length;
      const closeBrackets = (newValue.match(/\}\}/g) || []).length;
      if (openBrackets !== closeBrackets) {
        body_warning_message.value = "This template contains variable parameters with incorrect formatting. Variable parameters must be whole numbers with two sets of curly brackets (for example, {{1}}, {{2}})."
      } else {
        const matches = newValue.match(/\{\{.*?\}\}/g);
        const count = matches ? matches.length : 0;
        body_warning_message.value = null
        if(body_variables.value.length > count){
          body_variables.value.splice(-1, 1)
        }
      }
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
  if(url_variables.value.length == 0){
    url_variables.value.push({'id':url_variables.value.length,'value':''})
    if(!url.value){
      url.value = ''
    }
    url.value = url.value + "{{" + url_variables.value.length + "}}"
  } else {
    let message = "You have already added one variable at URL"
    emit('showtoast',message)
  }
}

watch(url,(newValue,oldValue)=>{
  const openBrackets = (newValue.match(/\{\{/g) || []).length;
  const closeBrackets = (newValue.match(/\}\}/g) || []).length;
  if (openBrackets !== closeBrackets) {
    url_warning_message.value = "This template contains variable parameters with incorrect formatting. Variable parameters must be whole numbers with two sets of curly brackets (for example, {{1}})."
  } else {
    const matches = newValue.match(/\{\{.*?\}\}/g);
    const count = matches ? matches.length : 0;
    url_warning_message.value = null
    if(count == 0){
      url_variables.value = []
    }
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
  offer_code.value = null
  url.value = ''
  url_text.value = null
  url_variables.value = []
  body_warning_message.value = null
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
          <div class="flex-fill fw-bold fs-16px">Expiry date of offer</div>
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
        <div class="row" style="margin-bottom:10px;">
          <div class="col-md-6">
            <textarea class="form-control" id="exampleFormControlTextarea1" rows="3" v-model="body" placeholder="Body {{1}} {{2}} {{3}}"></textarea>
          </div>
        </div>
        <div class="row" style="margin-bottom:10px;" v-if="body_warning_message">
          <div class="col-6">
            <card>
              <card-body style="background-color:#FFF4F2;">
                <p class="card-text">{{body_warning_message}}</p>
              </card-body>
            </card>
          </div>
        </div>
        <div class="row" style="margin-bottom:10px;">
          <div class="col-md-3">
            <button type="button" class="btn btn-yellow mb-1 me-1" @click="addBodyVariables()">+ Variables</button>
          </div>
        </div>
        <div class="row" style="margin-bottom:10px;" v-for="variable in body_variables">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="variable" v-model="variable.value"/>
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
        <div class="row" style="margin-bottom:10px;">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="https://abc.com/{{1}}/" v-model="url"/>
          </div>
          <div class="col-md-3">
            <input type="text" class="form-control" placeholder="button text" v-model="url_text"/>
          </div>
        </div>
        <div class="row" style="margin-bottom:10px;" v-if="url_warning_message">
          <div class="col-6">
            <card>
              <card-body style="background-color:#FFF4F2;">
                <p class="card-text">{{url_warning_message}}</p>
              </card-body>
            </card>
          </div>
        </div>
        <div class="row" style="margin-bottom:10px;">
          <div class="col-md-3">
            <button type="button" class="btn btn-yellow mb-1 me-1" @click="addUrlVariables()">+ Variables</button>
          </div>
        </div>
        <div class="row" style="margin-bottom:10px;" v-for="variable in url_variables">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="variable" v-model="variable.value"/>
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
