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
import FlowTemplate from './FlowTemplate.vue'
import { Toast } from 'bootstrap';

let username = ref(null)
let token = ref(null)
let template_type = ref(null)
let template_types = [
        { id:'general_template',title: "General message template" },
        { id:'limited_time_sale',title: "Special sales message template" },
        { id:'document_template',title: "Document message template" },
        { id:'product_catalog',title: "Products message template" },
        { id:'delivery_address',title: "Delivery address template" }
      ]
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let notification_message = ref(null)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  whatsapp_accounts.value = data['data']['whatsapp_accounts']
  selected_waba_account.value = whatsapp_accounts.value[0]['waba_id']
  selected_phone_number_id.value = whatsapp_accounts.value[0]['phone_number_id']
  console.log(selected_waba_account.value)
  console.log(selected_phone_number_id.value)
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

checkWaba()

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
    <create-template @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'general_template'"></create-template>
    <lto-template @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'limited_time_sale'"></lto-template>
    <docs-template @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'document_template'"></docs-template>
    <products-template @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'product_catalog'"></products-template>
    <flow-template @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id" v-if="template_type && template_type.id == 'delivery_address'"></flow-template>
  </card>
</template>
