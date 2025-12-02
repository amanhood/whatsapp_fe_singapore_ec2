<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch } from 'vue'
import { getRequest,postRequest,deleteRequest, userRequestWithToken } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';


const userSession = useUserSessionStore();
const router = useRouter()


let username = ref(null)
let token = ref(null)
let role = ref(null)


let notification_message = ref(null)
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let selected_phone_number = ref(null)
let select_account = ref(null)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")
let parent_id = ref(sessionStorage.getItem("id"))
let teams = ref([])
let team_name = ref(null)
let selected_team_id = ref(null)
let assigned_team_id = ref(null)
let assigned_team_name = ref(null)
let staff_list = ref([])
let assigned_customer_team_id = ref(null)
let assigned_customer_team_name = ref(null)

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
  getTeams()
}

async function getTeams(){
    let payload = {}
	payload['phone_number'] = selected_phone_number.value
	let data = await postRequest("get_teams",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
            teams.value = data['data']['teams']
		}
    }
}

async function submitForm(){
    if(selected_team_id.value){
        let payload = {}
        payload['team_id'] = selected_team_id.value
        payload['team_name'] = team_name.value
        let data = await postRequest("update_team",payload,token)
        if(data.request.status == 200){
            if(data['data']['error']){
                let message = data['data']['error']['message']
                showToast(message)
            } else {
                getTeams()
            }
        } else {
            let message = "Failed to update team"
            showToast(message)
        }
    } else {
        let payload = {}
        payload['phone_number'] = selected_phone_number.value
        payload['team_name'] = team_name.value
        let data = await postRequest("create_team",payload,token)
        if(data.request.status == 200){
            if(data['data']['error']){
                let message = data['data']['error']['message']
                showToast(message)
            } else {
                getTeams()
            }
        } else {
            let message = "Failed to create team"
            showToast(message)
        }
    }
}

async function updateStatus(team_id,status){
    let payload = {}
    payload['team_id'] = team_id
    payload['status'] = status
    let data = await postRequest("update_team_status",payload,token)
    if(data.request.status == 200){
		let message = data['data']['message']
        showToast(message)
        getTeams()
    } else {
        let message = "Failed to change status"
        showToast(message)
    }
}

function createTeam(){
    team_name.value = null
    selected_team_id.value = null
}

function editTeam(team){
    team_name.value = team.name
    selected_team_id.value = team.id
}

async function deleteTeam(team){
    let payload = {}
    payload['team_id'] = team.id
    let data = await postRequest("delete_team",payload,token)
    if(data.request.status == 200){
		let message = data['data']['message']
        showToast(message)
        getTeams()
    } else {
        let message = "Failed to delete team"
        showToast(message)
    }
}

function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if(role.value != 'parent'){
        router.push('/page/login');
    } else {
        getSubAccounts()
    }
  }
}

function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
}

function checkStatus(status){
    if(status == true){
        return "Active"
    } else {
        return "In-active"
    }
}

function assignTeam(team){
    assigned_team_id.value = team.id
    assigned_team_name.value = team.name
    loadStaff(assigned_team_id.value)
}


async function loadStaff(team_id) {
    console.log(team_id)
    let payload = {}
    payload['team'] = team_id
    let data = await postRequest("get_team_staff",payload,token)
    if(data.request.status == 200){
		let team_staff_list = data['data']['staff']
        const teamStaffIds = new Set(team_staff_list.map(s => s.user_id))
        staff_list.value = staff_list.value.map(staff => {
            return {
                ...staff,
                assigned: teamStaffIds.has(staff.id)   // true if belongs to team
            }
        })
    } else {
        let message = "Failed to load team staff"
        showToast(message)
    }
    
}

async function getSubAccounts(){
    let response = await getRequest("users/children-by-parent/"+parent_id.value,token)
    if(response['status'] == 200){
        staff_list.value = response['data']
    } else {
        let response_message = response['data']['message']
        showToast(response_message)
    }
}

async function assignStaffToTeam(staff){
    let payload = {}
    payload['assigned'] = staff.assigned
    payload['user_id'] = staff.id
    payload['team'] = assigned_team_id.value
    let data = await postRequest("assign_staff_team",payload,token)
    if(data.request.status == 200){
		loadStaff(assigned_team_id.value)
    } else {
        let message = "Failed to assigning team"
        showToast(message)
        staff.assigned = !staff.assigned
    }
}


checkLogin()
checkWaba()


</script>

<style>

.toasts-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999; /* make this higher than modals/popups */
}

</style>

<template>
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
    <div class="modal fade" id="modalLg">
        <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
            <h5 class="modal-title">Create Team</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
                <!-- BEGIN register -->
                <div class="register">
                    <!-- BEGIN register-content -->
                    <div class="register-content">
                        <form v-on:submit.prevent="submitForm()" method="POST">
                            <div class="mb-3">
                                <label class="form-label">Team name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control form-control-lg fs-15px" placeholder="e.g: Marketing" v-model="team_name" required/>
                            </div>
                            <div class="mb-3" v-if="!selected_team_id">
                                <button type="submit" class="btn btn-teal btn-lg fs-15px fw-500 d-block w-100">Create</button>
                            </div>
                            <div class="mb-3" v-else>
                                <button type="submit" class="btn btn-yellow btn-lg fs-15px fw-500 d-block w-100">Edit</button>
                            </div>
                            
                        </form>
                    </div>
                    <!-- END register-content -->
                </div>
            </div>
            
            <div class="modal-footer">
            <button type="button" class="btn btn-yellow" data-bs-dismiss="modal" id="deleteCatalogModal">Close</button>
            </div>
        </div>
        </div>
    </div>

    <div class="modal fade" id="modalLg1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title">Assign staff to {{ assigned_team_name }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">
                    <div class="row">
                        <div class="col-xl-12">
                            <div class="form-group mb-3">
                                <div class="row">
                                    <div class="table-responsive">
                                        <table class="table table-hover text-nowrap">
                                            <thead>
                                                <tr>
                                                    <th class="border-top-0 pt-0 pb-2">Username</th>
                                                    <th class="border-top-0 pt-0 pb-2">Email</th>
                                                    <th class="border-top-0 pt-0 pb-2">Staff status</th>
                                                    <th class="border-top-0 pt-0 pb-2">Assign to team</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="staff in staff_list">         
                                                    <td class="align-middle">{{ staff['username'] }}</td>
                                                    <td class="align-middle">{{ staff['email'] }}</td>
                                                    <td class="align-middle">{{ checkStatus(staff['is_active']) }}</td>
                                                    <td class="align-middle">
                                                        <div class="form-check form-switch">
                                                        <input
                                                            type="checkbox"
                                                            class="form-check-input"
                                                            :id="'switch-' + staff.id"
                                                            v-model="staff.assigned"
                                                            @change="assignStaffToTeam(staff)"
                                                        >
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row" style="margin-top:20px;">
                        <div class="col-xl-6">
                            <div class="form-group mb-3">
                                <button type="button" class="btn btn-teal" @click="createMessageWithButtons">Assign</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                <button type="button" class="btn btn-yellow" data-bs-dismiss="modal" id="deleteCatalogModal">Close</button>
                </div>
            </div>
        </div>
    </div>

	<card>
        <card-body class="pb-2" style="border-bottom:1px solid #ccc;">
        <div class="row">
            <div class="col-md-6">
                <div class="row">
                    <div class="flex-fill fw-bold fs-16px">Select phone number</div>
                </div>
                <div class="row" id="marin_top_10">
                    <div class="col-md-6">
                    <v-select v-model="select_account" :options="whatsapp_accounts" label="value" @update:modelValue="selectAccount"></v-select>
                    </div>
                </div>
            </div>
        </div>
        </card-body>
		<div class="tab-content p-4" v-if="selected_waba_account">
			<div class="tab-pane fade show active" id="allTab">
				<div class="row">
                    <div class="col-xl-2">
                        <div class="mb-3">
                            <button type="button" class="btn btn-teal me-2" data-bs-toggle="modal" data-bs-target="#modalLg" @click="createTeam()">Create Team</button>
                        </div>
                    </div>
                </div>

				<!-- BEGIN table -->
				<div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
								<th class="border-top-0 pt-0 pb-2">Team name</th>
                                <th class="border-top-0 pt-0 pb-2">Phone number</th>
								<th class="border-top-0 pt-0 pb-2">Set Status</th>
                                <th class="border-top-0 pt-0 pb-2">Staff</th>
                                <th class="border-top-0 pt-0 pb-2">Edit</th>
                                <th class="border-top-0 pt-0 pb-2">Delete</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="team in teams">         
                                <td class="align-middle">{{ team['name'] }}</td>
                                <td class="align-middle">{{ team['phone_number'] }}</td>
                                <td class="align-middle"><div class="form-check form-switch"><input type="checkbox" class="form-check-input" id="customSwitch1" @click="updateStatus(team['id'],!team['is_active'])" v-model="team.is_active"></div></td>    
                                <td class="align-middle"><button type="button" data-bs-toggle="modal" data-bs-target="#modalLg1" @click="assignTeam(team)" class="btn btn-primary me-2">Assign</button></td>
                                <td class="align-middle"><button type="button" data-bs-toggle="modal" data-bs-target="#modalLg" @click="editTeam(team)" class="btn btn-yellow me-2">Edit</button></td>
                                <td class="align-middle"><button type="button" @click="deleteTeam(team)" class="btn btn-danger me-2">Delete</button></td>
                            </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
			</div>
		</div>
	</card>


</template>
