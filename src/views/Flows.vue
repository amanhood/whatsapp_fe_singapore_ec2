<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,onMounted } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';

const router = useRouter()

let username = ref(null)
let token = ref(null)
let role = ref(null)
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let flows = ref([])
let notification_message = ref(null)
let selected_flow = ref(null)
let flow_name = ref(null)
let select_account = ref(null)
let spin_loading = ref(false)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")

function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if (role.value != 'parent'){
        router.push('/page/login');
    } 
  }
}

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  data['data']['whatsapp_accounts'].forEach((item, i) => {
    whatsapp_accounts.value.push({'id':item.phone_number_id,'value':item.phone_number,'waba':item.waba_id})
  });
}

async function selectAccount(){
  selected_waba_account.value = select_account.value.waba
  selected_phone_number_id.value = select_account.value.id
  getFlows()
}

async function getFlows(){
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  let data = await postRequest("get_flows",payload,token)
  if(data.request.status == 200){
    flows.value = data['data']['data']
    console.log(flows.value)
  } else {
    let message = "Failed to get Flows"
    showToast(message)
  }
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

async function deleteFlow(){
  spin_loading.value = true
  console.log(selected_flow.value)
  let data = await deleteRequest("delete_flow/?flow_id="+ selected_flow.value.id +"&waba_id="+ selected_waba_account.value + "&phone_number_id="+selected_phone_number_id.value,token)
  if(data.request.status == 200){
    let message = "Flow is deleted"
    showToast(message)
    getFlows()
  } else {
    let message = "Failed to delete Flows"
    showToast(message)
  }
  spin_loading.value = false
}

function confirmDeleteFlow(flow){
  selected_flow.value = flow
}

async function createFlow(){
  spin_loading.value = true
  let payload = {}
  payload['name'] = flow_name.value
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  let data = await postRequest("create_flow",payload,token)
  if(data.request.status == 200){
    let message = flow_name.value + " is created"
    showToast(message)
    getFlows()
  } else {
    let message = "Failed to create Flows"
    showToast(message)
  }
  spin_loading.value = false
}

async function publishFlow(flow_id,flow_name){
  spin_loading.value = true
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  payload['flow_id'] = flow_id
  let data = await postRequest("publish_flow",payload,token)
  if(data.request.status == 200){
    let message = flow_name + " is published"
    showToast(message)
    getFlows()
  } else {
    let message = "Failed to publish Flows"
    showToast(message)
  }
  spin_loading.value = false
}


function confirmDeprecateFlow(flow){
  selected_flow.value = flow
  console.log(selected_flow.value)
}

async function deprecateFlow(flow_id,flow_name){
  spin_loading.value = true
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  payload['flow_id'] = flow_id
  let data = await postRequest("deprecate_flow",payload,token)
  if(data.request.status == 200){
    let message = flow_name + " is deprecated"
    showToast(message)
    getFlows()
  } else {
    let message = "Failed to deprecate Flows"
    showToast(message)
  }
  spin_loading.value = false
}

function editFlow(flow){
  let flow_id = flow.id
  router.push({
      path: '/page/update-flow/' + flow_id
  });
}

function onInput(e) {
  if (e.isComposing) return
  flow_name.value = e.target.value.replace(/\d/g, '')
}

checkLogin()
checkWaba()

</script>


<template>
  <loading v-model:active="spin_loading"
  :is-full-page="true"/>
  <div class="modal fade" id="modalLg">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm to delete Flow ?</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="deleteFlow">Delete</button>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalLg1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm to deprecate Flow ?</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <button type="button" class="btn btn-danger" data-bs-dismiss="modal" @click="deprecateFlow(selected_flow.id,selected_flow.name)">Deperecate</button>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalLg2">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Create Flow</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <div class="row">
            <div class="col-xl-6">
              <div class="form-group mb-3">
                <input type="text" class="form-control" placeholder="Flow Name" v-model="flow_name" @input="onInput"/>
              </div>
              <div class="form-group mb-3">
                <button type="button" class="btn btn-teal" data-bs-dismiss="modal" @click="createFlow">Create</button>
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
        <div class="col-md-12">
          <div class="row" style="margin-bottom:10px;">
            <div class="flex-fill fw-bold fs-16px">Select phone number</div>
          </div>
          <div class="row">
            <div class="col-md-3">
              <v-select v-model="select_account" :options="whatsapp_accounts" label="value" @update:modelValue="selectAccount"></v-select>
            </div>
          </div>
        </div>
      </div>
    </card-body>

    <card-body class="pb-2" v-if="selected_waba_account">
      <div class="row">
        <div class="form-group mb-3">
          <button type="button" class="btn btn-teal me-2" data-bs-toggle="modal" data-bs-target="#modalLg2">Create Flow</button>
        </div>
      </div>
    </card-body>

    <card-body class="pb-2" v-if="selected_waba_account && flows.length > 0">
      <div class="row">
        <!-- BEGIN table -->
				<div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
                <th class="pt-0 pb-2">id</th>
								<th class="pt-0 pb-2">name</th>
								<th class="pt-0 pb-2">category</th>
								<th class="pt-0 pb-2">status</th>
                <th class="pt-0 pb-2">edit / publish / delete / deprecate</th>
              </tr>
						</thead>
						<tbody>
							<tr v-for="flow in flows">
                <td class="align-middle">{{flow.id}}</td>
								<td class="align-middle">{{flow.name}}</td>
								<td class="align-middle">{{flow.categories}}</td>
								<td class="align-middle">{{flow.status}}</td>
                <td class="align-middle" v-if="flow.status == 'DRAFT'"><button type="button" @click="editFlow(flow)" class="btn btn-yellow me-2">edit</button><button type="button" @click="publishFlow(flow.id,flow.name)" class="btn btn-primary me-2">publish</button><button type="button" @click="confirmDeleteFlow(flow)" class="btn btn-danger me-2" data-bs-toggle="modal" data-bs-target="#modalLg">delete</button></td>
                <td class="align-middle" v-else-if="flow.status == 'PUBLISHED'"><button type="button" @click="confirmDeprecateFlow(flow)" class="btn btn-danger me-2" data-bs-toggle="modal" data-bs-target="#modalLg1">deprecate</button></td>
                <td class="align-middle" v-else-if="flow.status == 'DEPRECATED'"></td>
              </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
      </div>
      <!-- END row -->
    </card-body>
    
  </card>
</template>
