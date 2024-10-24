<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch,onMounted, onUnmounted,getCurrentInstance } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import draggable from 'vuedraggable'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import Loading from 'vue-loading-overlay';
import { responseMessage } from '../composables/response_message.js'
import readXlsxFile from 'read-excel-file'
import TemplateComponents from './TemplateComponents.vue'
import 'vue-select/dist/vue-select.css';

const router = useRouter()

let username = ref(null)
let token = ref(null)
let template = ref(null)
let select_account = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let recipient = ref(null)
let contacts = ref([])
let whatsapp_accounts = ref([])
let template_name = ref(null)
let template_category = ref(null)
let template_components = ref([])
let notification_message = ref(null)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
const state = history.state
template = JSON.parse(state.template)

function updateTemplateComponent(){
  template_components.value = template.components
}


function selectAccount(){
  selected_phone_number_id.value = select_account.value.id
  selected_waba_account.value = select_account.value.waba
  template_name.value = template.name
  template_category.value = template.category
}


async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  data['data']['whatsapp_accounts'].forEach((item, i) => {
    whatsapp_accounts.value.push({'id':item.phone_number_id,'value':item.phone_number,'waba':item.waba_id})
  });
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

checkWaba()
updateTemplateComponent()
</script>

<style scoped>

.ps {
  max-height: 500px; /* or height: 100px; */
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

  <card>
    <card-body class="pb-2">
      <div class="row">
        <div class="col-md-6">
          <div class="row" style="margin-bottom:10px;">
            <div class="flex-fill fw-bold fs-16px">Select sender</div>
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
    <fragment v-if="selected_waba_account">
      <template-components :template_name="template_name" :component="template_components" :template_category="template_category" @showtoast="showToast" :waba_id="selected_waba_account" :phone_number_id="selected_phone_number_id"></template-components>
    </fragment>
  </card>

</template>
