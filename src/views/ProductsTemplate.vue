<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref, watch } from 'vue'
import { getRequest,postRequest } from '../composables/api.js'
import { responseMessage } from '../composables/response_message.js'
import { fileProcess } from '../composables/file_process.js'

let username = ref(null)
let token = ref(null)
let selected_category = ref(null)
let selected_language = ref(null)
let template_name = ref(null)

let header = ref(null)
let header_text = ref(null)
let header_variables = []
let number_of_header_variables = ref(0)
let header_text_message = ref(null)

let body = ref(null)
let body_text = ref(null)
let number_of_body_variables = ref(0)
let body_variables = []
let body_text_message = ref(null)

let selected_button_type = ref(null)
let custom_button_shown = ref(false)
let buttons = ref([])
let button_id = ref(1)
let footer = ref(null)
let submit_button_shown = ref(true)

const emit = defineEmits(["gettemplates","showtoast"])
const props = defineProps(['waba_id','phone_number_id'])

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

let categories = [
        { id:'MARKETING',title: "MARKETING" }
      ]

let languages = [
        { id:'zh_HK',title: "Chinese (HKG)" },
        { id:'en_US',title: "English (US)" },
        { id:'id',title: "Indonesia" },
        { id:'pt_BR',title: "Portugal" },
        { id:'es',title: "Spanish" }
      ]

function addHeaderVariables(){
    if(number_of_header_variables.value == 0){
      number_of_header_variables.value += 1
      if(!header.value){
        header.value = ''
      }
      header.value = header.value + "{{" + number_of_header_variables.value + "}}"
    }
}

watch(header,(newValue,oldValue)=>{
    if(header.value){
      const matches = header.value.match(/\{\{.*?\}\}/g);
      const count = matches ? matches.length : 0;
      number_of_header_variables.value = count
    } else {
      number_of_header_variables.value = 0
    }
})

watch(header_text,(newValue,oldValue)=>{
    let header_variables = []
    if(header_text.value.includes(',')){
      header_variables = header_text.value.split(",")
    } else {
      header_variables.push(header_variable.value)
    }
    if(number_of_header_variables.value < header_variables.length){
      header_text_message.value = "too many variables, only 1 variable is allowed"
    } else {
      header_text_message.value = null
    }
})


function urltype(urltype,button_id){
    //console.log(urltype)
    //console.log(buttons.value)
}

function deleteButton(button_id){
    const index = buttons.value.findIndex(item => item.id === button_id)
    //console.log(index)
    if (index !== -1) {
      buttons.value.splice(index, 1)
    }
    //console.log(buttons.value)
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

function addBodyVariables(){
    number_of_body_variables.value += 1
    if(!body.value){
      body.value = ''
    }
    body.value = body.value + "{{" + number_of_body_variables.value + "}}"
}

watch(body_text,(newValue,oldValue)=>{
    if(body_text.value.includes(',')){
      body_variables = []
      body_variables  = body_text.value.split(",")
    } else {
      body_variables = []
      body_variables.push(body_text.value)
    }
    if(number_of_body_variables.value != body_variables.length){
      body_text_message.value = "unmatched variables at body, please check"
    } else {
      body_text_message.value = null
    }
})


function submit(){
    let data = {}
    let button_component = null
    let header_component = null
    if(selected_button_type.value){
      if(selected_language.value){
        if(selected_button_type.value == "PC"){
          button_component = {
            "type": "BUTTONS",
            "buttons": [
              {
                "type": "CATALOG",
                "text": "View catalog"
              }
            ]
          }
        } else {
          button_component = {
            "type": "BUTTONS",
            "buttons": [
              {
                "type": "MPM",
                "text": "View items"
              }
            ]
          }
        }
        data['waba_id'] = props.waba_id
        data['phone_number_id'] = props.phone_number_id
        data['template_name'] = template_name.value
        data['category'] = 'MARKETING'
        data['language'] = selected_language.value.id
        data['component'] = []

        if(header_text.value){
          header_component = ({
            "type": "HEADER",
            "format": "TEXT",
            "text": header.value,

            /* Example required if header uses a variable */
            "example": {
              "header_text": [
                header_text.value
              ]
            }
          })
        } else {
          header_component = ({
            "type": "HEADER",
            "format": "TEXT",
            "text": header.value,
          })
        }
        if(body_variables.length > 0){
          data['component'].push({
            "type": "body",
            "text": body.value,
            "example": {
              "body_text": [body_variables]
            }
          })
        } else {
          data['component'].push({
            "type": "body",
            "text": body.value,
          })
        }
        if(footer.value){
          data['component'].push({
            "type": "footer",
            "text": footer.value
          })
        }
        if(selected_button_type.value == "MPM"){
          data['component'].push(header_component)
        }
        data['component'].push(button_component)
        submitForm(data)
      } else {
        let notification_message = "Please select language"
        emit('showtoast',notification_message)
      }
    } else {
      let notification_message = "Please select Catalog or Multip Product Template"
      emit('showtoast',notification_message)
    }
}

async function submitForm(payload){
  let data = await postRequest("generate_productstemplate",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
      let notification_message = responseMessage(data)
      emit('showtoast',notification_message)
    } else {
      let notification_message = "template is created successfully."
      emit('showtoast',notification_message)
      emit("gettemplates");
    }
  } else {
    console.log(data)
  }
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
          <div class="flex-fill fw-bold fs-16px">Catalog or Multiple Product Template</div>
        </div>
        <div class="row">
          <div class="col-md-3">
            <select class="form-select" v-model="selected_button_type" @change="selectButton">
              <option value="PC">Catalog Template</option>
              <option value="MPM">Multiple Product Template</option>
            </select>
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
        <div class="row">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="header title" v-model="header"/>
          </div>
          <div class="col-md-3">
            <input type="text" class="form-control" placeholder="variable" v-model="header_text"/>
          </div>
          <div class="col-md-3">
            <button type="button" class="btn btn-default mb-1 me-1" @click="addHeaderVariables()">Add Variables</button>
          </div>
        </div>
        <div v-if="header_text_message" style="color:red;">
          {{header_text_message}}
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
          <div class="flex-fill fw-bold fs-16px">Footer</div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="footer text" v-model="footer"/>
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
            <button type="button" class="btn btn-default mb-1 me-1" @click="submit" v-if="submit_button_shown">Submit</button>
          </div>
        </div>
      </div>
    </div>
  </card-body>
</template>
