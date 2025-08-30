<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest,putRequest } from '../composables/api.js'
import { exportResponsesToExcel } from '../composables/flows_export_excel.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import datepicker from '@/assets/components/plugins/Datepicker.vue';
import 'vue-select/dist/vue-select.css';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileQuestionMark,SpellCheck } from 'lucide-vue-next'

const router = useRouter()

let username = ref(null)
let token = ref(null)
let role = ref(null)
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let select_account = ref(null)
let flows = ref([])
let notification_message = ref(null)
let start_date = ref(null)
let end_date = ref(null)
let forms = ref([])
let submitted_records = ref([])
let selected_form = ref(null)
let selected_answer = ref(null)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  data['data']['whatsapp_accounts'].forEach((item, i) => {
    whatsapp_accounts.value.push({'id':item.phone_number_id,'value':item.phone_number,'waba':item.waba_id})
  });
}

async function selectAccount(){
  selected_waba_account.value = select_account.value.waba
  selected_phone_number_id.value = select_account.value.id
  getFlows()
}

async function getFlows(){
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  let response = await postRequest("get_flows",payload,token)
  if(response.request.status == 200){
    response['data']['data'].forEach((item) => {
        if(item.status == 'PUBLISHED' || item.status == 'DEPRECATED'){
            flows.value.push({'id':item.id,'value':item.name})
        }
    })
  } else {
    let message = "Failed to get Flows"
    showToast(message)
  }
}

function checkLogin(){
    if(!token){
        router.push('/page/login');
    } else {
        if (role.value != 'parent'){
            router.push('/page/login');
        } else {
            checkWaba()
        }
    }
}


function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
}

async function getSubmittedFlows(){
    if (!start_date.value || !end_date.value) {
        let notification_message = "Start date and end date cannot be null"
        showToast(notification_message)
        return
    }
    if (end_date.value < start_date.value) {
        let notification_message = "End date cannot be earlier than start date."
        showToast(notification_message)
        return
    }
    let payload = {}
    payload['start_date'] = start_date.value
    payload['end_date'] = end_date.value
    payload['flow_id'] = selected_form.value.id
	let response = await postRequest("get_submitted_flows",payload,token)
	if(response['status'] == 200){
        submitted_records.value = response['data']
    } else {
        let notification_message = "Failed to get submitted forms"
        showToast(notification_message)
    }
}

function getDateTime(date_type){
  if(date_type == 'start'){
    start_date.value = convertDateTime(start_date.value)
  } else if(date_type == 'end'){
    end_date.value = convertDateTime(end_date.value)
  }
}

function convertDateTime(dateStr){
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const dd = String(date.getDate()).padStart(2, '0');
  const formattedDate = `${yyyy}-${mm}-${dd}`;
  return formattedDate
}


function deliveryDateTime(delivery_time){
  return moment(delivery_time).format('dddd, MMMM DD, YYYY HH:mm:ss');
}

function selectedAnswer(answer){
    selected_answer.value = answer
    console.log(selected_answer.value)
}

function isIsoDateTime(val) {
  const ISO_DT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})$/;
  if (typeof val !== 'string' || !ISO_DT_RE.test(val)) return false;
  const t = Date.parse(val);
  return !Number.isNaN(t);
}

function onExport() {
  // works with a single record or an array of records
  console.log(submitted_records.value)
  exportResponsesToExcel(submitted_records.value, `responses-${new Date().toISOString().slice(0,10)}.xlsx`);
}


checkLogin()


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
          <h5 class="modal-title">Questions and Answers</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body"> 
            <div class="row" v-for="(val, key) in selected_answer">
                <div class="row">
                  <div class="col-md-12" style="font-weight:bold;">
                    <FileQuestionMark class="w-6 h-6 text-red-600" /> {{ key }}
                  </div>
                </div>
                
                <div class="row">
                  <div class="col-md-12" style="margin-top:10px;margin-bottom:20px;padding-left:35px;">
                      <template v-if="Array.isArray(val)">{{ val.join(', ') }}</template>
                      <template v-else-if="isIsoDateTime(val)">{{ deliveryDateTime(val) }}</template>
                      <template v-else>{{ val }}</template>
                  </div>
                </div>
                <hr>
            </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal" id="deleteCatalogModal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <card>
    <card-body class="pb-2">
    <div class="row align-items-end">
        <!-- Select phone number -->
        <div class="col-md-3">
        <label class="fw-bold fs-16px mb-2">Select phone number</label>
        <v-select
            v-model="select_account"
            :options="whatsapp_accounts"
            label="value"
            @update:modelValue="selectAccount"
        />
        </div>

        <!-- Select WhatsApp flow -->
        <div class="col-md-3" v-if="selected_waba_account">
        <label class="fw-bold fs-16px mb-2">Select whatsApp flow</label>
        <v-select v-model="selected_form" :options="flows" label="value" />
        </div>

        <!-- Start date -->
        <div class="col-md-2" v-if="selected_form">
        <label class="fw-bold fs-16px mb-2">Start date</label>
        <datepicker v-model="start_date" @update:model-value="getDateTime('start')" />
        </div>

        <!-- End date -->
        <div class="col-md-2" v-if="selected_form">
        <label class="fw-bold fs-16px mb-2">End date</label>
        <datepicker v-model="end_date" @update:model-value="getDateTime('end')" />
        </div>

        <!-- Submit button -->
        <div class="col-md-2" v-if="selected_form">
        <button type="button" class="btn btn-yellow mb-1 me-1 w-100" @click="getSubmittedFlows">
            Get submitted whatsapp flows
        </button>
        </div>
    </div>
    </card-body>
    <card-body class="pb-2" v-if="selected_waba_account && submitted_records.length > 0">
      <div class="row">
        <div class="col-md-12">
          <div class="row">
            <div class="col-md-3">
              <button type="button" class="btn btn-teal mb-1 me-1" @click="onExport">Export to excel</button>
            </div>
          </div>
        </div>
      </div>
    </card-body>
    <hr>
    <card-body v-if="selected_waba_account && submitted_records.length > 0">
        <div class="table-responsive">
            <table class="table table-hover text-nowrap">
                <thead>
                    <tr>
                        <th class="border-top-0 pt-0 pb-2">Recipient name</th>
                        <th class="border-top-0 pt-0 pb-2">Recipient phone number</th>
                        <th class="border-top-0 pt-0 pb-2">Submitted time</th>
                        <th class="border-top-0 pt-0 pb-2">Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="record in submitted_records">
                        <td class="align-middle">{{ record.recipient_name }}</td>
                        <td class="align-middle">{{ record.recipient_phone_number }}</td>
                        <td class="align-middle">{{ deliveryDateTime(record.submitted_at) }}</td>
                        <td class="align-middle"><button type="button" class="btn btn-yellow me-2" data-bs-toggle="modal" data-bs-target="#modalLg" @click="selectedAnswer(record.answers)">Check answers</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </card-body>

  </card>
</template>

<style scoped>
.form-label {
  font-weight:bold;
}
#marin_top_20 {
  margin-top:20px;
}
</style>
