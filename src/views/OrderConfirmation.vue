<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,onMounted,watch } from 'vue'
import { getRequest,postRequest,deleteRequest,formdataRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRoute,useRouter, RouterLink } from 'vue-router';
import draggable from 'vuedraggable'
import 'vue-select/dist/vue-select.css';
import { useAppOptionStore } from '@/stores/app-option';
import { postWithoutTokenRequest } from '../composables/api.js'

const router = useRouter()
const appOption = useAppOptionStore();
let username = ref(null)
let token = ref(null)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
let products = ref([])
let delivery_fee = ref(null)
let total_amount = ref(null)
let cart_amount = ref(null)
let delivery_address = ref(null)
let recipient = ref(null) 
let recipient_email = ref(null)
let note = ref(null)
let notification_message = ref(null)
let is_submitted = ref(false)


onMounted(()=> {
  appOption.appSidebarHide = true;
	appOption.appHeaderHide = true;
	appOption.appContentClass = 'p-0';
})


function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

const route = useRoute()
const orderId = route.params.id

async function getCardDetails(){
	let payload = {}
	payload['cart_id'] = orderId
	let response = await postWithoutTokenRequest("order_confirmation",payload)
	if(response['status'] == 200){
		cart_amount.value = response['data']['cart_amount']
		delivery_fee.value = response['data']['delivery_fee']
		total_amount.value = response['data']['total_amount']
		products.value = response['data']['items']['cart_items']
		delivery_address.value = response['data']['delivery_address']
		recipient.value = response['data']['recipient']
		recipient_email.value = response['data']['recipient_email']
		note.value = response['data']['note']
		if (delivery_address.value != null){
			is_submitted.value = true
		}
	} else {
		console.log("failed")
	}
}

async function proceedToPayment(){
	if(recipient.value == null || recipient_email.value == null || delivery_address == null){
		let message = "must fill recipient, recipient email and delivery fee"
		showToast(message)
	} else {
		let payload = {}
		payload['cart_id'] = orderId
		payload['recipient'] = recipient.value
		payload['recipient_email'] = recipient_email.value
		payload['delivery_address'] = delivery_address.value
		let response = await postWithoutTokenRequest("update_delivery_address",payload)
		if(response['status'] == 200){
			console.log(response)
			is_submitted.value = true
			// let message = "Delivery address updated"
			// showToast(message)
		} else {
			let message = "Failed to update delivery address"
			showToast(message)
		}
	}
}

getCardDetails()

</script>

<style scoped>
#margin_10 {
  margin-top:10px;
  margin-bottom:10px;
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
	
	<div class="d-flex align-items-center mb-3" style="padding:20px;">
		<div>
			<h1 class="page-header mb-0">Order Details</h1>
		</div>
	</div>
	
	<div class="row gx-4" style="padding:2px;">
		<div class="col-lg-8">
			<card class="mb-4">
				<card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
					Products ({{products.length}})
				</card-header>
				<card-body class="text-body">
					<div class="row align-items-center" v-for="product in products">
						<div class="col-lg-8 d-flex align-items-center">
							<div class="h-65px w-65px d-flex align-items-center justify-content-center position-relative bg-white p-1">
								<img :src="product.image_url" alt="" class="mw-100 mh-100">
								<span class="w-20px h-20px p-0 d-flex align-items-center justify-content-center badge bg-theme text-theme-color position-absolute end-0 top-0 fw-bold fs-12px rounded-pill mt-n2 me-n2">{{ product.quantity }}</span>
							</div>
							<div class="ps-3 flex-1">
								<div><a href="#" class="text-decoration-none text-body">{{product.product_name}}</a></div>
							</div>
						</div>
						<div class="col-lg-2 m-0 ps-lg-3">
							${{product.item_price}} x {{product.quantity}}
						</div>
						<div class="col-lg-2 m-0 text-end">
							${{product.amount}}
						</div>
					</div>
					<hr class="my-4">
				</card-body>
			</card>
			<card>
				<card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
					Fee
				</card-header>
				<card-body>
					<table class="table table-borderless table-sm m-0">
						<tbody>
							<tr>
								<td class="w-150px">Subtotal</td>
								<td>{{products.length }} items</td>
								<td class="text-end">${{cart_amount }}</td>
							</tr>
							<tr>
								<td>Shipping Fee</td>
								<td></td>
								<td class="text-end">${{delivery_fee}}</td>
							</tr>
							<tr>
								<td class="pb-2" colspan="2"><b>Total</b></td>
								<td class="text-end pb-2 text-decoration-underline"><b>${{total_amount}}</b></td>
							</tr>
						</tbody>
					</table>
				</card-body>
			</card>
		</div>
		<div class="col-lg-4">
			<card class="mb-4">
				<card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
					Recipient Information
				</card-header>
				<card-body class="fw-bold">
					<div class="col-md-12">
						<label>Recipient</label>
						<input type="text" class="form-control" placeholder="" v-model="recipient" v-if="is_submitted == false"/>
						<input type="text" class="form-control" placeholder="" v-model="recipient" v-else :readonly="true"/>
					</div>
					<div class="col-md-12" style="margin-top:10px;">
						<label>Recipient Email</label>
						<input type="email" class="form-control" placeholder="" v-model="recipient_email" v-if="is_submitted == false"/>
						<input type="email" class="form-control" placeholder="" v-model="recipient_email" v-else :readonly="true"/>
					</div>
				</card-body>
			</card>
			<card class="mb-4">
				<card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
					Delivery Address
				</card-header>
				<card-body class="fw-bold">
					<textarea class="form-control" id="exampleFormControlTextarea1" rows="3" v-model="delivery_address" placeholder="" v-if="is_submitted == false"></textarea>
					<textarea class="form-control" id="exampleFormControlTextarea1" rows="3" v-model="delivery_address" placeholder="" v-else :readonly="true"></textarea>
				</card-body>
			</card>
			<card class="mb-4">
				<card-header class="d-flex align-items-center bg-inverse bg-opacity-10 fw-400">
					Notes
				</card-header>
				<card-body>
					<textarea class="form-control" id="exampleFormControlTextarea1" rows="3" v-model="note" placeholder="" v-if="is_submitted == false"></textarea>
					<textarea class="form-control" id="exampleFormControlTextarea1" rows="3" v-model="note" placeholder="" v-else :readonly="true"></textarea>
				</card-body>
			</card>
			<card class="mb-4">
				<card-body class="fw-bold">
					<button type="button" class="btn btn-teal mb-1 me-1" @click="proceedToPayment()">Proceed to payment</button>
				</card-body>
			</card>
			<!-- <card class="mb-4" v-else>
				<card-body class="fw-bold">
					You will receive a payment link at whatsapp soon
				</card-body>
			</card> -->
		</div>
	</div>
</template>