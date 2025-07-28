<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import CartItems from './CartItems.vue'
import moment from 'moment';

const userSession = useUserSessionStore();
const router = useRouter()

let username = ref(null)
let token = ref(null)
let role = ref(null)
let carts = ref([])
let cart_items = ref([])
let notification_message = ref(null)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")
let selected_status = ref(null)
let status = [
        { id:false,title: "Pending" },
        { id:true,title: "Paid" }
      ]
let search_term = ref(null)


function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if (role.value != 'parent'){
        router.push('/page/login');
    } 
  }
}

async function getOrder(){
	let data = await postRequest("get_orders",null,token)
	carts.value = data['data']['carts']
  return carts.value
}

async function displayCart(cart_id){
	let payload = {}
	payload['cart_id'] = cart_id
	let data = await postRequest("get_cart_items",payload,token)
	cart_items.value = data['data']['cart_items']
}

async function sendPaymentRequest(cart_id){
  let payload = {}
  payload['cart_id'] = cart_id
  let data = await postRequest("send_payment_request",payload,token)
  if(data['status'] == 200){
    notification_message.value = "Message is sent to client successfully"
  } else {
    notification_message.value = "Message is failed sent to client"
  }
  showToast(notification_message.value)
}

async function sendAddressRequest(cart_id){
  let payload = {}
  payload['cart_id'] = cart_id
  let data = await postRequest("send_address_request",payload,token)
  if(data['status'] == 200){
    notification_message.value = "Message is sent to client successfully"
  } else {
    notification_message.value = "Message is failed sent to client"
  }
  showToast(notification_message.value)
}

function convertDateTime(purchase_datetime){
  return moment(purchase_datetime).subtract(8, 'h').format('dddd, MMMM DD, YYYY HH:mm:ss');
}

async function updateOrderStatus(cart_id,is_paid){
  let payload = {}
	payload['cart_id'] = cart_id
  payload['is_paid'] = !is_paid
  let data = await postRequest("update_order_status",payload,token)
  getOrder()
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

async function searchOrder(){
  let original_carts = await getOrder()
  const filteredCarts = search_term.value && selected_status.value
  ? original_carts.filter(cart => cart.customer_id == search_term.value && cart.is_paid == selected_status.value.id)
  : search_term.value
    ? original_carts.filter(cart => cart.customer_id == search_term.value)
    : selected_status.value
      ? original_carts.filter(cart => cart.is_paid == selected_status.value.id)
      : original_carts;
  carts.value = filteredCarts
}


checkLogin()
getOrder()


</script>


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
          <h5 class="modal-title"></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
					<cart-items :cart_items="cart_items" :total_amount="total_amount"></cart-items>
				</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>

	<card>
		<ul class="nav nav-tabs nav-tabs-v2 px-4">
			<li class="nav-item me-3"><a href="#allTab" class="nav-link active px-2" data-bs-toggle="tab">All</a></li>
		</ul>
		<div class="tab-content p-4">
			<div class="tab-pane fade show active" id="allTab">
				<!-- BEGIN input-group -->
				<div class="input-group mb-4">
          <div class="ms-md-2">
            <input type="text" class="form-control ps-35px" placeholder="Find by Phone" v-model="search_term"/>
          </div>
          <div class="ms-md-4 mt-md-0 mt-2">
            <v-select v-model="selected_status" :options="status" label="title"></v-select>
          </div>
          <div class="ms-md-4 mt-md-0 mt-2">
      		    <button type="button" class="btn btn-default mb-1 me-1" @click="searchOrder">Search</button>
          </div>


				</div>
				<!-- END input-group -->

				<!-- BEGIN table -->
				<div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
								<th class="border-top-0 pt-0 pb-2">Order</th>
                <th class="border-top-0 pt-0 pb-2">Invoice</th>
								<th class="border-top-0 pt-0 pb-2">Date</th>
								<th class="border-top-0 pt-0 pb-2">Phone(Customer)</th>
								<th class="border-top-0 pt-0 pb-2">Phone Number</th>
                <th class="border-top-0 pt-0 pb-2">Recipient</th>
                <th class="border-top-0 pt-0 pb-2">Order Email</th>
                <th class="border-top-0 pt-0 pb-2">Address</th>
								<th class="border-top-0 pt-0 pb-2">Items</th>
                <th class="border-top-0 pt-0 pb-2">Cart Fee</th>
                <th class="border-top-0 pt-0 pb-2">Delivery Fee</th>
								<th class="border-top-0 pt-0 pb-2">Total Fee</th>
								<th class="border-top-0 pt-0 pb-2">Payment Status</th>
								<th class="border-top-0 pt-0 pb-2">Payment Request</th>
                <th class="border-top-0 pt-0 pb-2">Address Request</th>
                <th class="border-top-0 pt-0 pb-2">Complete</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="cart in carts">
								<td class="align-middle"><button type="button" @click="displayCart(cart.id)" class="btn btn-default btn-sm" data-bs-toggle="modal" data-bs-target="#modalLg">View</button></td>
                <td class="align-middle">{{cart.id}}</td>
                <td class="align-middle">{{convertDateTime(cart.purchase_datetime)}}</td>
								<td class="align-middle">{{cart.customer_id}}</td>
								<td class="align-middle">{{cart.display_phone_number}}</td>
                <td class="align-middle">{{cart.recipient}}</td>
                <td class="align-middle">{{cart.recipient_email}}</td>
                <td class="align-middle">{{cart.delivery_address}}</td>
								<td class="align-middle">{{cart.items}}</td>
                <td>${{cart.cart_amount}}</td>
                <td>${{cart.delivery_fee}}</td>
								<td>${{cart.total_amount}}</td>
								<td class="py-1 align-middle">
                  <div v-if="cart.is_paid"><span class="badge bg-teal text-teal-800 bg-opacity-25 px-2 pt-5px pb-5px rounded fs-12px d-inline-flex align-items-center"><i class="fa fa-circle text-teal fs-9px fa-fw me-5px"></i> Paid</span></div>
                  <div v-else><span class="badge bg-orange bg-opacity-20 text-orange px-2 pt-5px pb-5px rounded fs-12px d-inline-flex align-items-center"><i class="fa fa-circle fs-9px fa-fw me-5px"></i> Pending</span></div>
                </td>
								<td class="align-middle" v-if="cart.is_paid == false"><button type="button" @click="sendPaymentRequest(cart.id)" class="btn btn-info btn-sm">send</button></td>
                <td class="align-middle" v-else></td>
                <td class="align-middle" v-if="cart.delivery_address == null"><button type="button" @click="sendAddressRequest(cart.id)" class="btn btn-yellow btn-sm">send</button></td>
                <td class="align-middle" v-else></td>
                <td class="align-middle"><div class="form-check form-switch"><input type="checkbox" class="form-check-input" id="customSwitch1" @click="updateOrderStatus(cart.id,cart.is_paid)" v-model="cart.is_paid"></div></td>
              </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
			</div>
		</div>
	</card>
</template>
