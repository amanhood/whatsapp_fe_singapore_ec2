<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';

const router = useRouter()

let username = ref(null)
let token = ref(null)
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let flows = ref([])
let notification_message = ref(null)
let selected_flow = ref(null)
let flow_name = ref(null)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  whatsapp_accounts.value = data['data']['whatsapp_accounts']
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

async function selectWaBa(waba_id,phone_number_id){
  selected_waba_account.value = waba_id
  selected_phone_number_id.value = phone_number_id
  getFlows()
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

async function deleteFlow(){
  let data = await deleteRequest("delete_flow/?flow_id="+ selected_flow.value +"&waba_id="+ selected_waba_account.value + "&phone_number_id="+selected_phone_number_id.value,token)
  if(data.request.status == 200){
    let message = flow_id + "is deleted"
    showToast(message)
    getFlows()
  } else {
    let message = "Failed to delete Flows"
    showToast(message)
  }
}

function confirmDeleteFlow(flow_id){
  selected_flow.value = flow_id
}

async function createFlow(){
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
}

async function publishFlow(flow_id,flow_name){
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  payload['flow_id'] = flow_id
  let data = await postRequest("publish_flow",payload,token)
  if(data.request.status == 200){
    let message = flow_name + " is created"
    showToast(message)
    getFlows()
  } else {
    let message = "Failed to publish Flows"
    showToast(message)
  }
}

async function deprecateFlow(flow_id,flow_name){
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
}

function editFlow(flow_id,selected_waba_account,selected_phone_number_id){
  router.push({
      path: '/page/update_flow',
      state: {
        flow_id: flow_id,
        selected_waba_account:selected_waba_account,
        selected_phone_number_id:selected_phone_number_id
         // For complex objects, consider stringifying
      }
  });
}

checkLogin()
checkWaba()

</script>


<template>
  <div class="modal fade" id="modalLg">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm to delete Flow ?</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <button type="button" class="btn btn-default" data-bs-dismiss="modal" @click="deleteFlow">Delete</button>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-bs-dismiss="modal">Close</button>
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
                <input type="text" class="form-control" placeholder="Flow Name" v-model="flow_name"/>
              </div>
              <div class="form-group mb-3">
                <button type="button" class="btn btn-default" data-bs-dismiss="modal" @click="createFlow">Create</button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-bs-dismiss="modal">Close</button>
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
      <div class="row" v-if="whatsapp_accounts.length > 0">
        <div class="col-xl-9">
          <div class="form-group mb-3">
            <div class="flex-fill fw-bold fs-16px">Select business whatsapp account for creating flow</div>
          </div>
          <div class="form-group mb-3">
            <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="selectWaBa(account.waba_id,account.phone_number_id)" v-for="account in whatsapp_accounts">{{account.phone_number}}</button>
          </div>
        </div>
      </div>
      <hr>
    </card-body>

    <card-body class="pb-2" v-if="flows.length > 0">
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
                <th class="pt-0 pb-2">publish / delete / deprecate</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="flow in flows">
                <td class="align-middle">{{flow.id}}</td>
								<td class="align-middle">{{flow.name}}</td>
								<td class="align-middle">{{flow.categories}}</td>
								<td class="align-middle">{{flow.status}}</td>
                <td class="align-middle" v-if="flow.status == 'DRAFT'"><button type="button" @click="publishFlow(flow.id,flow.name)" class="btn btn-default me-2">publish</button><button type="button" @click="confirmDeleteFlow(flow.id)" class="btn btn-default me-2" data-bs-toggle="modal" data-bs-target="#modalLg">delete</button></td>
                <td class="align-middle" v-else-if="flow.status == 'PUBLISHED'"><button type="button" @click="deprecateFlow(flow.id,flow.name)" class="btn btn-default me-2">deprecate</button></td>
                <td class="align-middle" else></td>
              </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
      </div>
      <!-- END row -->
    </card-body>
    <card-body class="pb-2" v-if="selected_waba_account">
      <div class="row">
        <div class="form-group mb-3">
          <button type="button" class="btn btn-default me-2" data-bs-toggle="modal" data-bs-target="#modalLg2">Create Flow</button>
        </div>
      </div>
    </card-body>
  </card>
</template>
