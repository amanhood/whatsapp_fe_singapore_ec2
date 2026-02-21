<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref, watch } from 'vue'
import { getRequest,postRequest } from '../composables/api.js'
import { responseMessage } from '../composables/response_message.js'
import { fileProcess } from '../composables/file_process.js'
import 'vue-select/dist/vue-select.css';
import CreateTemplate from './CreateTemplate.vue'
import LtoTemplate from './LtoTemplate.vue'
import DocsTemplate from './DocsTemplate.vue'
import ProductsTemplate from './ProductsTemplate.vue'
import ChoiceTemplate from './ChoiceTemplate.vue'
import FlowTemplate from './FlowTemplate.vue'
import CouponTemplate from './CouponTemplate.vue'
import BookingConfirmationTemplate from './BookingConfirmationTemplate.vue'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';

const router = useRouter()
let username = ref(null)
let token = ref(null)
let role = ref(null)
let user_id = ref(null)
let template_type = ref(null)
let template_types = [
        { id:'general_template',title: "General message template" },
        { id:'limited_time_sale',title: "Special sales message template" },
        { id:'document_template',title: "Document message template" },
        { id:'product_catalog',title: "Products message template" },
        { id:'choice_template',title: "Choice message template" },
        { id:'flow_template',title: "Whatsapp flow message template" },
        { id:'coupon_template',title: "Coupon message template" },
        { id:'booking_confirmation_template',title: "Booking confirmation" }
      ]
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let selected_phone_number = ref(null)
let notification_message = ref(null)
let landing_pages = ref([])

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")
user_id.value = sessionStorage.getItem("id")

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  whatsapp_accounts.value = data['data']['whatsapp_accounts']
  selected_waba_account.value = whatsapp_accounts.value[0]['waba_id']
  selected_phone_number_id.value = whatsapp_accounts.value[0]['phone_number_id']
  selected_phone_number.value = whatsapp_accounts.value[0]['phone_number']
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if (role.value != 'parent'){
        router.push('/page/login');
    } 
  }
}

async function getLandingPages(){
    let response = await getRequest("get_landing_pages",token)
    if(response.request.status == 200){
        landing_pages.value = response['data']['landing_pages']
    } else {
        let notification_message = "System error"
        showToast(notification_message)
    }
}


checkLogin()
checkWaba()
getLandingPages()

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

  <card>
    <card-body class="pb-2">
      <div class="row">
        <div class="col-md-12">
          <div class="row" style="margin-bottom:10px;">
            <div class="flex-fill fw-bold fs-16px">Template type</div>
          </div>
          <div class="row">
            <div class="col-md-6">
              <v-select v-model="template_type" :options="template_types" label="title"></v-select>
            </div>
          </div>
        </div>
      </div>
    </card-body>
    <hr>
    <create-template @showtoast="showToast" :user_id="user_id" :landing_pages="landing_pages" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'general_template'"></create-template>
    <lto-template @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'limited_time_sale'"></lto-template>
    <docs-template @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'document_template'"></docs-template>
    <products-template @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'product_catalog'"></products-template>
    <choice-template @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'choice_template'"></choice-template>
    <flow-template @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'flow_template'"></flow-template>
    <coupon-template @showtoast="showToast" :landing_pages="landing_pages" :phone_number="selected_phone_number" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'coupon_template'"></coupon-template>
    <booking-confirmation-template @showtoast="showToast" :landing_pages="landing_pages" :phone_number="selected_phone_number" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'booking_confirmation_template'"></booking-confirmation-template>
  </card>
</template>
