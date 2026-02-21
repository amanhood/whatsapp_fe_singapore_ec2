<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref, watch, onMounted } from 'vue'
import { getRequest,postRequest } from '../composables/api.js'
import { responseMessage } from '../composables/response_message.js'
import { fileProcess } from '../composables/file_process.js'
import 'vue-select/dist/vue-select.css';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';

let username = ref(null)
let token = ref(null)
let selected_category = ref(null)
let selected_language = ref(null)
let template_name = ref(null)
let header = ref(null)
let header_variables = ref([])
let header_warning_message = ref(null)
let spin_loading = ref(false)

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
const props = defineProps(['user_id','landing_pages','waba_id','phone_number_id','phone_number'])

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
  { id:'website',title: "Website" },
  { id:'phone',title: "Phone" },
  { id:'offer',title: "Offer" }
]

let url_options = [
{ id:'static',title: "Static" }
]
let selected_landing_page = ref(null)

function selectLandingPage(button){
    console.log(button)
    let title = getSlug(selected_landing_page.value)
    let url = "https://app.biz-api.com/page/landing-page/" + props.user_id + "/" + title
    button.url = url
    console.log(button)
}

function getSlug(title) {
  return title.replace(/\s+/g, '-');
}

function selectButton(){
    if(buttons.value.length < 3){
      if(selected_button_type.value.id == "quick_reply"){
        custom_button_shown.value = true
        buttons.value.push({'id':button_id.value,'type':selected_button_type.value.id,text:''})
      } else if (selected_button_type.value.id == "website"){
        custom_button_shown.value = true
        buttons.value.push({'id':button_id.value,'type':selected_button_type.value.id,text:'','url':'','variable':'','url_type':''})
      } else if (selected_button_type.value.id == "phone"){
        custom_button_shown.value = true
        buttons.value.push({'id':button_id.value,'type':selected_button_type.value.id,text:'','country':'','phone_number':''})
      } else if (selected_button_type.value.id == "offer"){
        custom_button_shown.value = true
        buttons.value.push({'id':button_id.value,'type':selected_button_type.value.id,offer_code:''})
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
  const baseRequired = [1, 2, 3, 4]
  const hasAllBase = baseRequired.every(n => indices.includes(n))

  if (!hasAllBase) {
    body_warning_message.value =
      "The first four variables {{1}}, {{2}}, {{3}} and {{4}} are required and cannot be removed."
    return
  }

  // 4) No warning – formatting OK & 1–4 exist
  body_warning_message.value = null

  // 5) Sync extra variables (5, 6, 7...) with body_variables
  const dynamicIndices = indices.filter(n => n > 4)
  const desiredLength = 4 + dynamicIndices.length   // 4 fixed + extra

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


function submit(){
    console.log(buttons.value)
    if(selected_language.value){
      let data = {}
      var re = /\{\{.*?\}\}/g
      let re_variables = body.value.match(re)
      if(re_variables && re_variables.length != body_variables.value.length){
        let notification_message = "Unmatched body variables, you have " + re_variables.length + " variables. But got "  + body_variables.value.length + " variables at body"
        emit('showtoast',notification_message)
      } else {
        data['waba_id'] = props.waba_id
        data['phone_number_id'] = props.phone_number_id
        data['phone_number'] = props.phone_number
        data['template_name'] = template_name.value
        data['category'] = 'MARKETING'
        data['language'] = selected_language.value.id
        data['component'] = []
        if(header.value){
          data['component'].push({
            "type": "header",
            "format": "text",
            "text": header.value,
          })
        } else {
          let message = "Please input header"
          let notification_message = responseMessage(message)
          emit('showtoast',notification_message)
        }
        
        if(body.value){
          if(body_variables.value.length > 0){
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
              "text": body.value
            })
          }
          
        }

        if(footer.value){
          data['component'].push({
            "type": "footer",
            "text": footer.value
          })
        }

        if(buttons.value.length > 0){
          let buttons_components = []
          buttons.value.forEach((item) => {
            console.log(item)
            if(item.type=='quick_reply'){
              buttons_components.push({"type": "QUICK_REPLY","text": item.text})
            } else if(item.type=='website'){
              if(item.url_type.id=='static'){
                buttons_components.push({"type": "URL","url":item.url,"text":item.text})
              } else if(item.url_type.id=='dynamic'){
                buttons_components.push({"type": "URL","url":item.url,"text":item.text,"example":[item.variable]})
              }
            } else if(item.type=='phone'){
              buttons_components.push({"type": "PHONE_NUMBER","text": item.text,"phone_number":item.country+item.phone_number})
            } else if(item.type=='offer'){
              buttons_components.push({"type": "COPY_CODE","example": item.offer_code})
            }
          })
          data['component'].push({
              "type":'buttons',
              "buttons":buttons_components
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
  spin_loading.value = true
  let data = await postRequest("generate_coupontemplate",payload,token)
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

onMounted(()=>{
  body_variables.value = [
    { index: 1, value: 'code' },
    { index: 2, value: 'title' },
    { index: 3, value: 'content' },
    { index: 4, value: 'url' }
  ]
  body.value = `{{1}}
{{2}}
{{3}}
{{4}}`
  })

</script>

<template>
  <loading v-model:active="spin_loading"
  :is-full-page="true"/>
  <card-body class="pb-2">
    <div class="row">
      <div class="col-md-12">
        <div class="row" style="margin-bottom:10px;">
          <div class="flex-fill fw-bold fs-16px">Template name and language</div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="name" v-model="template_name"/>
          </div>
          <div class="col-md-6">
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
            The code, title, content and website url of coupon will be inserted to the body of this template. 
          </div>
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
          <div class="col-auto" style="display:flex;align-items:center;">
            <span v-text="'{{' + variable.index + '}}'"></span>
          </div>

          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="variable" v-model="variable.value" :readonly="variable.index <= 4"/>
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
              <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButton(button.id)">delete</button>
            </div>
          </template>
          <template v-if="button.type == 'website'">
            <div class="row">
              <div class="row" style="margin-bottom:10px;">
                <div class="col-md-6" v-if="props.landing_pages.length > 0">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Select Landing Page</label>
                  <v-select v-model="selected_landing_page" :options="props.landing_pages" label="title" :reduce="loc => loc.title" @update:modelValue="selectLandingPage(button)"></v-select>
                </div>
              </div>
              <div class="row" style="margin-bottom:10px;">
                <div class="col-md-6">
                  <input type="text" class="form-control" placeholder="https://abc.com/static/" v-model="button.url"/>
                </div>
                <div class="col-md-3">
                  <input type="text" class="form-control" placeholder="button text" v-model="button.text"/>
                </div>
                <div class="col-md-3">
                  <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButton(button.id)">delete</button>
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
            <div class="row" style="margin-bottom:10px;">
              <div class="col-md-12">
                The code of coupon will be inserted to this button of template
              </div>
            </div>
            <div class="row">
              <div class="col-md-3">
                <input type="text" class="form-control" placeholder="offer code" v-model="button.offer_code"/>
              </div>
              <div class="col-md-3">
                <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButton(button.id)">delete</button>
              </div>
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