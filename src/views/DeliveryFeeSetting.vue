<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,onMounted } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';
import moment from 'moment';


const router = useRouter()
let username = ref(null)
let token = ref(null)
let role = ref(null)
let notification_message = ref(null)
let delivery_fee_options = [
  {value:'free_delivery',label:'Free Delivery'},
  {value:'fee_per_order',label:'Per Order'}
]
let weight_options = [
  {value:'kg',label:'kg'},
  {value:'g',label:'g'},
  {value:'lb',label:'lb'},
  {value:'oz',label:'oz'}
]
let currency_options = [
  {value:'HKD',label:'HKD'}
]
let country_options = [
   {value:'HK',label:'Hong Kong'}   
]
let status_options = [
    {value:'active',label:'Active'},
    {value:'inactive',label:'In-Active'}
]
let delivery_fee_type = ref(null)
let free_delivery_limit = ref(null)
let fee_per_order = ref(null)
let currency = ref(null)
let country = ref(null)
let status = ref(null)
let delivery_fees = ref([])
let selected_fee_id = ref(null)
let whatsapp_accounts = ref([])
let is_catalog = ref(false)


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
  whatsapp_accounts.value = data['data']['whatsapp_accounts']
  data['data']['whatsapp_accounts'].forEach(element => {
    let waba_id = element['waba_id']
    let phone_number_id = element['phone_number_id']
    getPermissions(phone_number_id,waba_id)
  });
}

async function getPermissions(phone_number_id,waba_id,){
  let payload = {}
  payload['waba_id'] = waba_id
  payload['phone_number_id'] = phone_number_id
  let response = await postRequest("get_fb_permissions",payload,token)
  if(response.request.status == 200){
    const acc = whatsapp_accounts.value.find(wa => wa.waba_id === waba_id)
    if (acc){
      acc['permissions'] = JSON.parse(response['data']['permissions'])
      acc.is_catalog = hasCatalogManagement(acc)
      console.log(acc)
      if(acc.is_catalog == true){
        is_catalog.value = true
      }
    }
  } else {
    notification_message.value = "Failed to get permissions"
    showToast(notification_message.value)
  }
}

function normalizePermissions(perms) {
  if (!perms) return { data: [] };
  if (typeof perms === "string") {
    try { return JSON.parse(perms); } catch { return { data: [] }; }
  }
  return perms; // already an object
}

function hasCatalogManagement(acc) {
  if (!acc) return false;
  const perms = normalizePermissions(acc.permissions);
  return perms.data.some(
    p => p.permission === "catalog_management" && p.status === "granted"
  );
}


function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

async function createFee(){
    let payload = {}
    if(delivery_fee_type.value == 'free_delivery'){
        fee_per_order.value = null
    } else if(delivery_fee_type.value == 'fee_per_order'){
        free_delivery_limit.value = null
    }
    payload['delivery_fee_type'] = delivery_fee_type.value
    payload['free_delivery_limit'] = free_delivery_limit.value
    payload['fee_per_order'] = fee_per_order.value
    payload['currency'] = currency.value
    payload['country_code'] = country.value.value
    payload['country_name'] = country.value.label
    payload['status'] = status.value
    let data = await postRequest("create_delivery_fee",payload,token)
    if(data.request.status == 200){
        if(data['data']['error']){
            closeModal()
            let notification_message = data['data']['error']
            showToast(notification_message)
            clearForm()
        } else {
            getDeliveryFee()
            closeModal()
            let notification_message = "Delivery fee is created"
            showToast(notification_message)
            clearForm()
        }
    } else {
        closeModal()
        let notification_message = "System error"
        showToast(notification_message)
        clearForm()
    }
}

function clearForm(){
    delivery_fee_type.value = null
    free_delivery_limit.value = null
    fee_per_order.value = null
    currency.value = null
    country.value = null
    status.value = null
}

async function getDeliveryFee(){
    let data = await getRequest("get_delivery_fee",token)
    if(data.request.status == 200){
        delivery_fees.value = data['data']['fees']
    } else {
      let notification_message = "System error"
      showToast(notification_message)
    }
}

function closeModal() {
  const closeButton = document.getElementById("closeModalButton");
  closeButton.click()
}

function convertDateTime(purchase_datetime){
    return moment(purchase_datetime).format('dddd, MMMM DD, YYYY HH:mm:ss');
}

function displayDeliveryFeeType(fee_type){
    if(fee_type == 'free_delivery'){
      return "Free Delivery"
    } else if(fee_type == 'fee_per_order'){
      return "Delivery fee per order"
    } else if(fee_type == 'fee_per_unit'){
      return "Delivery fee per weight unit"
    } 
}

function selectFee(fee){
    console.log(fee)
    selected_fee_id.value = fee.id
    delivery_fee_type.value = fee.fee_type
    free_delivery_limit.value = fee.free_delivery_limit
    fee_per_order.value = fee.fee_per_order
    currency.value = fee.currency
    country.value = {"value":fee.country_code,"label":fee.country_name}
    status.value = fee.status
}

function clearExistingFeeData(){
    selected_fee_id.value = null
    clearForm()
}

async function editFee(){
    let payload= {}
    payload['selected_fee_id'] = selected_fee_id.value
    payload['delivery_fee_type'] = delivery_fee_type.value
    payload['free_delivery_limit'] = free_delivery_limit.value
    payload['fee_per_order'] = fee_per_order.value
    payload['currency'] = currency.value
    payload['country_code'] = country.value.value
    payload['country_name'] = country.value.label
    payload['status'] = status.value
    let data = await postRequest("edit_delivery_fee",payload,token)
    if(data.request.status == 200){
        if(data['data']['error']){
            closeModal()
            let notification_message = data['data']['error']
            showToast(notification_message)
            clearForm()
        } else {
            getDeliveryFee()
            closeModal()
            let notification_message = "Delivery fee is edited"
            showToast(notification_message)
            clearForm()
        }
    } else {
        closeModal()
        let notification_message = "System error"
        showToast(notification_message)
        clearForm()
    }
}


async function deleteFee(fee_id){
    let payload = {}
    payload['fee_id'] = fee_id
    let data = await postRequest("delete_delivery_fee",payload,token)
    if(data.request.status == 200){
        if(data['data']['error']){
            closeModal()
            let notification_message = data['data']['error']
            showToast(notification_message)
        } else {
            getDeliveryFee()
            closeModal()
            let notification_message = "Delivery fee is deleted"
            showToast(notification_message)
        }
    } else {
        closeModal()
        let notification_message = "System error"
        showToast(notification_message)
    }
}

function go_ecommerce(){
  router.push({
      path: '/page/whatsapp-ecommerce'
  });
}

onMounted(()=> {
    checkLogin()
    checkWaba()
    hasCatalogManagement() 
    getDeliveryFee()
})

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
            <h5 class="modal-title">Delivery fee</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
                <div class="row" id='margin_10'>
                    <div class="col-md-6">
                        <label>Type</label>
                        <v-select v-model="delivery_fee_type" :options="delivery_fee_options" label="label" :reduce="loc => loc.value"></v-select>
                    </div>
                    <div class="col-md-6" v-if="delivery_fee_type=='free_delivery'">
                        <label>Free delivery threshold</label>
                        <input type="number" class="form-control" placeholder="" v-model="free_delivery_limit"/>
                    </div>
                </div>
                <div class="row" id='margin_10' v-if="delivery_fee_type=='fee_per_order'">
                    <div class="col-md-3">
                        <label>Minium delivery fee per order</label>
                        <input type="number" class="form-control" placeholder="" v-model="fee_per_order"/>
                    </div>
                </div>

                <div class="row" id='margin_10'>
                    <div class="col-md-3">
                        <label>Currency</label>
                        <v-select v-model="currency" :options="currency_options" label="label" :reduce="loc => loc.value"></v-select>
                    </div>
                    <div class="col-md-3">
                        <label>Country</label>
                        <v-select v-model="country" :options="country_options" label="label"></v-select>
                    </div>
                    <div class="col-md-3">
                        <label>Status</label>
                        <v-select v-model="status" :options="status_options" label="label" :reduce="loc => loc.value" ></v-select>
                    </div>
                </div>         
                
                <div class="row" id="marin_top_10">
                    <div class="col-md-6" v-if="selected_fee_id == null">
                        <button type="button" class="btn btn-teal me-2" @click="createFee">Create</button>
                    </div>
                    <div class="col-md-6" v-else>
                        <button type="button" class="btn btn-teal me-2" @click="editFee">Edit</button>
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
        <card-body class="pb-2" v-if="is_catalog == true">
            <div class="tab-content p-4">
                <div class="tab-pane fade show active" id="allTab">
                    <div class="row">
                        <div class="col-xl-2">
                            <div class="mb-3">
                                <button type="button" class="btn btn-teal mb-1 me-1" data-bs-toggle="modal" data-bs-target="#modalLg1" @click="clearExistingFeeData">Create</button>
                            </div>
                        </div>
                    </div>

                    <!-- BEGIN table -->
                    <div class="table-responsive">
                        <table class="table table-hover text-nowrap">
                            <thead>
                                <tr>
                                    <th class="border-top-0 pt-0 pb-2">Type</th>
                                    <th class="border-top-0 pt-0 pb-2">Free delivery threshold</th>
                                    <th class="border-top-0 pt-0 pb-2">Fee per order</th>
                                    <th class="border-top-0 pt-0 pb-2">Currency</th>
                                    <th class="border-top-0 pt-0 pb-2">Country</th>
                                    <th class="border-top-0 pt-0 pb-2">Created</th>
                                    <th class="border-top-0 pt-0 pb-2">Status</th>
                                    <th class="border-top-0 pt-0 pb-2">Edit</th>
                                    <th class="border-top-0 pt-0 pb-2">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="fee in delivery_fees">         
                                    <td class="align-middle">{{displayDeliveryFeeType(fee.fee_type)}}</td>
                                    <td class="align-middle">{{fee.free_delivery_limit}}</td>
                                    <td class="align-middle">{{fee.fee_per_order}}</td>
                                    <td class="align-middle">{{fee.currency}}</td>
                                    <td class="align-middle">{{fee.country_name}}</td>  
                                    <td class="align-middle">{{convertDateTime(fee.created_at)}}</td>
                                    <td class="align-middle">{{fee.status}}</td>   
                                    <td class="align-middle"><button type="button" class="btn btn-warning me-2" data-bs-toggle="modal" data-bs-target="#modalLg1" @click="selectFee(fee)">Edit</button></td>
                                    <td class="align-middle"><button type="button" class="btn btn-danger me-2" @click="deleteFee(fee.id)">Delete</button></td> 
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <!-- END table -->
                </div>
            </div>
        </card-body>
		
        <card-body class="pb-2" v-else>
            <div class="alert alert-warning">
                <strong>Ohh, Not yet authorize the whatsapp ecommerce permission to us</strong> <br><br>
                <a href="#" class="btn btn-yellow" @click="go_ecommerce">Go ecommerce</a>
            </div>
        </card-body>
	</card>
    


</template>
