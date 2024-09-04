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

const router = useRouter()

let username = ref(null)
let token = ref(null)
let notification_message = ref(null)
let spin_loading = ref(false)
let website = ref(null)
let filter_keywords = ref(null)
let recipient_email = ref(null)
let content = ref(null)
let records = ref([])

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

async function sendRequest(){
  let payload = {}
  payload['website'] = website.value
  payload['keywords'] = filter_keywords.value
  payload['recipient_email'] = recipient_email.value
  payload['content'] = content.value
  if(website.value){
    if(recipient_email.value){
      let data = await postRequest("send_crawler_request",payload,token)
      if(data['status'] == 200){
        let message = data['data']
        showToast(message)
        website.value = null
        filter_keywords.value = null
        recipient_email.value = null
        content.value = null
        getCrawlerRequest()
      } else {
        notification_message.value = "Unknown Error"
        showToast(notification_message.value)
      }
    } else {
      let message = "Please add recipient email"
      showToast(message)
    }
  } else {
    let message = "Please add website"
    showToast(message)
  }
}

async function getCrawlerRequest(){
  let data = await getRequest("get_crawler_requests",token)
  if(data['status'] == 200){
    records.value = data['data']['records']
  } else {
    let message = "system error"
    showToast(message)
  }
}

function convertDateTime(created_at){
  return moment(created_at).format('dddd, MMMM DD, YYYY HH:mm:ss');
}

checkLogin()
getCrawlerRequest()
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
				<li class="breadcrumb-item active">Data scraping request</li>
			</ul>
			<h1 class="page-header mb-0">Data Scraping from websites</h1>
		</div>
	</div>

	<card>
		<ul class="nav nav-tabs nav-tabs-v2 px-4">
			<li class="nav-item me-3"><a href="#allTab" class="nav-link active px-2" data-bs-toggle="tab">Data Scraping</a></li>
      <li class="nav-item me-3" ><a href="#existedRequests" class="nav-link px-2" data-bs-toggle="tab">Requests</a></li>
		</ul>
		<div class="tab-content p-4">
			<div class="tab-pane fade show active" id="allTab">
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-12">
            Let us know what data you want scraping programmatically. We will try scraping and send you back the result as soon as possible
          </div>
        </div>
				<div class="row" style="margin-bottom:20px;">
          <div class="col-md-6">
            <div class="row">
              <div class="col-md-4">
                <input type="text" class="form-control ps-5px" placeholder="website" v-model="website"/>
              </div>
              <div class="col-md-4">
                <input type="text" class="form-control ps-5px" placeholder="filtering keywords at content" v-model="filter_keywords"/>
              </div>
              <div class="col-md-4">
                <input type="text" class="form-control ps-5px" placeholder="recipient email" v-model="recipient_email"/>
              </div>
            </div>
          </div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6">
            <div class="row">
              <div class="col-md-8">
                <textarea class="form-control" id="exampleFormControlTextarea1" rows="6" v-model="content" placeholder="Please write down your requirement for crawled data"></textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-6">
            <div class="row">
              <div class="col-md-4">
                <button class="btn btn-default rounded-0" type="button" @click="sendRequest"><span class="d-none d-md-inline">Send Request</span></button>
              </div>
            </div>
          </div>
        </div>


			</div>
      <div class="tab-pane fade show" id="existedRequests">
        <!-- BEGIN table -->
        <div class="table-responsive">
          <div class="col-xl-12">
            <table class="table table-hover text-nowrap">
              <thead>
                <tr>
                  <th class="border-top-0 pt-0 pb-2">website</th>
                  <th class="border-top-0 pt-0 pb-2">filtering keywords</th>
                  <th class="border-top-0 pt-0 pb-2">requirement</th>
                  <th class="border-top-0 pt-0 pb-2">recipient email</th>
                  <th class="border-top-0 pt-0 pb-2">created time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in records">
                  <td class="align-middle">{{record.website}}</td>
                  <td class="align-middle">{{record.keywords}}</td>
                  <td class="align-middle">{{record.content}}</td>
                  <td class="align-middle">{{record.recipient_email}}</td>
                  <td class="align-middle">{{convertDateTime(record.created_at)}}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
		</div>
	</card>

</template>
