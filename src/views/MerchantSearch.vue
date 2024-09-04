<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import CartItems from './CartItems.vue'
import moment from 'moment';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';
import * as XLSX from 'xlsx';

const userSession = useUserSessionStore();
const router = useRouter()

let username = ref(null)
let token = ref(null)
let notification_message = ref(null)
let keyword = ref(null)
let google_results = ref([])
let spin_loading = ref(false)


token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")


function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

async function Search(){
  google_results.value = []
  if(keyword.value){
    spin_loading.value = true
    let payload = {}
    payload['keyword'] = keyword.value
    let data = await postRequest("merchant_search",payload,token)
    if(data['status'] == 200){
      google_results.value = data['data']
      spin_loading.value = false
    } else if (data['status'] == 504) {
      notification_message.value = "Timeout Error"
      showToast(notification_message.value)
    } else {
      notification_message.value = "Unknown Error"
      showToast(notification_message.value)
    }
  } else {
    notification_message.value = "Please input search keyword"
    showToast(notification_message.value)
  }
}

function exportData(){
  console.log(google_results.value.length)
  console.log(google_results.value)
  if(google_results.value.length > 0){
    const worksheet = XLSX.utils.json_to_sheet(google_results.value);
   // Create a new workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
   // Write workbook and export
    XLSX.writeFile(workbook, 'DataExport.xlsx');
  } else {
    let message = "No data will be exported"
    showToast(message)
  }

}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
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


	<div class="d-flex align-items-center mb-3">
    <loading v-model:active="spin_loading"
                 :is-full-page="true"/>

		<div>
			<ul class="breadcrumb">
				<li class="breadcrumb-item"><a href="#">PAGES</a></li>
				<li class="breadcrumb-item active">Merchant Search</li>
			</ul>
			<h1 class="page-header mb-0">Search oppoents or potential  merchants for co-operation</h1>
		</div>
	</div>

	<card>
		<ul class="nav nav-tabs nav-tabs-v2 px-4">
			<li class="nav-item me-3"><a href="#allTab" class="nav-link active px-2" data-bs-toggle="tab">Advertisers at Google Ads and Merchants at Google Merchants</a></li>
		</ul>
		<div class="tab-content p-4">
			<div class="tab-pane fade show active" id="allTab">
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-12">
            Get your oppoents and potential cooperated merchants
          </div>
        </div>
				<div class="row" style="margin-bottom:20px;">
          <div class="col-md-6">
            <div class="row">
              <div class="col-md-8">
                <input type="text" class="form-control ps-35px" placeholder="Search oppoents or potential  merchants for co-operation by keyword" v-model="keyword"/>
              </div>
              <div class="col-md-2">
                <button class="btn btn-default rounded-0" type="button" @click="Search"><span class="d-none d-md-inline">Search</span></button>
              </div>
              <div class="col-md-2">
                <button class="btn btn-default rounded-0" type="button" @click="exportData"><span class="d-none d-md-inline">Export</span></button>
              </div>
            </div>
          </div>
        </div>

				<!-- BEGIN table -->
				<div class="table-responsive" v-if="google_results.length > 0">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
								<th class="border-top-0 pt-0 pb-2">Name</th>
								<th class="border-top-0 pt-0 pb-2">Phone</th>
								<th class="border-top-0 pt-0 pb-2">Type</th>
                <th class="border-top-0 pt-0 pb-2">Url</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="result in google_results">
								<td class="align-middle">{{result.name}}</td>
								<td class="align-middle">{{result.phone}}</td>
								<td class="align-middle">{{result.type}}</td>
                <td class="align-middle">{{result.url}}</td>
							</tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
			</div>
		</div>
	</card>

</template>
