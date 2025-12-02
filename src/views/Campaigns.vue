<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch } from 'vue'
import { getRequest,postRequest,deleteRequest, userRequestWithToken } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';
import datepicker from '@/assets/components/plugins/Datepicker.vue';
import moment from 'moment';


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
let campaigns = ref([])
let campaign = ref({})
let statues = [
        { id:true,title: "Active" },
        { id:false,title: "In-active" },
    ]
let selected_campaign = ref(null)


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
  getCampaigns()
}

async function getCampaigns(){
    let payload = {}
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
	let data = await postRequest("get_campaigns",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = "Failed to get campaigns"
			showToast(message)
		} else {
            campaigns.value = data['data']['campaigns']
		}
    } else {
        let message = "Failed to get campaigns"
		showToast(message)
    }
}

async function manageCampaign(){
    if(!campaign.value.name){
        let message = "Please input name"
        showToast(message)
        return
    }

    if(!campaign.value.content){
        let message = "Please input content"
        showToast(message)
        return
    }

    if(!campaign.value.start_date){
        let message = "Please input start date"
        showToast(message)
        return
    }

    if(!campaign.value.end_date){
        let message = "Please input end date"
        showToast(message)
        return
    }

    if (campaign.value.is_active === null || campaign.value.is_active === undefined) {
        showToast("Please input status");
        return;
    }

    if(campaign.value.start_date > campaign.value.end_date){
        console.log(campaign.value.start_date)
        console.log(campaign.value.end_date)
        let message = "Start date can not be later than end date"
        showToast(message)
        return
    }

    if(selected_campaign.value){
        let payload = {}
        payload['waba_id'] = selected_waba_account.value
        payload['phone_number_id'] = selected_phone_number_id.value
        payload['campaign'] = selected_campaign.value
        let data = await postRequest("edit_campaign",payload,token)
        if(data.request.status == 200){
            if(data['data']['error']){
                let message = data['data']['error']['message']
                showToast(message)
            } else {
                getCampaigns()
            }
        } else {
            let message = "Failed to update campaign"
            showToast(message)
        }
    } else {
        let payload = {}
        payload['waba_id'] = selected_waba_account.value
        payload['phone_number_id'] = selected_phone_number_id.value
        payload['campaign'] = campaign.value
        let data = await postRequest("create_campaign",payload,token)
        if(data.request.status == 200){
            if(data['data']['error']){
                let message = data['data']['error']['message']
                showToast(message)
            } else {
                getCampaigns()
            }
        } else {
            let message = "Failed to create campaign"
            showToast(message)
        }
    }
}

function createCampaign(){
    campaign.value = {}
    selected_campaign.value = null
}


function editCampaign(s_campaign){
    campaign.value = s_campaign
    selected_campaign.value = s_campaign
}

async function deleteCampaign(campaign){
    let payload = {}
    payload['campaign_id'] = campaign.id
    let data = await postRequest("delete_campaign",payload,token)
    if(data.request.status == 200){
		let message = data['data']['message']
        showToast(message)
        getCampaigns()
    } else {
        let message = "Failed to delete campaign"
        showToast(message)
    }
}

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

function checkStatus(status){
    if(status == true){
        return "Active"
    } else {
        return "In-active"
    }
}

function deliveryDateTime(delivery_time){
  return moment(delivery_time).format('dddd, MMMM DD, YYYY HH:mm:ss');
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
                <h5 class="modal-title" v-if="selected_campaign">Edit campaign</h5>
                <h5 class="modal-title" v-else>Create campaign</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">
                    
                    <div class="row">
                        <div class="col-xl-6">
                            <div class="form-group mb-3">
                                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Name</label>
                                <input type="text" class="form-control" placeholder="" v-model="campaign.name"/>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Content</label>
                                <textarea
                                    v-model="campaign.content"
                                    class="form-control"
                                ></textarea>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Start date</label>
                                 <datepicker v-model="campaign.start_date"/>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">End Date</label>
                                 <datepicker v-model="campaign.end_date"/>
                            </div>

                            <div class="form-group mb-3">
                                <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Status</label>
                                <v-select v-model="campaign.is_active" :options="statues" label="title" :reduce="option => option.id"></v-select>
                            </div>
                            
                            <div class="form-group mb-3" v-if="selected_campaign">
                                <button type="button" class="btn btn-yellow me-2" @click="manageCampaign">Edit</button>
                            </div>

                            <div class="form-group mb-3" v-else>
                                <button type="button" class="btn btn-teal me-2" @click="manageCampaign">Create</button>
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
                            <button type="button" class="btn btn-teal me-2" data-bs-toggle="modal" data-bs-target="#modalLg" @click="createCampaign()">Create campaign</button>
                        </div>
                    </div>
                </div>

				<!-- BEGIN table -->
				<div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
								<th class="border-top-0 pt-0 pb-2">Name</th>
                                <th class="border-top-0 pt-0 pb-2">Start date</th>
								<th class="border-top-0 pt-0 pb-2">End Date</th>
                                <th class="border-top-0 pt-0 pb-2">Status</th>
                                <th class="border-top-0 pt-0 pb-2">Edit</th>
                                <th class="border-top-0 pt-0 pb-2">Delete</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="campaign in campaigns">         
                                <td class="align-middle">{{ campaign['name'] }}</td>
                                <td class="align-middle">{{ deliveryDateTime(campaign['start_date']) }}</td>
                                <td class="align-middle">{{ deliveryDateTime(campaign['end_date']) }}</td>
                                <td class="align-middle">{{ checkStatus(campaign['is_active']) }}</td>
                                <td class="align-middle"><button type="button" data-bs-toggle="modal" data-bs-target="#modalLg" @click="editCampaign(campaign)" class="btn btn-yellow me-2">Edit</button></td>
                                <td class="align-middle"><button type="button" @click="deleteCampaign(campaign)" class="btn btn-danger me-2">Delete</button></td>
                            </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
			</div>
		</div>
	</card>


</template>
