<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest,putRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import datepicker from '@/assets/components/plugins/Datepicker.vue';
import 'vue-select/dist/vue-select.css';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const router = useRouter()

let username = ref(null)
let token = ref(null)
let whatsapp_accounts = ref([])
let select_account = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let selected_phone_number = ref(null)
let notification_message = ref(null)
let start_date = ref(null)
let end_date = ref(null)
let messages = ref([])

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

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
}

function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
}

async function getSentMessages(){
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
  payload['phone_number_id'] = selected_phone_number_id.value
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number'] = selected_phone_number.value
  payload['start_date'] = start_date.value
  payload['end_date'] = end_date.value
	let response = await postRequest("get_message_records",payload,token)
	if(response['status'] == 200){
    messages.value = response['data']
    console.log(messages.value)
  } else {
    let notification_message = "Failed to get sent messages"
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

function convertTemplateType(template_type){
  if(template_type == 'limited_time_offer'){
    return 'Promotion message with time limited coupon';
  } else if(template_type == 'api'){
    return 'API message';
  } else if(template_type == 'normal'){
    return 'General marketing message';
  } else if(template_type == 'utility'){
    return 'Document download message';
  } else if(template_type == 'multiple_products'){
    return 'Specifc products message';
  } else if(template_type == 'catalog_products'){
    return 'Catalog with all products message';
  }
}

function deliveryDateTime(delivery_time){
  return moment(delivery_time).subtract(8, 'h').format('dddd, MMMM DD, YYYY HH:mm:ss');
}

function downloadData(){
  const headers = [
    { label: 'Template Name', key: 'template_name' },
    { label: 'Tenplate Type', key: 'template_type' },
    { label: 'Delivery Time', key: 'delivery_time' },
    { label: 'Sending Status', key: 'status' },
    { label: 'Recioient Phone Number', key: 'recipient' },
    { label: 'Receiving Status', key: 'recipient_status' },
    { label: 'Receiving Status Message', key: 'recipient_status_message' }
  ]
  const data = messages.value
  const headerRow = headers.map(h => h.label)
  exportToExcel(data, headerRow,headers, 'message-list.xlsx')
}


function exportToExcel(data, headerRow, headers, fileName) {
  // Convert your headers and data into an array-of-arrays format (AOA)
  const rows = [headerRow, ...data.map(item => headers.map(h => item[h.key]))];
  console.log(rows)

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

  saveAs(blob, fileName);
}


checkLogin()
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
            <div class="flex-fill fw-bold fs-16px">Select phone number</div>
          </div>
          <div class="row">
            <div class="col-md-3">
              <v-select v-model="select_account" :options="whatsapp_accounts" label="value" @update:modelValue="selectAccount"></v-select>
            </div>
            <div class="col-md-3" v-if="selected_waba_account">
              <datepicker v-model="start_date" @update:model-value="getDateTime('start')"/>
            </div>
            <div class="col-md-3" v-if="selected_waba_account">
              <datepicker v-model="end_date" @update:model-value="getDateTime('end')"/>
            </div>
            <div class="col-md-3" v-if="selected_waba_account">
              <button type="button" class="btn btn-yellow mb-1 me-1" @click="getSentMessages">Get message records</button>
            </div>    
          </div>
        </div>
      </div>
    </card-body>
    <card-body class="pb-2" v-if="messages.length > 0">
      <div class="row">
        <div class="col-md-12">
          <div class="row">
            <div class="col-md-3">
              <button type="button" class="btn btn-teal mb-1 me-1" @click="downloadData">Export to excel</button>
            </div>
          </div>
        </div>
      </div>
    </card-body>
    <hr>
    <card-body>
      <div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
								<th class="border-top-0 pt-0 pb-2">Template name</th>
                <th class="border-top-0 pt-0 pb-2">Template type</th>
								<th class="border-top-0 pt-0 pb-2">Delivery time</th>
								<th class="border-top-0 pt-0 pb-2">Sender Status</th>
								<th class="border-top-0 pt-0 pb-2">Recipient phone number </th>
                <th class="border-top-0 pt-0 pb-2">Receiver status</th>
                <th class="border-top-0 pt-0 pb-2">Sent success / failed reason</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="message in messages">
								<td class="align-middle">{{ message.template_name }}</td>
                <td class="align-middle">{{ convertTemplateType(message.template_type) }}</td>
                <td class="align-middle">{{ deliveryDateTime(message.delivery_time) }}</td>
                <td class="align-middle">{{ message.status }}</td>
                <td class="align-middle">{{ message.recipient }}</td>
                <td class="align-middle">{{ message.recipient_status }}</td>
                <td class="align-middle">{{ message.recipient_status_message }}</td>
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
