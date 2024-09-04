<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch } from 'vue'
import { getRequest,postRequest } from '../composables/api.js'
import { responseMessage } from '../composables/response_message.js'
import datepicker from '@/assets/components/plugins/Datepicker.vue';
import { Toast } from 'bootstrap';
import { fileProcess } from '../composables/file_process.js'
import readXlsxFile from 'read-excel-file'

const props = defineProps(['component','template_name','template_category','waba_id','phone_number_id'])

console.log(props)

let customImageMaxSize = ref(3)
let uploaded_file = ref(null)
let file_name = ref(null)
let file_length = ref(null)
let file_type = ref(null)
let header_text = ref('')
let body_text = ref('')
let body_text_message = ref(null)
let body_variables = []
let limited_time_offer_text = ref(null)
let offer_code = ref(null)
let coupon_code_error_message = ref(null)
let url_variable = ref('')
let url_variable_message = ref(null)
let url_variables = []
let recipient = ref(null)
let token = ref(null)
let contacts = ref([])


token = sessionStorage.getItem("token")
const emit = defineEmits(["showtoast"])

watch(body_text,(newValue,oldValue)=>{
    if(body_text.value.includes(",")){
      body_variables = []
      body_text_message.value = null
      body_variables = body_text.value.split(",")
      body_text_message.value = body_variables.length + " variables are inputted"
    } else {
      if(body_text.value == ""){
        body_variables = []
        body_text_message.value = "Empty"
      } else {
        body_variables = []
        body_variables.push(body_text.value)
        body_text_message.value = body_text.value + " is value of variable 1"
      }
      //console.log(body_text_message)
    }
})

function getDateTime(){
  limited_time_offer_text.value = Date.parse(limited_time_offer_text.value)
}

function timeConverter(epoch){
  var time = new Date(parseInt(epoch))
  return time;
}

function restrictSpecialChars() {
  let badchrs = /[$%\^]/;
  if(badchrs.test(offer_code.value)) {
    coupon_code_error_message.value = "you can't use $ or % or ^"
  } else {
    coupon_code_error_message.value = null
  }
}

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

async function uploadFile(event) {
  try {
    let data = await fileProcess(event);
    file_type.value = data.file_type
    file_name.value = data.file_name
    uploaded_file.value = data.file// Again, assuming fileProcess is adjusted to resolve with data
  } catch (error) {
    console.error("Error processing file:", error);
  }
}


async function preview(){
  if(recipient.value){
    let payload = {}
    payload['waba_id'] = props.waba_id
    payload['phone_number_id'] = props.phone_number_id
    payload['template_type'] = "normal"
    props.component.forEach((item) => {
      if(item.type == 'LIMITED_TIME_OFFER'){
        payload['template_type'] = 'limited_time_offer'
      }
    })
    if(props.template_category == 'UTILITY'){
        payload['template_type'] = 'utility'
    }
    payload['uploaded_file'] = uploaded_file.value
    payload['file_name'] = file_name.value
    payload['file_type'] = file_type.value
    payload['header_text'] = header_text.value
    payload['body_variables'] = body_variables
    payload['limited_time_offer'] = limited_time_offer_text.value
    payload['offer_code'] = offer_code.value
    payload['url_variables'] = url_variables
    payload['recipient'] = recipient.value
    payload['components'] = props.component
    payload['template_name'] = props.template_name
    let data = await postRequest("send_ltomessage",payload,token)
    if(data.request.status == 200){
      let notification_message = responseMessage(data)
      emit('showtoast',notification_message)
    } else {
      console.log(data)
    }
  } else {
    let notification_message = "No Recipient is input"
    emit('showtoast',notification_message)
  }
}

function bulk_send(){
  if(contacts.value.length > 0 && contacts.value.length < 101){
    let payload = {}
    payload['waba_id'] = props.waba_id
    payload['phone_number_id'] = props.phone_number_id
    payload['template_type'] = "normal"
    props.component.forEach((item) => {
      if(item.type == 'LIMITED_TIME_OFFER'){
        payload['template_type'] = 'limited_time_offer'
      }
    })
    if(props.template_category == 'UTILITY'){
        payload['template_type'] = 'utility'
    }
    payload['uploaded_file'] = uploaded_file.value
    payload['file_name'] = file_name.value
    payload['file_type'] = file_type.value
    payload['header_text'] = header_text.value
    payload['body_variables'] = body_variables
    payload['limited_time_offer'] = limited_time_offer_text.value
    payload['offer_code'] = offer_code.value
    payload['url_variables'] = url_variables
    payload['components'] = props.component
    payload['template_name'] = props.template_name

    contacts.value.forEach((contact, i) => {
      payload['recipient'] =contact[0]
      send_to_background_task(payload,token)
      //emit('closeModal')
    });
  } else {
    let notification_message = "No recipients or over 100 recipients provided"
    emit('showtoast',notification_message)
  }
}

async function send_to_background_task(payload,token){
    let data = await postRequest("bulk_message_bg",payload,token)
    if(data.request.status == 200){
      let notification_message = "message will be sent to " + payload['recipient'] + " later"
      emit('showtoast',notification_message)
    } else {
      console.log(data)
    }
}

function getComponentName(item){
  if(item == 'HEADER'){
    return "Header";
  } else if (item == 'BODY') {
    return "Body";
  } else if (item == 'LIMITED_TIME_OFFER'){
    return "Expiry time of offer"
  } else if (item == 'FOOTER'){
    return "Footer";
  } else if (item == 'BUTTONS'){
    return "Buttons";
  }
}

function uploadExcel(event) {
  let xlsxfile = event.target.files ? event.target.files[0] : null;
  readXlsxFile(xlsxfile).then((rows) => {
    contacts.value = rows
  })
}

</script>

<style>
#row_margin{
  margin-bottom:20px;
}
</style>

<template>
  <card-body v-for="tc in props.component">
    <div class="row" id="row_margin">
      <div class="flex-fill fw-bold fs-16px">{{getComponentName(tc.type)}}</div>
    </div>
    <template v-if="tc.type == 'HEADER'">
      <div class="row" v-if="tc.format == 'IMAGE' && tc.example">
        <div class="col-md-6">
          <img :src="tc.example.header_handle[0]" style="width:100%">
        </div>
        <div class="col-md-6">
          <label class="form-label" for="defaultFile">Photo change:</label>
          <input type="file" class="form-control" id="defaultFile" @change="uploadFile" accept="image/*"/>
        </div>
      </div>
      <div class="row" v-if="tc.format == 'DOCUMENT' && tc.example">
        <div class="col-md-6">
          <label class="form-label" for="defaultFile"><a :href="tc.example.header_handle[0]" target="_blank">View original document</a></label>
          <input type="file" class="form-control" id="defaultFile" @change="uploadFile" accept="application/pdf"/>
        </div>
      </div>
      <div class="row" v-if="tc.format == 'TEXT'">
        <div class="col-md-4">
          <input type="text" class="form-control" readonly :value="tc.text"/>
        </div>
        <div class="col-md-4">
          <input type="text" class="form-control" readonly :value="tc.example.header_text[0]"/>
        </div>
        <div class="col-md-4">
          <input type="text" class="form-control" placeholder="1 variable is allowed" v-model="header_text"/>
        </div>
      </div>
    </template>
    <template v-if="tc.type == 'BODY'">
      <div class="row" v-if="tc.example">
        <div class="col-md-4">
          <textarea class="form-control" readonly :value="tc.text" rows="3"/>
        </div>
        <div class="col-md-4">
          <input type="text" class="form-control" readonly :value="tc.example.body_text[0]"/>
        </div>
        <div class="col-md-4">
          <input type="text" class="form-control" placeholder="must use , to seperate keywords" v-model="body_text"/>
        </div>
      </div>
      <div class="row" v-else>
        <div class="col-md-4">
          {{tc.text}}
        </div>
      </div>
      <div v-if="body_text_message" style="color:red;">
        {{body_text_message}}
      </div>
    </template>
    <template v-if="tc.type == 'LIMITED_TIME_OFFER'">
      <div class="row">
        <div class="col-md-4">
          <input type="text" class="form-control" readonly :value="timeConverter(tc.limited_time_offer.text)"/>
        </div>
        <div class="col-md-4">
          <datepicker v-model="limited_time_offer_text" @update:model-value="getDateTime"/>
        </div>
      </div>
    </template>
    <template v-if="tc.type == 'FOOTER'">
      <div class="row">
        <div class="col-md-4">
          <input type="text" class="form-control" readonly :value="tc.text"/>
        </div>
      </div>
    </template>
    <template v-if="tc.type == 'BUTTONS'">
      <div class="row" v-for="button in tc.buttons">
        <template v-if="button.type == 'COPY_CODE'">
          <div class="row" id="row_margin">
              <div class="col-md-2">
                <div class="row">
                  <div class="col-md-12">
                    Coupon Code Button
                  </div>
                </div>
              </div>
              <div class="col-md-10">
                <div class="row">
                  <div class="col-md-4">
                    <input type="text" class="form-control" readonly :value="button.text"/>
                  </div>
                  <div class="col-md-4">
                    <input type="text" class="form-control" readonly :value="button.example[0]"/>
                  </div>
                  <div class="col-md-4">
                    <input type="text" class="form-control" placeholder="you can change offer code here" v-model="offer_code" @keyup="restrictSpecialChars"/>
                  </div>
                </div>
              </div>
          </div>
          <div v-if="coupon_code_error_message" style="color:red;">
            {{coupon_code_error_message}}
          </div>
          <hr>
        </template>
        <template v-if="button.type == 'URL'">
          <div class="row" id="row_margin">
              <div class="col-md-2">
                <div class="row">
                  <div class="col-md-12">
                    Website Link Button
                  </div>
                </div>
              </div>
              <div class="col-md-10">
                <div class="row" v-if="button.example">
                  <div class="col-md-3">
                    <input type="text" class="form-control" readonly :value="button.text"/>
                  </div>
                  <div class="col-md-3">
                    <input type="text" class="form-control" readonly :value="button.url"/>
                  </div>
                  <div class="col-md-3">
                    <input type="text" class="form-control" readonly :value="button.example[0]"/>
                  </div>
                  <div class="col-md-3">
                    <input type="text" class="form-control" placeholder="change variable" v-model="url_variable"/>
                  </div>
                </div>
                <div class="row" v-else>
                  <div class="col-md-4">
                    <input type="text" class="form-control" readonly :value="button.text"/>
                  </div>
                  <div class="col-md-4">
                    <input type="text" class="form-control" readonly :value="button.url"/>
                  </div>
                </div>
              </div>
          </div>
          <div v-if="url_variable_message">
            {{url_variable_message}}
          </div>
        </template>
        <template v-if="button.type == 'PHONE_NUMBER'">
          <div class="row" id="row_margin">
            <div class="col-md-2">
              <div class="row">
                <div class="col-md-12">
                  Phone Call Button
                </div>
              </div>
            </div>
            <div class="col-md-10">
              <div class="row">
                <div class="col-md-4">
                  <input type="text" class="form-control" readonly :value="button.text"/>
                </div>
                <div class="col-md-4">
                  <input type="text" class="form-control" readonly :value="button.phone_number"/>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-if="button.type == 'QUICK_REPLY'">
          <div class="row" id="row_margin">
            <div class="col-md-2">
              <div class="row">
                <div class="col-md-12">
                  Quick Reply Button
                </div>
              </div>
            </div>
            <div class="col-md-10">
              <div class="row">
                <div class="col-md-4">
                  <input type="text" class="form-control" readonly :value="button.text"/>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-if="button.type == 'CATALOG'">
          <div class="row" id="row_margin">
            <div class="col-md-12">
              <div class="row">
                <div class="col-md-12">
                  <div class="flex-fill fw-bold fs-16px">Your product catalog of meta is displayed at this whatsapp message</div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-if="button.type == 'FLOW'">
          <div class="row" id="row_margin">
            <div class="col-md-12">
              <div class="row">
                <div class="col-md-12">
                  <div class="flex-fill fw-bold fs-16px">Delivery Address Flow</div>
                </div>
              </div>
            </div>
          </div>
        </template>

      </div>
    </template>
    <hr>
  </card-body>
  <card-body>
    <div class="row" id="row_margin">
      <div class="flex-fill fw-bold fs-16px">Preview</div>
    </div>
    <div class="row">
      <div class="col-xl-6">
        <div class="row">
          <div class="col-md-6">
            <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="Receiver Phone Number" v-model="recipient"/>
          </div>
          <div class="col-md-6">
            <button class="btn btn-default rounded-0" type="button" @click="preview"><span class="d-none d-md-inline">send</span></button>
          </div>
        </div>
      </div>
    </div>
  </card-body>
  <hr>
  <card-body>
    <div class="row" id="row_margin">
      <div class="flex-fill fw-bold fs-16px">Bulk Send</div>
    </div>
    <div class="row">
      <div class="col-xl-6">
        <div class="row">
          <div class="col-md-6">
            <input type="file" class="form-control" id="defaultFile" @change="uploadExcel" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"/>
          </div>
          <div class="col-md-6">
            <button class="btn btn-default rounded-0" type="button" @click="bulk_send"><span class="d-none d-md-inline">Bulk Send</span></button>
          </div>
        </div>
      </div>
    </div>
  </card-body>
</template>
