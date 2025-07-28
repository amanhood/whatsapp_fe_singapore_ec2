<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch } from 'vue'
import { getRequest,postRequest,deleteRequest, userRequestWithToken } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';

const userSession = useUserSessionStore();
const router = useRouter()


let username = ref(null)
let token = ref(null)
let role = ref(null)


let notification_message = ref(null)
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")
let parent_id = ref(sessionStorage.getItem("id"))

let sub_username = ref(null)
let email = ref(null)
let password = ref(null)
let confirmed_password = ref(null)
let email_error_message = ref(null)
let is_button_shown = ref(true)
let password_error_message = ref(null)
let subaccounts = ref([])

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  whatsapp_accounts.value = data['data']['whatsapp_accounts']
  selected_waba_account.value = whatsapp_accounts.value[0]['waba_id']
  selected_phone_number_id.value = whatsapp_accounts.value[0]['phone_number_id']
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

async function submitForm() {
    let payload = {'email':email.value,'username':sub_username.value,'password':password.value,'role':'child','parent_id':parent_id.value}
    console.log(payload)
    let data = await userRequestWithToken("children/create",payload,token)
    console.log(data)
    if(data.status == 201){
        let message = "SubAccount is created successfully"
		showToast(message)
        getSubAccounts()
    } else {
        let message = "Failed to create SubAccount"
		showToast(message)
    }
    //this.$router.push('/');
}

function validateEmail(email) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        email_error_message = null
        is_button_shown = true
    } else {
        email_error_message = "Invalid email address"
        is_button_shown = false
    }
}
		
function confirmPassword(confirm_password){
    if (confirm_password == password.value){
        console.log("correct password")
        password_error_message = null
        is_button_shown = true
    } else {
        console.log("incorrect password")
        password_error_message = "Confirm password does not match with password"
        is_button_shown = false
    }
}

async function getSubAccounts(){
    let response = await getRequest("users/children-by-parent/"+parent_id.value,token)
    console.log(response)
    if(response['status'] == 200){
        subaccounts.value = response['data']
        console.log(subaccounts.value)
    } else {
        let response_message = response['data']['message']
        showToast(response_message)
    }
}

watch(email, (value) => {
  validateEmail(value);
});

watch(confirmed_password, (value) => {
  confirmPassword(value);
});

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

async function updateStatus(id,status){
    let payload = {}
    payload['is_active'] = status
    let response = await postRequest("users/"+ id + "/update-status",payload,token)
    console.log(response)
    if(response['status'] == 200){
        let response_message = "Status of SubAccount is updated successfully"
        showToast(response_message)
    } else {
        let response_message = "Failed to update status of SubAccount"
        showToast(response_message)
    }
}

checkLogin()
checkWaba()
getSubAccounts()

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
            <h5 class="modal-title">Create Sub Account</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
                <!-- BEGIN register -->
                <div class="register">
                    <!-- BEGIN register-content -->
                    <div class="register-content">
                        <form v-on:submit.prevent="submitForm()" method="POST" name="register_form">
                            <div class="mb-3">
                                <label class="form-label">Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control form-control-lg fs-15px" placeholder="e.g John Smith" v-model="sub_username" required/>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email Address <span class="text-danger">*</span></label>
                                <input type="text" class="form-control form-control-lg fs-15px" placeholder="username@address.com" v-model="email" required/>
                            </div>
                            <p :style="{color: 'red'}">{{ email_error_message }}</p>
                            <div class="mb-3">
                                <label class="form-label">Password <span class="text-danger">*</span></label>
                                <input type="password" class="form-control form-control-lg fs-15px" v-model="password" required/>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Confirm Password <span class="text-danger">*</span></label>
                                <input type="password" class="form-control form-control-lg fs-15px" v-model="confirmed_password" required/>
                            </div>
                            <p :style="{color: 'red'}">{{ password_error_message }}</p>
                            <div class="mb-3">
                                <button type="submit" class="btn btn-teal btn-lg fs-15px fw-500 d-block w-100" v-if="is_button_shown">Create</button>
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


	<card>
		<div class="tab-content p-4" >
			<div class="tab-pane fade show active" id="allTab">
				<div class="row">
                    <div class="col-xl-2">
                        <div class="mb-3">
                            <button type="button" class="btn btn-teal me-2" data-bs-toggle="modal" data-bs-target="#modalLg">Create Sub account</button>
                        </div>
                    </div>
                </div>

				<!-- BEGIN table -->
				<div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
								<th class="border-top-0 pt-0 pb-2">Username</th>
								<th class="border-top-0 pt-0 pb-2">Email</th>
								<th class="border-top-0 pt-0 pb-2">Status</th>
                                <th class="border-top-0 pt-0 pb-2">Role</th>
                                <th class="border-top-0 pt-0 pb-2">Set Status</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="account in subaccounts">         
                                <td class="align-middle">{{ account['username'] }}</td>
                                <td class="align-middle">{{ account['email'] }}</td>
                                <td class="align-middle">{{ checkStatus(account['is_active']) }}</td>
                                <td class="align-middle">{{ account['role'] }}</td>
                                <td class="align-middle"><div class="form-check form-switch"><input type="checkbox" class="form-check-input" id="customSwitch1" @click="updateStatus(account['id'],!account['is_active'])" v-model="account.is_active"></div></td>    
                            </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
			</div>
		</div>
	</card>


</template>
