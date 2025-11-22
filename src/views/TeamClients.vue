<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch } from 'vue'
import { getRequest,postRequest,deleteRequest, userRequestWithToken } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';


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
let selected_team = ref(null)
let contacts_list = ref([])
let search_number = ref(null)
let all_contacts = ref([])
let spin_loading = ref(false)

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
            data['data']['teams'].forEach((item,i) => {
                teams.value.push({'id':item.id,'value':item.name})
            })
		}
    }
}

function selectTeam(){
    console.log(selected_team.value)
    contacts_list.value = []
    getContactList()
}

async function getContactList(){
  spin_loading.value = true
  let payload = {
    waba_id: selected_waba_account.value,
    phone_number_id: selected_phone_number_id.value
  }
  let response = await postRequest("get_all_contact_lists",payload,token)
  if(response.request.status == 200){
    if (response?.data?.length) {
      contacts_list.value.push(...response.data)
      getTeamClients()
    } 
  } else {
    notification_message.value = "Failed to get contact list"
    showToast(notification_message.value)
  }
  spin_loading.value = false
}

async function getTeamClients(){
    let payload = {}
    payload['team_id'] = selected_team.value.id
    payload['phone_number'] = selected_phone_number.value
    let response = await postRequest("get_team_clients",payload,token)
    if(response.request.status == 200){
        let team_customers = response['data']['customers']
        // create a Set of phone numbers for fast lookup
        const teamCustomerPhoneNumbers = new Set(
            team_customers.map(s => String(s.customer_phone_number))
        )
        // map existing contacts_list and add "assigned" boolean
        contacts_list.value = contacts_list.value.map(customer => {
            return {
                ...customer,
                assigned: teamCustomerPhoneNumbers.has(String(customer.contact_number))
            }
        })
        all_contacts.value = contacts_list.value
    } else {
        notification_message.value = "Failed to get customer list of this team"
        showToast(notification_message.value)
    }
}

async function assignCustomerToTeam(contact){
    let payload = {}
    payload['assigned'] = contact.assigned
    payload['client_number'] = contact.contact_number
    payload['client_name'] = contact.display_name
    payload['team'] = selected_team.value.id
    payload['whatsapp_phone_number'] = selected_phone_number.value
    let data = await postRequest("assign_client_to_team",payload,token)
    if(data.request.status == 200){
    } else {
        let message = "Failed to assigning customer to team"
        showToast(message)
        contact.assigned = !contact.assigned
    }
}

watch(search_number, (newVal) => {
  const keyword = newVal.trim()

  if (!keyword) {
    // empty search → show all
    contacts_list.value = all_contacts.value
    return
  }

  // partial match by contact_number
  contacts_list.value = all_contacts.value.filter(contact =>
    String(contact.contact_number).includes(keyword)
  )
})

function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if(role.value != 'parent'){
        router.push('/page/login');
    } 
  }
}

function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
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
    <loading v-model:active="spin_loading" :is-full-page="true"/>
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
        <card-body class="pb-2" style="border-bottom:1px solid #ccc;">
            <div class="row">
                <div class="col-md-6">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="row">
                                <div class="flex-fill fw-bold fs-16px">Whatsapp number</div>
                            </div>
                            <div class="row" id="marin_top_10">
                                <div class="col-md-12">
                                <v-select v-model="select_account" :options="whatsapp_accounts" label="value" @update:modelValue="selectAccount"></v-select>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4" v-if="selected_phone_number_id">
                            <div class="row">
                                <div class="flex-fill fw-bold fs-16px">Team</div>
                            </div>
                            <div class="row" id="marin_top_10">
                                <div class="col-md-12">
                                <v-select v-model="selected_team" :options="teams" label="value" @update:modelValue="selectTeam"></v-select>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4" v-if="selected_phone_number_id">
                            <div class="row">
                                <div class="flex-fill fw-bold fs-16px">Search</div>
                            </div>
                            <div class="row" id="marin_top_10">
                                <div class="col-md-12">
                                    <input type="text" class="form-control" placeholder="phone number" v-model="search_number"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </card-body>
		<div class="tab-content p-4" v-if="selected_waba_account">
			<div class="tab-pane fade show active" id="allTab">
				
				<!-- BEGIN table -->
				<div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
								<th class="border-top-0 pt-0 pb-2">Phone number</th>
								<th class="border-top-0 pt-0 pb-2">Customer name</th>
                                <th class="border-top-0 pt-0 pb-2">Assign</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="contact in contacts_list">         
                                <td class="align-middle">{{ contact.contact_number}}</td>
                                <td class="align-middle">{{ contact.display_name}}</td>
                                <td class="align-middle">
                                    <div class="form-check form-switch">
                                        <input
                                            type="checkbox"
                                            class="form-check-input"
                                            :id="'switch-' + contact.id"
                                            v-model="contact.assigned"
                                            @change="assignCustomerToTeam(contact)"
                                        >
                                    </div>
                                </td>
                            </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
			</div>
		</div>
	</card>


</template>
