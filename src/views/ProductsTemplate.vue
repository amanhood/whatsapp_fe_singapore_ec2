<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref, watch } from 'vue'
import { getRequest,postRequest } from '../composables/api.js'
import { responseMessage } from '../composables/response_message.js'
import { fileProcess } from '../composables/file_process.js'
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';

let username = ref(null)
let token = ref(null)
let selected_category = ref(null)
let selected_language = ref(null)
let template_name = ref(null)
let spin_loading = ref(false)

let header = ref(null)
let header_variables = ref([])
let header_warning_message = ref(null)

let body = ref(null)
let body_variables = ref([])
let body_warning_message = ref(null)

let selected_button_type = ref(null)
let custom_button_shown = ref(false)
let buttons = ref([])
let button_id = ref(1)
let footer = ref(null)
let submit_button_shown = ref(true)

const emit = defineEmits(["showtoast"])
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

let button_types = [
  { id:'PC',title: "All products" },
  { id:'MPM',title: "Multiple products" }
]

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


function submit(){
    let data = {}
    let button_component = null
    let header_component = null
    if(selected_button_type.value){
      if(selected_language.value){
        if(selected_button_type.value.id == "PC"){
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

        if(header_variables.value.length > 0){
          header_component = ({
            "type": "HEADER",
            "format": "TEXT",
            "text": header.value,

            /* Example required if header uses a variable */
            "example": {
              "header_text": [
                header_variables.value[0].value
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
          let variables = body_variables.value.map(item => item.value);
          data['component'].push({
            "type": "body",
            "text": body.value,
            "example": {
              "body_text": [variables]
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
        if(selected_button_type.value.id == "MPM"){
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
  spin_loading.value = true
  let data = await postRequest("generate_productstemplate",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
      spin_loading.value = false
      let notification_message = responseMessage(data)
      emit('showtoast',notification_message)
    } else {
      spin_loading.value = false
      let notification_message = "template is created successfully."
      emit('showtoast',notification_message)
      emit("gettemplates");
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
          <div class="flex-fill fw-bold fs-16px">Catalog or Multiple Product Template</div>
        </div>
        <div class="row">
          <!-- <div class="col-md-3">
            <select class="form-select" v-model="selected_button_type" @change="selectButton">
              <option value="PC">Catalog Template</option>
              <option value="MPM">Multiple Product Template</option>
            </select>
          </div> -->
          <div class="col-md-6">
              <v-select v-model="selected_button_type" :options="button_types" label="title"></v-select>
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
            <button type="button" class="btn btn-yellow mb-1 me-1" @click="addHeaderVariables()" v-if="!uploaded_file">+ Variables</button>
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
            <button type="button" class="btn btn-teal mb-1 me-1" @click="submit" v-if="submit_button_shown">Create Template</button>
          </div>
        </div>
      </div>
    </div>
  </card-body>
</template>
