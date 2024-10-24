<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref, watch } from 'vue'
import { getRequest,postRequest } from '../composables/api.js'
import { responseMessage } from '../composables/response_message.js'
import { fileProcess } from '../composables/file_process.js'
import 'vue-select/dist/vue-select.css';

let username = ref(null)
let token = ref(null)
let selected_category = ref(null)
let selected_language = ref(null)
let template_name = ref(null)
let header = ref(null)
let header_variables = ref([])
let header_warning_message = ref(null)


let uploaded_file = ref(null)
let file_name = ref(null)
let file_length = ref(null)
let file_type = ref(null)
let customImageMaxSize = ref(3)

let body = ref(null)
let body_variables = ref([])
let body_warning_message = ref(null)

let selected_button_type = ref('')
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


function selectButton(){
    if(selected_button_type.value == "quick_reply"){
      custom_button_shown.value = true
      buttons.value.push({'id':button_id.value,'type':selected_button_type.value,text:''})
    } else if (selected_button_type.value == "website"){
      custom_button_shown.value = true
      buttons.value.push({'id':button_id.value,'type':selected_button_type.value,text:'','url':'','variable':'','url_type':''})
    } else if (selected_button_type.value == "phone"){
      custom_button_shown.value = true
      buttons.value.push({'id':button_id.value,'type':selected_button_type.value,text:'','country':'','phone_number':''})
    } else if (selected_button_type.value == "offer"){
      custom_button_shown.value = true
      buttons.value.push({'id':button_id.value,'type':selected_button_type.value,offer_code:''})
    }
    button_id.value += 1
    //console.log(buttons.value)
    //console.log(button_id.value)
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

function AddUrlVariable(button_id){
    const index = buttons.value.findIndex(item => item.id === button_id)
    const matches = buttons.value[index].url.match(/\{\{.*?\}\}/g);
    const count = matches ? matches.length : 0;
    if(count > 0){
      let notification_message = "Only one variable can be added at url"
      emit('showtoast',notification_message)
    } else {
      buttons.value[index].url = buttons.value[index].url + "{{1}}"
    }
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
    if(selected_language.value){
      let data = {}
      var re = /\{\{.*?\}\}/g
      let re_variables = body.value.match(re)
      if(re_variables && re_variables.length != body_variables.length){
        let notification_message = ""
        notification_message = "Unmatched body variables, you have " + re_variables.length + " variables. But got "  + body_variables.value.length + " variables at body"
        emit('showtoast',notification_message)
      } else {
        data['waba_id'] = props.waba_id
        data['phone_number_id'] = props.phone_number_id
        data['template_name'] = template_name.value
        data['category'] = 'MARKETING'
        data['language'] = selected_language.value.id
        data['component'] = []
        if(uploaded_file.value){
            data['component'].push({
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
            })
        } else {
          if(header.value){
            data['component'].push({
              "type": "header",
              "format": "text",
              "text": header.value,
              "example": {
                "header_text": [header_variables.value[0].value]
              }
            })
          }
        }

        if(body.value){
          let variables = body_variables.value.map(item => item.value);
          data['component'].push({
            "type": "body",
            "text": body.value,
            "example": {
              "body_text": [variables]
            }
          })
        }

        if(footer.value){
          data['component'].push({
            "type": "footer",
            "text": footer.value
          })
        }

        if(buttons.value.length > 0){
          let buttons_components = []
          data['component'].push({
              "type":'buttons',
              "buttons":buttons_components
          })
          buttons.value.forEach((item) => {
            if(item.type=='quick_reply'){
              buttons_components.push({"type": "QUICK_REPLY","text": item.text})
            } else if(item.type=='website'){
              if(item.url_type=='static'){
                buttons_components.push({"type": "URL","url":item.url,"text":item.text})
              } else if(item.url_type=='dynamic'){
                buttons_components.push({"type": "URL","url":item.url,"text":item.text,"example":[item.variable]})
              }
            } else if(item.type=='phone'){
              buttons_components.push({"type": "PHONE_NUMBER","text": item.text,"phone_number":item.country+item.phone_number})
            } else if(item.type=='offer'){
              buttons_components.push({"type": "COPY_CODE","example": item.offer_code})
            }
          })
        }
        submitForm(data)
      }
    } else {
      let notification_message = "Please select language"
      emit('showtoast',notification_message)
    }

}

async function submitForm(payload){
  let data = await postRequest("generate_generaltemplate",payload,token)
  if(data.request.status == 200){
    if(data['data']['error']){
      let notification_message = responseMessage(data)
      emit('showtoast',notification_message)
    } else {
      let notification_message = "template is created successfully."
      emit('showtoast',notification_message)
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
          <div class="flex-fill fw-bold fs-16px">Template name and language</div>
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
        <div class="row" style="margin-bottom:10px;">
          <div class="flex-fill fw-bold fs-16px">Buttons</div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6">
            <select class="form-select" v-model="selected_button_type" @change="selectButton">
              <option selected>Add a button</option>
              <option value="quick_reply">Quick Reply</option>
              <option value="website">Visit website</option>
              <option value="phone">Phone call</option>
              <option value="offer">Offer</option>
            </select>
          </div>
        </div>
        <hr>
        <div class="row" v-if="custom_button_shown" v-for="button in buttons" style="margin-bottom:10px;">
          <template v-if="button.type == 'quick_reply'">
            <div class="col-md-3">
              <input type="text" class="form-control" placeholder="custom button text" v-model="button.text"/>
            </div>
            <div class="col-md-3">
              <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButton(button.id)">delete</button>
            </div>
          </template>
          <template v-if="button.type == 'website'">
            <div class="row" style="margin-bottom:10px">
              <div class="col-md-3">
                <select class="form-select" v-model="button.url_type" @change="urltype(button.url_type,button.id)">
                  <option value="static">Static</option>
                  <option value="dynamic">Dynamic</option>
                </select>
              </div>
            </div>
            <div class="row" v-if="button.url_type == 'static'">
              <div class="col-md-6">
                <input type="text" class="form-control" placeholder="https://abc.com/static/" v-model="button.url"/>
              </div>
            </div>
            <div class="row" v-if="button.url_type == 'dynamic'">
              <div class="row" style="margin-bottom:10px;">
                <div class="col-md-6">
                  <input type="text" class="form-control" placeholder="https://abc.com/{{1}}/" v-model="button.url"/>
                </div>
                <div class="col-md-3">
                  <input type="text" class="form-control" placeholder="button text" v-model="button.text"/>
                </div>
                <div class="col-md-3">
                  <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButton(button.id)">delete</button>
                </div>
              </div>
              <div class="row" style="margin-bottom:10px;">
                <div class="col-md-3">
                  <button type="button" class="btn btn-yellow mb-1 me-1" @click="AddUrlVariable(button.id)">+ Variable</button>
                </div>
              </div>
              <div class="row" style="margin-bottom:10px;">
                <div class="col-md-6">
                  <input type="text" class="form-control" placeholder="variable" v-model="button.variable"/>
                </div>
              </div>
            </div>
          </template>
          <template v-if="button.type == 'phone'">
            <div class="col-md-3">
              <input type="text" class="form-control" placeholder="text" v-model="button.text"/>
            </div>
            <div class="col-md-3">
              <input type="text" class="form-control" placeholder="country code (e.g: +852)" v-model="button.country"/>
            </div>
            <div class="col-md-3">
              <input type="text" class="form-control" placeholder="phone number" v-model="button.phone_number"/>
            </div>
            <div class="col-md-3">
              <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButton(button.id)">delete</button>
            </div>
          </template>
          <template v-if="button.type == 'offer'">
            <div class="col-md-3">
              <input type="text" class="form-control" placeholder="offer code" v-model="button.offer_code"/>
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
      <div class="col-md-3">
        <button type="button" class="btn btn-teal mb-1 me-1" @click="submit" v-if="submit_button_shown">Create Template</button>
      </div>
    </div>
  </card-body>
</template>
