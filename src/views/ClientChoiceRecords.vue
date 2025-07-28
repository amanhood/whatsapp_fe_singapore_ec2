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
let role = ref(null)
let whatsapp_accounts = ref([])
let select_account = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let selected_phone_number = ref(null)
let notification_message = ref(null)
let choices = ref([])
let templates = ref([])
let selected_template = ref(null)

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
  data['data']['whatsapp_accounts'].forEach((item, i) => {
    whatsapp_accounts.value.push({'id':item.phone_number_id,'value':item.phone_number,'waba':item.waba_id})
  });
}


function selectAccount(){
  selected_phone_number_id.value = select_account.value.id
  selected_waba_account.value = select_account.value.waba
  selected_phone_number.value = select_account.value.value
  getTemplates()
}

async function getTemplates(){
  let payload = {}
  payload['phone_number_id'] = selected_phone_number_id.value
  let response = await postRequest("get_templates",payload,token)
	if(response['status'] == 200){
    response['data']['templates'].forEach((item) => {
      templates.value.push({'id':item.id,'value':item.name})
    })
  } else {
    let notification_message = "Failed to get templates"
    showToast(notification_message)
  }
}

async function getChoiceRecords(){
  let payload = {}
  payload['template'] = selected_template.value
  let response = await postRequest("get_choice_records",payload,token)
	if(response['status'] == 200){
    choices.value = response['data']['choices'] 
    console.log(choices.value)
  } else {
    let notification_message = "No chocies are found"
    showToast(notification_message)
  }
}



function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
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

function downloadData(){
  const headers = [
    { label: 'Template Name', key: 'template_name' },
    { label: 'Client name', key: 'recipient_name' },
    { label: 'Client phone number', key: 'recipient_phone' },
    { label: 'Answer', key: 'choice' },
    { label: 'Reply time', key: 'created_at' },
  ]
  const data = choices.value
  const headerRow = headers.map(h => h.label)
  exportToExcel(data, headerRow,headers, 'choice-list.xlsx')
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

            <div class="col-md-3" v-if="select_account">
              <v-select v-model="selected_template" :options="templates" label="value"></v-select>
            </div>
            
            
            <div class="col-md-3" v-if="selected_waba_account">
              <button type="button" class="btn btn-yellow mb-1 me-1" @click="getChoiceRecords">Get choice records</button>
            </div>    
          </div>
        </div>
      </div>
    </card-body>
    <card-body class="pb-2" v-if="choices.length > 0">
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
                <th class="border-top-0 pt-0 pb-2">Client name</th>
								<th class="border-top-0 pt-0 pb-2">Client phone number</th>
								<th class="border-top-0 pt-0 pb-2">Answer</th>
								<th class="border-top-0 pt-0 pb-2">Reply time</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="choice in choices">
								<td class="align-middle">{{ choice.template_name }}</td>
                <td class="align-middle">{{ choice.recipient_name }}</td>
                <td class="align-middle">{{ choice.recipient_phone }}</td>
                <td class="align-middle">{{ choice.choice }}</td>
                <td class="align-middle">{{ deliveryDateTime(choice.created_at) }}</td>
                
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
