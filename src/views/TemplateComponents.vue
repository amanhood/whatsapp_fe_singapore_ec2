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


let customImageMaxSize = ref(3)
let uploaded_file = ref(null)
let file_name = ref(null)
let file_length = ref(null)
let file_type = ref(null)
let header_text = ref('')
let body_variables = ref([])
let limited_time_offer_text = ref(null)
let offer_code = ref(null)
let url_variables = ref([])
let recipient = ref(null)
let token = ref(null)
let contacts = ref([])

console.log(props.waba_id)

token = sessionStorage.getItem("token")
const emit = defineEmits(["showtoast"])


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
    let message = "$ or % or ^ are not allowed to use"
    emit('showtoast',message)
  }
}


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
    let variables = body_variables.value.length > 0
    ? body_variables.value
        .map(item => item.value)
        .filter(value => value !== null && value !== undefined) // filter out null or undefined
    : [];
    payload['body_variables'] = variables
    payload['limited_time_offer'] = limited_time_offer_text.value
    payload['offer_code'] = offer_code.value
    let link_variables = body_variables.value.length > 0
    ? url_variables.value
        .map(item => item.value)
        .filter(value => value !== null && value !== undefined) // filter out null or undefined
    : [];
    payload['url_variables'] = link_variables
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
    let notification_message = "No Recipient"
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
    if (body_variables.value.length > 0){
      let variables = body_variables.value.map(item => item.value);
      payload['body_variables'] = variables
    } else {
      payload['body_variables'] = body_variables.value
    }

    payload['limited_time_offer'] = limited_time_offer_text.value
    payload['offer_code'] = offer_code.value
    if(url_variables.value.length > 0){
      let variables = url_variables.value.map(item => item.value);
      payload['url_variables'] = variables
    }
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
    return "Expiry date and time of special offer"
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

function updateBodyVariables(){
  props.component.forEach((item, i) => {
    if(item.type == 'BODY'){
      if(item.example){
        item.example.body_text[0].forEach((bt, i) => {
          body_variables.value.push({'value':null})
        });
      }
    } else if(item.type == 'BUTTONS'){
      item.buttons.forEach((button, i) => {
        if(button.type == 'URL' && button.example){
          url_variables.value.push({'value':null})
        }
      });

    }
  });
}
updateBodyVariables()


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
      <fragment v-if="tc.format == 'IMAGE' && tc.example">
        <div class="row">
          <div class="col-md-6" style="margin-top:10px;">
            <img :src="tc.example.header_handle[0]" style="width:30%">
          </div>
        </div>
        <div class="row" style="margin-top:20px;">
          <div class="col-6">
            <card>
              <card-body style="background-color:#ffffe0;">
                <p class="card-text">If you want to change the default header image, please upload</p>
                <input type="file" class="form-control" id="defaultFile" @change="uploadFile" accept="image/*"/>
              </card-body>
            </card>
          </div>
        </div>
      </fragment>

      <fragment v-if="tc.format == 'DOCUMENT' && tc.example">
        <div class="row">
          <div class="col-md-6" style="margin-top:10px;">
            <label class="form-label" for="defaultFile"><a :href="tc.example.header_handle[0]" target="_blank">View original document</a></label>
          </div>
        </div>
        <div class="row" style="margin-top:20px;">
          <div class="col-6">
            <card>
              <card-body style="background-color:#ffffe0;">
                <p class="card-text">If you want to change the default document, please upload</p>
                <input type="file" class="form-control" id="defaultFile" @change="uploadFile" accept="application/pdf"/>
              </card-body>
            </card>
          </div>
        </div>
      </fragment>

      <fragment v-if="tc.format == 'TEXT'">
        <div class="row">
          <div class="row" style="margin-top:10px;">
            <div class="col-6">
              <card>
                <card-body style="border:1px solid #C5C5C5;">
                  <p class="card-text">{{tc.text}}</p>
                </card-body>
              </card>
            </div>
          </div>
          <div class="row" style="margin-top:10px;">
            <div class="col-6">
              <card>
                <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
                    <p class="card-text">Variable: {{tc.example.header_text[0]}}</p>
                    <p class="card-text">You could input text to replace "{{tc.example.header_text[0]}}"</p>
                    <input type="text" class="form-control" v-model="header_text"/>
                </card-body>
              </card>
            </div>
          </div>
        </div>
      </fragment>
    </template>

    <template v-if="tc.type == 'BODY'">
      <div class="row">
          <div class="row">
            <div class="col-6">
              <card>
                <card-body style="border:1px solid #C5C5C5;">
                  <p class="card-text">{{tc.text}}</p>
                </card-body>
              </card>
            </div>
          </div>
          <div class="row" style="margin-top:10px;" v-if="tc.example">
            <div class="col-6">
              <card>
                <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
                    <p class="card-text">Variable(s): {{tc.example.body_text[0].join(", ")}}</p>
                    <p class="card-text">you could replace the above {{tc.example.body_text[0].length}} variable(s)</p>
                    <div class="row" v-for="bv in body_variables">
                      <div class="col-12" style="margin-top:10px;">
                        <input type="text" class="form-control" v-model="bv.value"/>
                      </div>
                    </div>
                </card-body>
              </card>
            </div>
          </div>
      </div>
    </template>

    <template v-if="tc.type == 'LIMITED_TIME_OFFER'">
      <div class="row">
          <div class="row">
            <div class="col-6">
              <card>
                <card-body style="border:1px solid #C5C5C5;">
                  <p class="card-text">{{timeConverter(tc.limited_time_offer.text)}}</p>
                </card-body>
              </card>
            </div>
          </div>
          <div class="row" style="margin-top:10px;">
            <div class="col-6">
              <card>
                <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
                    <p class="card-text">You could change the expiry date and time of special offer</p>
                    <div class="row">
                      <div class="col-12" style="margin-top:10px;">
                        <datepicker v-model="limited_time_offer_text" @update:model-value="getDateTime"/>
                      </div>
                    </div>
                </card-body>
              </card>
            </div>
          </div>
      </div>
    </template>

    <template v-if="tc.type == 'FOOTER'">
      <div class="row">
          <div class="row">
            <div class="col-6">
              <card>
                <card-body style="border:1px solid #C5C5C5;">
                  <p class="card-text">{{tc.text}}</p>
                </card-body>
              </card>
            </div>
          </div>
      </div>
    </template>

    <template v-if="tc.type == 'BUTTONS'">
      <div class="row" v-for="button in tc.buttons">
        <template v-if="button.type == 'COPY_CODE'">
          <div class="row">
              <div class="row">
                <div class="col-6">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-6" style="margin-top:10px;">
                          Coupon Button: {{button.text}}
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-6" style="margin-top:10px;">
                          Offer Code: {{button.example[0]}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <div class="row" style="margin-top:10px;margin-bottom:10px;">
            <div class="col-6">
              <card>
                <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
                    <p class="card-text">You could change the offer code</p>
                    <div class="row">
                      <div class="col-12" style="margin-top:10px;">
                        <input type="text" class="form-control" placeholder="" v-model="offer_code" @keyup="restrictSpecialChars"/>
                      </div>
                    </div>
                </card-body>
              </card>
            </div>
          </div>
          <hr>
        </template>

        <template v-if="button.type == 'URL'">
          <div class="row">
              <div class="row">
                <div class="col-6">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-6" style="margin-top:10px;">
                          Website Button: {{button.text}}
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-12" style="margin-top:10px;">
                          Url: {{button.url}}
                        </div>
                      </div>
                      <div class="row" v-if="button.example">
                        <div class="col-6" style="margin-top:10px;">
                          Variable: {{button.example[0]}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <div class="row" style="margin-top:10px;" v-if="url_variables.length > 0">
            <div class="col-6">
              <card>
                <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
                    <p class="card-text">You could change the variable</p>
                    <div class="row">
                      <div class="col-12" style="margin-top:10px;" v-for="uv in url_variables">
                        <input type="text" class="form-control" placeholder="" v-model="uv.value"/>
                      </div>
                    </div>
                </card-body>
              </card>
            </div>
          </div>
          <hr style="margin-top:10px;">
        </template>

        <template v-if="button.type == 'PHONE_NUMBER'">
          <div class="row">
              <div class="row">
                <div class="col-6">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-6" style="margin-top:10px;">
                          Call Button: {{button.text}}
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-6" style="margin-top:10px;">
                          Phone number: {{button.phone_number}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <hr style="margin-top:10px;">
        </template>


        <template v-if="button.type == 'QUICK_REPLY'">
          <div class="row">
              <div class="row">
                <div class="col-6">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-6" style="margin-top:10px;">
                          Quick reply: {{button.text}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <hr style="margin-top:10px;">
        </template>

        <template v-if="button.type == 'CATALOG'">
          <div class="row">
              <div class="row">
                <div class="col-6">
                  <card>
                    <card-body style="border:1px solid #C5C5C5;">
                      <div class="row">
                        <div class="col-6" style="margin-top:10px;">
                          Text: {{button.text}}
                        </div>
                      </div>
                    </card-body>
                  </card>
                </div>
              </div>
          </div>
          <hr style="margin-top:10px;">
        </template>
      </div>
    </template>
  </card-body>

  <card-body>
    <div class="row" id="row_margin">
      <div class="flex-fill fw-bold fs-16px">Message preview</div>
    </div>
    <div class="row" style="margin-top:10px;">
      <div class="col-6">
        <card>
          <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
              <p class="card-text">Please input the phone number for message preview</p>
              <div class="row">
                <div class="col-12" style="margin-top:10px;">
                  <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="Country code + phone number" v-model="recipient"/>
                </div>
              </div>
              <div class="row">
                <div class="col-12" style="margin-top:10px;">
                  <button type="button" class="btn btn-primary mb-1 me-1" @click="preview">Preview</button>
                </div>
              </div>
          </card-body>
        </card>
      </div>
    </div>
    <hr style="margin-top:10px;">
  </card-body>
  <hr>

  <card-body>
    <div class="row" id="row_margin">
      <div class="flex-fill fw-bold fs-16px">Send to multiple recipients</div>
    </div>
    <div class="row" style="margin-top:10px;">
      <div class="col-6">
        <card>
          <card-body style="border:1px solid #C5C5C5;background-color:#ffffe0;">
              <div class="row">
                <div class="col-12" style="margin-top:10px;">
                  <input type="file" class="form-control" id="defaultFile" @change="uploadExcel" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"/>
                </div>
              </div>
              <div class="row">
                <div class="col-12" style="margin-top:10px;">
                  <button type="button" class="btn btn-primary mb-1 me-1" @click="bulk_send">Send Multiples</button>
                </div>
              </div>
          </card-body>
        </card>
      </div>
    </div>
  </card-body>
</template>
