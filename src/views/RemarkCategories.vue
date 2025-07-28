<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,putRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';
import moment from 'moment';


const router = useRouter()
let username = ref(null)
let token = ref(null)
let role = ref(null)
let notification_message = ref(null)


token = sessionStorage.getItem("token")
username.value = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let selected_phone_number = ref(null)
let select_account = ref(null)
let categories = ref([])
let selected_category_id = ref(null)
let name = ref(null)

function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if (role.value != 'parent'){
        router.push('/page/login');
    } 
  }
}

checkLogin()

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
  getRemarkCategories()
}

async function getRemarkCategories(){
    let payload = {}
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
    let response = await postRequest("get_remark_categories",payload,token)
    if(response.status == 200){
        categories.value = response['data']['categories']
    } else {
      let notification_message = "System error"
      showToast(notification_message)
    }
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

function clearExistingData(){
    name.value = null
    selected_category_id.value = null
}

function selectCategory(category){
    selected_category_id.value = category.id
    name.value = category.name
}

async function createCategory(){
    let payload = {}
    payload['name'] = name.value
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
    let response = await postRequest("create_remark_category_name",payload,token)
    if(response.status == 200){
        getRemarkCategories()
        closeModal()
    } else {
        closeModal()
        let notification_message = "Failed to create category"
        showToast(notification_message)
        clearExistingData()
    }
}

async function editCategory(){
    let payload = {}
    payload['id'] = selected_category_id.value
    payload['name'] = name.value
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
    let response = await putRequest("edit_remark_category_name",payload,token)
    if(response.status == 200){
        getRemarkCategories()
        closeModal()
    } else {
        closeModal()
        let notification_message = "Failed to edit category"
        showToast(notification_message)
        clearExistingData()
    }
}

async function deleteCategory(category_id){
    let payload = {}
    payload['id'] = category_id
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
    let response = await postRequest("delete_remark_category_name",payload,token)
    if(response.status == 200){
        getRemarkCategories()
        closeModal()
    } else {
        closeModal()
        let notification_message = "Failed to edit category"
        showToast(notification_message)
        clearExistingData()
    }
}

function closeModal() {
  const closeButton = document.getElementById("closeModalButton");
  closeButton.click()
}


checkWaba()

</script>

<style>
#margin_10 {
  margin-top:10px;
  margin-bottom:10px;
}
</style>


<template>
    <div class="modal fade" id="modalLg1">
        <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
            <h5 class="modal-title">Category name</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
                <div class="row" id='margin_10'>
                    <div class="col-md-3">
                        <label>Name</label>
                        <input type="text" class="form-control" placeholder="" v-model="name"/>
                    </div>
                </div>

                <div class="row" id="marin_top_10">
                    <div class="col-md-6" v-if="!selected_category_id">
                        <button type="button" class="btn btn-teal me-2" @click="createCategory">Create</button>
                    </div>
                    <div class="col-md-6" v-else>
                        <button type="button" class="btn btn-teal me-2" @click="editCategory">Edit</button>
                    </div>
                </div>

            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-yellow" data-bs-dismiss="modal" id="closeModalButton">Close</button>
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
                    <div class="col-md-6">
                    <v-select v-model="select_account" :options="whatsapp_accounts" label="value" @update:modelValue="selectAccount"></v-select>
                    </div>
                </div>
                </div>
            </div>
            </card-body>
        <hr>
		<div class="tab-content p-4" v-if="select_account">
			<div class="tab-pane fade show active" id="allTab">
				<div class="row">
                    <div class="col-xl-2">
                        <div class="mb-3">
                            <button type="button" class="btn btn-teal mb-1 me-1" data-bs-toggle="modal" data-bs-target="#modalLg1" @click="clearExistingData">Create</button>
                        </div>
                    </div>
                </div>

				<!-- BEGIN table -->
				<div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
								<th class="border-top-0 pt-0 pb-2">Name</th>
                                <th class="border-top-0 pt-0 pb-2">Edit</th>
                                <th class="border-top-0 pt-0 pb-2">Delete</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="category in categories">         
                                <td class="align-middle">{{category.name}}</td>   
                                <td class="align-middle"><button type="button" class="btn btn-warning me-2" data-bs-toggle="modal" data-bs-target="#modalLg1" @click="selectCategory(category)">Edit</button></td>
                                <td class="align-middle"><button type="button" class="btn btn-danger me-2" @click="deleteCategory(category.id)">Delete</button></td> 
                            </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
			</div>
		</div>
	</card>


</template>
