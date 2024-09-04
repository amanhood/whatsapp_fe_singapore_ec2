<script>
import { useAppOptionStore } from '@/stores/app-option';
import { useUserSessionStore } from '@/stores/user-session';
import { useRouter, RouterLink } from 'vue-router';
import { userRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { postWithoutTokenRequest } from '../composables/api.js'

const appOption = useAppOptionStore();
const userSession = useUserSessionStore();

export default {
	data(){
		return {
			cart_id:"",
			cart_amount:0,
			cart_items:[],
			payment_status:""
		}
	},
	mounted() {
		appOption.appSidebarHide = true;
		appOption.appHeaderHide = true;
		appOption.appContentClass = 'p-0';
	},
	beforeUnmount() {
		appOption.appSidebarHide = false;
		appOption.appHeaderHide = false;
		appOption.appContentClass = '';
	},
	methods: {
		async getParams() {
      let order_no = this.$route.query.order_no
			let currency = this.$route.query.currency
			let out_trade_no = this.$route.query.out_trade_no
			let total_fee = this.$route.query.total_fee
			let trade_no = this.$route.query.trade_no
			let trade_status = this.$route.query.trade_status
			let sign = this.$route.query.sign
			let sign_type = this.$route.query.sign_type
			let payload = {}
			payload['order_no'] = order_no
			payload['currency'] = currency
			payload['out_trade_no'] = out_trade_no
			payload['total_fee'] = total_fee
			payload['trade_no'] = trade_no
			payload['trade_status'] = trade_status
			payload['sign'] = sign
			payload['sign_type'] = sign_type
			let data = await postWithoutTokenRequest("qfpay_confirmation",payload)
			if(data['status'] == 200){
				this.cart_amount = data['data']['cart_amount']
				this.cart_id = order_no
				this.cart_items = data['data']['items']
				this.payment_status = data['data']['qf_payment_result']
		  } else {
		    console.log("failed")
		  }
    }
	},
	created(){
		//console.log(userSession.token)
		this.getParams()
	}
}
</script>
<template>
	<div class="login">
		<!-- BEGIN login-content -->
		<div class="login-content" v-if="payment_status =='success'">
			<form v-on:submit.prevent="submitForm()" method="POST" name="login_form">
				<h1 class="text-center">Thank you for your purchase</h1>
				<div class="text-muted text-center mb-4">
					You will recieve our whatasapp confirmation shortly
				</div>
				<card>
					<card-body class="pb-2">
			        <div class="row">
			          <div class="col-xl-12">
									<div class="form-group mb-3">
			              <div class="flex-fill fw-bold fs-16px">Invoice No: {{cart_id}}</div>
			            </div>
			            <div class="form-group mb-3">
			              <div class="flex-fill fw-bold fs-16px">Total Amount: HKD {{cart_amount}}</div>
			            </div>
									<div class="form-group mb-3">
			              <div class="flex-fill fs-16px" v-for="item in cart_items">
											- {{item.product_name}} x {{item.quantity}}
										</div>
			            </div>
			          </div>
			        </div>
			    </card-body>
				</card>
			</form>
		</div>
		<div class="login-content" v-else>
			<form v-on:submit.prevent="submitForm()" method="POST" name="login_form">
				<h1 class="text-center">Sorry, payment is failed.</h1>
				<div class="text-muted text-center mb-4">
					Please pay again
				</div>
			</form>
		</div>
		<!-- END login-content -->
	</div>
	<!-- END login -->
</template>
