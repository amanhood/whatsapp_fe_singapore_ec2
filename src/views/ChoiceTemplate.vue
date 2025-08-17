<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch } from 'vue';
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
let uploaded_file = ref(null)
let file_name = ref(null)
let file_length = ref(null)
let file_type = ref(null)
let customImageMaxSize = ref(3)
let is_submit_button_shown = ref(true)
let spin_loading = ref(false)

let body = ref(null)
let body_warning_message = ref(null)
let body_variables = ref([])
let header = ref(null)
let header_variables = ref([])
let header_warning_message = ref(null)
let selected_button_type = ref('')
let custom_button_shown = ref(false)
let buttons = ref([])
let button_id = ref(1)
let submit_button_shown = ref(true)

const emit = defineEmits(["showtoast"])
const props = defineProps(['waba_id','phone_number_id'])

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")


let button_types = [
  { id:'nothing',title: "Please choose" },  
  { id:'quick_reply',title: "Quick reply" }
]

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

function selectButton(){
    if(buttons.value.length < 3){
      if(selected_button_type.value.id == "quick_reply"){
        custom_button_shown.value = true
        buttons.value.push({'id':button_id.value,'type':selected_button_type.value.id,text:'',api_call:''})
      } 
      button_id.value += 1
    } else {
      let notification_message = "Sorry, no more than 3 buttons"
      emit('showtoast',notification_message)
    }
}

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
    let re_variables = null
    let url_re_variables = null
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
        data['template_name'] = template_name.value
        data['category'] = 'UTILITY'
        data['component'] = []

        let file_type_format = null
        if(uploaded_file.value){
            let file_type_signal = file_type.value.split("/")[0]
            if (file_type_signal == 'image'){
              file_type_format = 'image'
            } else if (file_type_signal == 'video') {
              file_type_format = 'video'
            }
            data['component'].push({
              "type": "header",
              "format": file_type_format,
              "example": {
                "header_handle": [
                  uploaded_file.value
                ],
                "file_name":file_name.value,
                "file_length":file_length.value,
                "file_type":file_type.value
              }
            })
        } else {
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
        }
        if(body_variables.value.length == 0){
          data['component'].push(
              {
                  "type": "body",
                  "text": body.value
              }
          )
        } else {
          data['component'].push(
              {
                  "type": "body",
                  "text": body.value,
                  "example": {
                      "body_text": variables
                  }
              }
          )
        }
        if(buttons.value.length > 0){
          let buttons_components = []
          buttons.value.forEach((item) => {
            console.log(item)
            if(item.type=='quick_reply'){
              buttons_components.push({"type": "QUICK_REPLY","text": item.text,"api_call":item.api_call})
            } 
          })
          data['component'].push({
              "type":'buttons',
              "buttons":buttons_components
          })
        }
        submitForm(data)
    }
}

async function submitForm(payload){
  spin_loading.value = true
  let data = await postRequest("generate_choicetemplate",payload,token)
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
    let notification_message = "Failed to create choice template"
    emit('showtoast',notification_message)
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
          <div class="flex-fill fw-bold fs-16px">Header</div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6" v-if="!header">
            <input type="file" class="form-control" id="defaultFile" @change="uploadFile" accept="image/*,video/*"/>
          </div>
        </div>
        <div class="row" style="margin-bottom:10px;">
          <div class="col-md-6" v-if="!uploaded_file">
            <input type="text" class="form-control" placeholder="Header title" v-model="header"/>
          </div>
        </div>

        <div class="row" style="margin-bottom:10px;" v-if="!uploaded_file && header_warning_message">
          <div class="col-6">
            <card>
              <card-body style="background-color:#FFF4F2;">
                <p class="card-text">{{header_warning_message}}</p>
              </card-body>
            </card>
          </div>
        </div>

        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-3" v-if="!uploaded_file">
            <button type="button" class="btn btn-yellow mb-1 me-1" @click="addHeaderVariables()" v-if="!uploaded_file">+ Variables</button>
          </div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6" v-if="!uploaded_file" v-for="variable in header_variables">
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
          <div class="flex-fill fw-bold fs-16px">Buttons</div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6">
              <v-select v-model="selected_button_type" :options="button_types" label="title" @update:modelValue="selectButton"></v-select>
          </div>
        </div>
        <hr>
        <div class="row" v-if="custom_button_shown" v-for="button in buttons" style="margin-bottom:10px;">
          <template v-if="button.type == 'quick_reply'">
            <div class="col-md-3">
              <input type="text" class="form-control" placeholder="custom button text" v-model="button.text"/>
            </div>
             <div class="col-md-3">
              <input type="text" class="form-control" placeholder="action after clicked button" v-model="button.api_call"/>
            </div>
            <div class="col-md-3">
              <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButton(button.id)">delete</button>
            </div>
          </template>
          <hr style="margin-top:20px;">
        </div>
      </div>
    </div>
  </card-body>
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
