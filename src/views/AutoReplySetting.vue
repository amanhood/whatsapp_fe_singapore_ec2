<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest,putRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';

const router = useRouter()

let username = ref(null)
let token = ref(null)
let whatsapp_accounts = ref([])
let select_account = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let selected_phone_number = ref(null)
let key = ref(null)
let sequence = ref(null)
let is_parent_id = ref(null)
let parent_id = ref(null)
let message = ref(null)
let message_types = [
  {value:'text_message',label:'Text Message'},
  {value:'button',label:'Text Button'},
  {value:'flow',label:'Flow Button'},
  {value:'url',label:'Url Button'}
]
let flow_id = ref(null)
let url_header_text = ref(null)
let url_body_text = ref(null)
let url_footer_text = ref(null)
let url_button_text = ref(null)
let url = ref(null)
let selected_message_type = ref(null)
let notification_message = ref(null)
let button_body = ref(null)
let buttons = ref([])
let button_id = ref(1)
let flow_options = [
  {value:'yes',label:'Yes'},
  {value:'no',label:'No'}
]
let button_types = [
  {value:'text_message',label:'Text'},
  {value:'flow',label:'Flow'},
  {value:'url',label:'Url'}
]
let flows = ref([])
let auto_reply_messages = ref([])
let auto_reply_messages_by_parent = ref([])
let selected_buttons = ref([])
let selected_reply = ref(null)
let selected_buttons_id = ref(1000000)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  data['data']['whatsapp_accounts'].forEach((item, i) => {
    whatsapp_accounts.value.push({'id':item.phone_number_id,'value':item.phone_number,'waba':item.waba_id})
  });
}

function selectAccount(){
  selected_phone_number_id.value = select_account.value.id
  selected_waba_account.value = select_account.value.waba
  selected_phone_number.value = select_account.value.value
  getFlows()
  getAutoReplyMessages()
}

async function getFlows(){
  let payload = {}
  let response_message
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  let data = await postRequest("get_flows",payload,token)
  if(data.request.status == 200){
    data['data']['data'].forEach((item, i) => {
      if(item.status == 'PUBLISHED'){
        flows.value.push({'value':item.id,'label':item.name})
      }
    });
  } else {
    response_message = "Failed to get Flows"
    showToast(response_message)
  }
}

async function getAutoReplyMessages(){
  let payload = {}
  let response_message = null
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  let data = await postRequest("get_auto_reply_messages",payload,token)
  if(data.request.status == 200){
    auto_reply_messages.value = data['data']
  } else {
    response_message = "Failed to get auto reply messages"
    showToast(response_message)
  }
}


async function createAutoReplyMessage(){
  if (key.value){
    let payload = {}
    let response_message = null
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
    payload['display_phone_number'] = selected_phone_number.value
    payload['key'] = key.value
    payload['reply_type'] = selected_message_type.value
    payload['message'] = message.value
    payload['sequence'] = sequence.value
    payload['flow_id'] = flow_id.value
    payload['url_header_text'] = url_header_text.value
    payload['url_body_text'] = url_body_text.value
    payload['url_footer_text'] = url_footer_text.value
    payload['url_button_text'] = url_button_text.value
    payload['url'] = url.value
    payload['parent_id'] = parent_id.value
    payload['button_body'] = button_body.value
    payload['buttons'] = buttons.value
    let data = await postRequest("create_auto_reply_message",payload,token)
    if(data.request.status == 200){
      if(data['data']['data'] == "ok"){
        response_message = "created auto reply messages"
      } else {
        response_message = "failed to create auto reply messages"
      }
      showToast(response_message)
      key.value = null
      selected_message_type.value = null
      message.value = null
      sequence.value = null
      parent_id.value = null
      button_body.value = null
      flow_id.value = null
      url_header_text.value = null
      url_body_text.value = null
      url_footer_text.value = null
      url_button_text.value = null
      url.value = null
      buttons.value = []
      getAutoReplyMessages()
    } else {
      response_message = "failed to create auto reply messages"
      showToast(response_message)
    }
  } else {
    response_message = "failed to create auto reply messages"
    showToast(response_message)
  }

}

function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
}

function onSelectMessageType(){
  if(selected_message_type.value == 'button'){
    addButton()
  } else {
    buttons.value = []
  }
}

function addButton(){
  buttons.value.push({
    'id':button_id.value,
    'sequence':'',
    'key':'',
    'title':'',
    'button_type':'',
    'flow_id':'',
    'button_text':'',
    'url_header_text':'',
    'url_body_text':'',
    'url_footer_text':'',
    'url_button_text':'',
    'url':''
  })
  button_id.value += 1
}

function deleteButton(button_id){
    const index = buttons.value.findIndex(item => item.id === button_id)
    if (index !== -1) {
      buttons.value.splice(index, 1)
    }
}

function addButtonAtEditMessage(){
  selected_buttons.value.push({
    'id':selected_buttons_id.value,
    'sequence':'',
    'key':'',
    'title':'',
    'button_type':'',
    'flow_id':'',
    'button_text':'',
    'url_header_text':'',
    'url_body_text':'',
    'url_footer_text':'',
    'url_button_text':'',
    'url':''
  })
  selected_buttons_id.value += 1
}

function deleteButtonAtEditMessage(button_id){
    const index = selected_buttons.value.findIndex(item => item.id === button_id)
    if (index !== -1) {
      selected_buttons.value.splice(index, 1)
    }
}

function viewButtons(buttons){
    selected_buttons.value = buttons
}

function selectReplyMessage(reply_id){
    selected_reply.value = reply_id
}

async function deleteAutoReplyMessage(){
    let response_message = null
    let data = await deleteRequest("delete_auto_reply_message/"+selected_reply.value,token)
    if(data.request.status == 200){
      response_message = "deleted auto reply messages"
      showToast(response_message)
      getAutoReplyMessages()
    } else {
      response_message = "failed to delete auto reply messages"
      showToast(response_message)
    }
}

function onSelectParentId(){
  if(is_parent_id.value == 'no'){
    getAutoReplyMessagesByParent()
  }
}

async function getAutoReplyMessagesByParent(){
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  let response_message = null
  let data = await postRequest("get_auto_reply_messages_by_parent",payload,token)
  if(data.request.status == 200){
    data['data'].forEach((item, i) => {
      auto_reply_messages_by_parent.value.push({'value':item['id'],'label':item['key']})
    });
  } else {
    response_message = "Failed to get auto reply messages"
    showToast(response_message)
  }
}

async function editReplyMessage(auto_reply_message){
  let response_message = null
  let payload = {}
  payload['data'] = auto_reply_message
  let data = await putRequest("update_auto_reply_message/"+auto_reply_message['id'],payload,token)
  if(data.request.status == 200){
    if(data['data']['data'] == "ok"){
      response_message = "updated auto reply messages"
    } else {
      response_message = "failed to update auto reply messages"
    }
    showToast(response_message)
    getAutoReplyMessages()
  } else {
    response_message = "Failed to update auto reply messages"
    showToast(response_message)
  }
}

function getReplyType(reply_type){
  if(reply_type == 'text_message'){
    return "Text"
  } else if(reply_type == 'button'){
    return "Button"
  } else if(reply_type == 'flow'){
    return "Flow"
  } else {
    return "Url"
  }
}


checkLogin()
checkWaba()

</script>

<template>
  <div class="modal fade" id="modalLg">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm to delete ?</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="deleteAutoReplyMessage">Delete</button>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="buttons">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Buttons</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <div class="row">
            <div class="form-group mb-3" style="margin-top:10px;">
              <button type="button" class="btn btn-teal" @click="addButtonAtEditMessage">Add Button</button>
            </div>
          </div>
          <div class="row" v-for="button in selected_buttons" style="margin-bottom:40px;">

            <div class="col-xl-4">
              <div class="row">
                <div class="col-md-4">Key</div>
                <div class="col-md-4">Sequence</div>
                <div class="col-md-4">Button type</div>
              </div>
            </div>

            <div class="col-xl-8">
              <div class="row" v-if="button.button_type =='text_message'">
                <div class="col-md-4">Button title</div>
                <div class="col-md-8">Text message</div>
              </div>
              <div class="row" v-if="button.button_type =='flow'">
                <div class="col-md-4">Button title</div>
                <div class="col-md-8">Flow template</div>
              </div>
              <div class="row" v-if="button.button_type =='url'">
                <div class="col-md-4">Button title</div>
                <div class="col-md-8">Button Link</div>
              </div>
            </div>


            <div class="col-xl-4">
              <div class="row">
                <div class="col-md-4"><input type="text" class="form-control" placeholder="" v-model="button.key"/></div>
                <div class="col-md-4"><input type="number" class="form-control" placeholder="" v-model="button.sequence"/></div>
                <div class="col-md-4">
                    <select class="form-select" id="exampleFormControlSelect1" v-model="button.button_type">
                      <option v-for="item in button_types" :key="item.value" :value="item.value">{{item.label}}</option>
                    </select>
                </div>
              </div>
            </div>
            <div class="col-xl-8">
              <div class="row" v-if="button.button_type =='text_message'">
                <div class="col-md-4"><input type="text" class="form-control" placeholder="" v-model="button.title"/></div>
                <div class="col-md-7">
                    <textarea class="form-control" placeholder="" v-model="button.button_text" rows="3"/>
                </div>
                <div class="col-md-1"><button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButtonAtEditMessage(button.id)">X</button></div>
              </div>
              <div class="row" v-else-if="button.button_type =='flow'">
                <div class="col-md-4"><input type="text" class="form-control" placeholder="" v-model="button.title"/></div>
                <div class="col-md-7" v-if="flows.length > 0">
                    <select class="form-select" id="exampleFormControlSelect2" v-model="button.flow_id">
                      <option v-for="item in flows" :key="item.value" :value="item.value">{{item.label}}</option>
                    </select>
                </div>
                <div class="col-md-1"><button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButtonAtEditMessage(button.id)">X</button></div>
              </div>
              <div class="row" v-else-if="button.button_type =='url'">
                  <div class="col-md-4">
                      <input type="text" class="form-control" placeholder="" v-model="button.title"/>
                  </div>
                  <div class="col-md-7">
                      <input type="text" class="form-control" placeholder="" v-model="button.url"/>
                  </div>
                  <div class="col-md-1"><button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButtonAtEditMessage(button.id)">X</button></div>

                  <div class="row" style="margin-top:10px;">
                    <div class="col-md-4">
                        <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Text of Link Button</label>
                        <input type="text" class="form-control" placeholder="" v-model="button.url_button_text"/>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Header of button</label>
                        <input type="text" class="form-control" placeholder="" v-model="button.url_header_text"/>
                    </div>

                    <div class="col-md-4">
                        <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Footer of button</label>
                        <input type="text" class="form-control" placeholder="" v-model="button.url_footer_text"/>
                    </div>
                  </div>
                  <div class="row" style="margin-top:10px;">
                    <div class="col-md-6">
                        <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Body of button</label>
                        <textarea class="form-control" placeholder="" v-model="button.url_body_text" rows="3"/>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalLg2">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Create Auto Reply Message</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <div class="row">
            <div class="col-xl-6">
              <div class="form-group mb-3">
                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">First message of auto reply?</label>
                <select class="form-select" id="exampleFormControlSelect2" v-model="is_parent_id" @change="onSelectParentId">
                  <option v-for="item in flow_options" :key="item.value" :value="item.value">{{item.label}}</option>
                </select>
              </div>
              <div class="form-group mb-3" v-if="is_parent_id == 'no'">
                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Select parent message</label>
                <select class="form-select" id="exampleFormControlSelect2" v-model="parent_id">
                  <option v-for="item in auto_reply_messages_by_parent" :key="item.value" :value="item.value">{{item.label}}</option>
                </select>
              </div>

              <div class="form-group mb-3">
                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Key</label>
                <input type="text" class="form-control" placeholder="" v-model="key"/>
              </div>
              <div class="form-group mb-3">
                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Sequence</label>
                <input type="number" class="form-control" placeholder="" v-model="sequence"/>
              </div>
              <div class="form-group mb-3">
                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Text Message or Buttons</label>
                <select class="form-select" id="exampleFormControlSelect1" v-model="selected_message_type" @change="onSelectMessageType">
                  <option v-for="item in message_types" :key="item.value" :value="item.value">{{item.label}}</option>
                </select>
              </div>
              <div class="form-group mb-3" v-if="selected_message_type=='text_message'">
                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Message</label>
                <textarea class="form-control" placeholder="" v-model="message" rows="3"/>
              </div>
              <div class="form-group mb-3" v-if="selected_message_type=='button'">
                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Body</label>
                <textarea class="form-control" placeholder="" v-model="button_body" rows="3"/>
              </div>
              <div class="form-group mb-3" v-if="selected_message_type=='flow'">
                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Select flow template</label>
                <select class="form-select" id="exampleFormControlSelect2" v-model="flow_id">
                  <option v-for="item in flows" :key="item.value" :value="item.value">{{item.label}}</option>
                </select>
              </div>
              <fragment v-if="selected_message_type=='url'">
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Header</label>
                  <input type="text" class="form-control" placeholder="" v-model="url_header_text"/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Body</label>
                  <textarea class="form-control" placeholder="" v-model="url_body_text" rows="3"/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Footer</label>
                  <input type="text" class="form-control" placeholder="" v-model="url_footer_text"/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Display text of button</label>
                  <input type="text" class="form-control" placeholder="" v-model="url_button_text"/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Url</label>
                  <input type="text" class="form-control" placeholder="" v-model="url"/>
                </div>
              </fragment>
            </div>
          </div>

          <div class="row" v-if="selected_message_type=='button'">
            <div class="form-group mb-3" style="margin-top:10px;">
              <button type="button" class="btn btn-teal" @click="addButton">Add Button</button>
            </div>
          </div>

          <div class="row" v-for="button in buttons" style="margin-bottom:10px;">
            <div class="col-xl-4">
              <div class="row">
                <div class="col-md-4">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Key</label>
                  <input type="text" class="form-control" placeholder="" v-model="button.key"/>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Sequence</label>
                  <input type="number" class="form-control" placeholder="" v-model="button.sequence"/>
                </div>
                <div class="col-md-4">
                    <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Button type</label>
                    <select class="form-select" id="exampleFormControlSelect1" v-model="button.button_type">
                      <option v-for="item in button_types" :key="item.value" :value="item.value">{{item.label}}</option>
                    </select>
                </div>
              </div>
            </div>
            <div class="col-xl-8">
              <div class="row" v-if="button.button_type =='text_message'">
                <div class="col-md-4">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Title</label>
                  <input type="text" class="form-control" placeholder="" v-model="button.title"/>
                </div>
                <div class="col-md-7">
                    <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Message</label>
                    <textarea class="form-control" placeholder="" v-model="button.button_text" rows="3"/>
                </div>
                <div class="col-md-1">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Delete</label>
                  <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButton(button.id)">X</button>
                </div>
              </div>
              <div class="row" v-else-if="button.button_type =='flow'">
                <div class="col-md-4">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Title</label>
                  <input type="text" class="form-control" placeholder="Button title" v-model="button.title"/>
                </div>
                <div class="col-md-7" v-if="button.button_type =='flow' && flows.length > 0">
                    <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Select flow template</label>
                    <select class="form-select" id="exampleFormControlSelect2" v-model="button.flow_id">
                      <option v-for="item in flows" :key="item.value" :value="item.value">{{item.label}}</option>
                    </select>
                </div>
                <div class="col-md-1">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Delete</label>
                  <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButton(button.id)">X</button>
                </div>
              </div>
              <div class="row" v-else-if="button.button_type =='url'">
                <div class="col-md-4" style="margin-top:10px;">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Display text of button</label>
                  <input type="text" class="form-control" placeholder="" v-model="button.url_button_text"/>
                </div>
                <div class="col-md-7" style="margin-top:10px;">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Url</label>
                  <input type="text" class="form-control" placeholder="" v-model="button.url"/>
                </div>
                <div class="col-md-1" style="margin-top:10px;">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Delete</label>
                  <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteButton(button.id)">X</button>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Header</label>
                  <input type="text" class="form-control" placeholder="" v-model="button.url_header_text"/>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Body</label>
                  <textarea class="form-control" placeholder="" v-model="button.url_body_text" rows="3"/>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">Footer</label>
                  <input type="text" class="form-control" placeholder="" v-model="button.url_footer_text"/>
                </div>

              </div>
            </div>
          </div>

          <div class="row">
            <div class="form-group mb-3" style="margin-top:10px;">
              <button type="button" class="btn btn-teal" data-bs-dismiss="modal" @click="createAutoReplyMessage">Create Auto Reply</button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <div class="toasts-container">
    <div class="toast fade hide" data-autohide="false" id="toast-1">
      <div class="toast-header">
        <i class="far fa-bell text-muted me-2"></i>
        <strong class="me-auto">Alert</strong>
        <small></small>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">
        {{notification_message}}
      </div>
    </div>
  </div>

  <card>
    <card-body class="pb-2">
      <div class="row">
        <div class="col-md-6">
          <div class="row" style="margin-bottom:10px;">
            <div class="flex-fill fw-bold fs-16px">Select phone number</div>
          </div>
          <div class="row">
            <div class="col-md-6">
              <v-select v-model="select_account" :options="whatsapp_accounts" label="value" @update:modelValue="selectAccount"></v-select>
            </div>
          </div>
        </div>
      </div>
    </card-body>
    <hr>

    <card-body class="pb-2" v-if="selected_waba_account">
      <div class="row">
        <div class="form-group mb-3">
          <button type="button" class="btn btn-teal mb-1 me-1" data-bs-toggle="modal" data-bs-target="#modalLg2">Create Auto Reply</button>
        </div>
      </div>
    </card-body>

    <card-body class="pb-2">
      <div class="row">
        <div class="col-md-3">
          <div class="row">
            <div class="col-md-2">
              <label for="formControlRange" class="form-label">Level</label>
            </div>
            <div class="col-md-7">
              <label for="formControlRange" class="form-label">Key</label>
            </div>
            <div class="col-md-3">
              <label for="formControlRange" class="form-label">Order</label>
            </div>
          </div>
        </div>
        <div class="col-md-5">
          <div class="row">
            <div class="col-md-9">
              <label for="formControlRange" class="form-label">Message content</label>
            </div>
            <div class="col-md-3">
              <label for="formControlRange" class="form-label">Type</label>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="row">
            <div class="col-md-4">
              <label for="formControlRange" class="form-label">Button(s)</label>
            </div>
            <div class="col-md-4">
              <label for="formControlRange" class="form-label">Update</label>
            </div>
            <div class="col-md-4">
              <label for="formControlRange" class="form-label">Delete</label>
            </div>
          </div>
        </div>
      </div>
      <div class="row" v-for="reply in auto_reply_messages" style="margin-bottom:10px;">
        <div class="col-md-3">
          <div class="row">
            <div class="col-md-2">
              <label for="formControlRange">1</label>
            </div>
            <div class="col-md-7">
              <input type="text" class="form-control" id="exampleFormControlInput1" v-model="reply.key"/>
            </div>
            <div class="col-md-3">
              <input type="number" class="form-control" id="exampleFormControlInput1" v-model="reply.sequence"/>
            </div>
          </div>
        </div>
        <div class="col-md-5">
          <div class="row">
            <div class="col-md-9" v-if="reply.reply_type == 'flow'">
              <div class="mb-3 row">
                <label for="inputEmail3" class="col-sm-2 col-form-label"></label>
                <div class="col-sm-10">
                  <select class="form-select" id="exampleFormControlSelect2" v-model="reply.flow_id">
                    <option v-for="item in flows" :key="item.value" :value="item.value">{{item.label}}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="col-md-9" v-else-if="reply.reply_type == 'text_message'">
              <div class="mb-3 row">
                <label for="inputEmail3" class="col-sm-2 col-form-label">Message</label>
                <div class="col-sm-10">
                  <textarea class="form-control" v-model="reply.message" rows="3" v-if="reply.reply_type == 'text_message'"/>
                  <textarea class="form-control" v-model="reply.message" rows="3" :readonly="true" v-else />
                </div>
              </div>
            </div>
            <div class="col-md-9" v-else-if="reply.reply_type == 'button'">
              <div class="mb-3 row">
                <label for="inputEmail3" class="col-sm-2 col-form-label">Button Text</label>
                <div class="col-sm-10">
                  <textarea class="form-control" v-model="reply.button_body" v-if="reply.reply_type == 'button'" rows="3"/>
                  <textarea class="form-control" v-model="reply.button_body" rows="3" :readonly="true" v-else />
                </div>
              </div>
            </div>
            <div class="col-md-9" v-else>
              <div class="mb-3 row">
                <label for="inputEmail3" class="col-sm-2 col-form-label">Header</label>
                <div class="col-sm-10">
                  <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="header" v-model="reply.url_header_text"/>
                </div>
              </div>
              <div class="mb-3 row">
                <label for="inputEmail3" class="col-sm-2 col-form-label">Body</label>
                <div class="col-sm-10">
                  <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="header" v-model="reply.url_body_text"/>
                </div>
              </div>
              <div class="mb-3 row">
                <label for="inputEmail3" class="col-sm-2 col-form-label">Footer</label>
                <div class="col-sm-10">
                  <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="header" v-model="reply.url_footer_text"/>
                </div>
              </div>
              <div class="mb-3 row">
                <label for="inputEmail3" class="col-sm-2 col-form-label">Button Text</label>
                <div class="col-sm-10">
                  <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="header" v-model="reply.url_button_text"/>
                </div>
              </div>
              <div class="mb-3 row">
                <label for="inputEmail3" class="col-sm-2 col-form-label">Url</label>
                <div class="col-sm-10">
                  <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="header" v-model="reply.url"/>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <label for="formControlRange">{{getReplyType(reply.reply_type)}}</label>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="row">
            <div class="col-md-4">
              <button type="button" @click="viewButtons(reply.buttons)" class="btn btn-default me-2" data-bs-toggle="modal" data-bs-target="#buttons" v-if="reply.reply_type == 'button'">View</button>
            </div>
            <div class="col-md-4">
              <button type="button" @click="editReplyMessage(reply)" class="btn btn-warning me-2">Edit</button>
            </div>
            <div class="col-md-4">
              <button type="button" @click="selectReplyMessage(reply.id)" class="btn btn-danger me-2" data-bs-toggle="modal" data-bs-target="#modalLg">Delete</button>
            </div>
          </div>
        </div>

        <fragment v-for="(child,index) in reply.children">
          <div class="row" style="margin-top:10px;">
            <div class="col-md-3">
              <div class="row">
                <div class="col-md-2">
                  <label for="formControlRange">{{index + 2}}</label>
                </div>
                <div class="col-md-7">
                  <input type="text" class="form-control" id="exampleFormControlInput1" v-model="child.key"/>
                </div>
                <div class="col-md-3">
                  <input type="number" class="form-control" id="exampleFormControlInput1" v-model="child.sequence"/>
                </div>
              </div>
            </div>
            <div class="col-md-5">
              <div class="row">
                <div class="col-md-9" v-if="child.reply_type == 'flow'">
                  <div class="mb-3 row">
                    <label for="inputEmail3" class="col-sm-2 col-form-label"></label>
                    <div class="col-sm-10">
                      <select class="form-select" id="exampleFormControlSelect2" v-model="child.flow_id">
                        <option v-for="item in flows" :key="item.value" :value="item.value">{{item.label}}</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="col-md-9" v-else-if="child.reply_type == 'text_message'">
                  <div class="mb-3 row">
                    <label for="inputEmail3" class="col-sm-2 col-form-label">Message</label>
                    <div class="col-sm-10">
                      <textarea class="form-control" v-model="child.message" v-if="child.reply_type == 'text_message'" rows="3"/>
                      <textarea class="form-control" v-model="child.message" :readonly="true" v-else rows="3"/>
                    </div>
                  </div>
                </div>
                <div class="col-md-9" v-else-if="child.reply_type == 'button'">
                  <div class="mb-3 row">
                    <label for="inputEmail3" class="col-sm-2 col-form-label">Button Text</label>
                    <div class="col-sm-10">
                      <textarea class="form-control" v-model="child.button_body" v-if="child.reply_type == 'button'" rows="3"/>
                      <textarea class="form-control" v-model="child.button_body" rows="3" :readonly="true" v-else />
                    </div>
                  </div>
                </div>
                <div class="col-md-9" v-else>
                  <div class="col-md-12">
                    <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="header" v-model="child.url_header_text"/>
                  </div>
                  <div class="col-md-12" style="margin-top:10px;">
                    <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="body" v-model="child.url_body_text"/>
                  </div>
                  <div class="col-md-12" style="margin-top:10px;">
                    <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="footer" v-model="child.url_footer_text"/>
                  </div>
                  <div class="col-md-12" style="margin-top:10px;">
                    <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="text" v-model="child.url_button_text"/>
                  </div>
                  <div class="col-md-12" style="margin-top:10px;">
                    <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="url" v-model="child.url"/>
                  </div>
                </div>
                <div class="col-md-3">
                  <label for="formControlRange">{{getReplyType(child.reply_type)}}</label>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="row">
                <div class="col-md-4">
                  <button type="button" @click="viewButtons(child.buttons)" class="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#buttons" v-if="child.reply_type == 'button'">View</button>
                </div>
                <div class="col-md-4">
                  <button type="button" @click="editReplyMessage(child)" class="btn btn-warning me-2">Edit</button>
                </div>
                <div class="col-md-4">
                  <button type="button" @click="selectReplyMessage(child.id)" class="btn btn-danger me-2" data-bs-toggle="modal" data-bs-target="#modalLg">delete</button>
                </div>
              </div>
            </div>
          </div>
        </fragment>



        <hr style="margin-top:10px;">
      </div>
    </card-body>
  </card>
</template>

<style scoped>
.form-label {
  font-weight:bold;
}
</style>
