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
let body = ref(null)
let body_warning_message = ref(null)
let body_variables = ref([])
let spin_loading = ref(false)
let header = ref(null)
let header_variables = ref([])
let header_warning_message = ref(null)

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

function addHeaderVariables(){
    if(header_variables.value.length == 0){
      header_variables.value.push({'id':header_variables.value.length,'value':''})
      if(!header.value){
        header.value = ''
      }
      header.value = header.value + "{{" + header_variables.value.length + "}}"
    } else {
      let notification_message = "Only one variable is allowed"
      emit('showtoast',notification_message)
    }

}

function addBodyVariables(){
    const newIndex = body_variables.value.length + 1

    body_variables.value.push({
      index: newIndex,
      value: ""
    })
    body.value = body.value + "{{" + body_variables.value.length + "}}"
}

watch(body, (newValue, oldValue) => {
  if (!newValue) {
    body_warning_message.value = null
    return
  }

  // 1) Check brackets are balanced
  const openBrackets = (newValue.match(/\{\{/g) || []).length
  const closeBrackets = (newValue.match(/\}\}/g) || []).length

  if (openBrackets !== closeBrackets) {
    body_warning_message.value =
      "This template contains variable parameters with incorrect formatting. Variable parameters must be whole numbers with two sets of curly brackets (for example, {{1}}, {{2}})."
    return
  }

  // 2) Get all {{number}} matches
  const matches = newValue.match(/\{\{(\d+)\}\}/g) || []
  const indices = matches
    .map(m => {
      const num = m.match(/\d+/)
      return num ? Number(num[0]) : null
    })
    .filter(n => n !== null)

  // 3) Ensure {{1}}–{{4}} always exist
  const baseRequired = [1, 2, 3, 4, 5, 6]
  const hasAllBase = baseRequired.every(n => indices.includes(n))

  if (!hasAllBase) {
    body_warning_message.value =
      "The first six variables {{1}}, {{2}}, {{3}}, {{4}} , {{5}}  and {{6}} are required and cannot be removed."
    return
  }

  // 4) No warning – formatting OK & 1–4 exist
  body_warning_message.value = null

  // 5) Sync extra variables (5, 6, 7...) with body_variables
  const dynamicIndices = indices.filter(n => n > 6)
  const desiredLength = 6 + dynamicIndices.length   // 4 fixed + extra

  // Never go below 4 items
  if (body_variables.value.length > desiredLength) {
    // cut off extra variables but keep first 4
    body_variables.value.splice(desiredLength)
  } else if (body_variables.value.length < desiredLength) {
    // add new empty variables for new placeholders
    for (let i = body_variables.value.length + 1; i <= desiredLength; i++) {
      body_variables.value.push({
        id: i,
        value: ''
      })
    }
  }
})


watch(header,(newValue,oldValue)=>{
    if(newValue){
      const openBrackets = (newValue.match(/\{\{/g) || []).length;
      const closeBrackets = (newValue.match(/\}\}/g) || []).length;
      if (openBrackets !== closeBrackets) {
        header_warning_message.value = "This template contains variable parameters with incorrect formatting. Variable parameters must be whole numbers with two sets of curly brackets (for example, {{1}}, {{2}})."
      } else {
        const matches = newValue.match(/\{\{.*?\}\}/g);
        const count = matches ? matches.length : 0;
        if (count === 0) {
          header_variables.value = [];
        }
        header_warning_message.value = null
      }
    }
})


function submit(){
    let data = {}
    var re = /\{\{.*?\}\}/g
    let re_variables = null
    if(body.value){
      re_variables = body.value.match(re)
    }
    if(re_variables && re_variables.length != body_variables.value.length){
      let notification_message = ""
      notification_message = "Unmatched body variables, you have " + re_variables.length + " variables. But got "  + body_variables.value.length + " variables at body"
      emit('showtoast',notification_message)
    } else {
      let variables = body_variables.value.map(item => item.value)
      data['waba_id'] = props.waba_id
      data['phone_number_id'] = props.phone_number_id
      data['name'] = template_name.value
      data['language'] = selected_language.value.id
      data['category'] = 'UTILITY'
      data['component'] = []
      if(header.value){
        if(header_variables.value.length > 0){
            data['component'].push({
            "type": "header",
            "format": "text",
            "text": header.value,
            "example": {
                "header_text": [header_variables.value[0].value]
            }
            })
        } else {
            data['component'].push({
            "type": "header",
            "format": "text",
            "text": header.value,
            })
        }
      }
      data['component'].push(
        {
            "type": "body",
            "text": body.value,
            "example": {
            "body_text": variables
            }
        }
      )   
      submitForm(data)
    }
}

async function submitForm(payload){
  spin_loading.value = true
  let data = await postRequest("generate_utility_template",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
      spin_loading.value = false
      let notification_message = responseMessage(data)
      emit('showtoast',notification_message)
    } else {
      spin_loading.value = false
      let notification_message = "template is created successfully."
      emit('showtoast',notification_message)
      //emit("gettemplates");
      //resetData();
    }
  } else {
    spin_loading.value = false
  }
}

onMounted(()=>{
  body_variables.value = [
    { index: 1, value: 'name' },
    { index: 2, value: 'class' },
    { index: 3, value: 'date' },
    { index: 4, value: 'time' },
    { index: 5, value: 'location' },
    { index: 6, value: 'phone' }
  ]
  body.value = `Hello, it is the confirmation of your booking, please check with below information. 

Name: {{1}}
Class: {{2}}
Date: {{3}}
Time: {{4}}
Location: {{5}}
Please contact us via {{6}}

Thank you`
  })


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
          <div class="flex-fill fw-bold fs-16px">Header</div>
        </div>
        
        <div class="row" style="margin-bottom:10px;">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="Header title" v-model="header"/>
          </div>
        </div>

        <div class="row" style="margin-bottom:10px;" v-if="header_warning_message">
          <div class="col-6">
            <card>
              <card-body style="background-color:#FFF4F2;">
                <p class="card-text">{{header_warning_message}}</p>
              </card-body>
            </card>
          </div>
        </div>

        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-3">
            <button type="button" class="btn btn-yellow mb-1 me-1" @click="addHeaderVariables()">+ Variables</button>
          </div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6" v-for="variable in header_variables">
            <input type="text" class="form-control" placeholder="variables" v-model="variable.value"/>
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
        <div class="row">
          <div class="col-md-3">
            <button type="button" class="btn btn-teal mb-1 me-1" @click="submit" v-if="is_submit_button_shown">Create Template</button>
          </div>
        </div>
      </div>
    </div>
  </card-body>
</template>
