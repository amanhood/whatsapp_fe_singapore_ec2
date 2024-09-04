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
let title = ref(null)
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
  payload['title'] = title.value
  payload['recipient_email'] = recipient_email.value
  payload['content'] = content.value
  if(content.value){
    if(recipient_email.value){
      let data = await postRequest("send_business_help",payload,token)
      if(data['status'] == 200){
        let message = data['data']
        showToast(message)
        title.value = null
        recipient_email.value = null
        content.value = null
      } else {
        notification_message.value = "Unknown Error"
        showToast(notification_message.value)
      }
    } else {
      let message = "Please add recipient email"
      showToast(message)
    }
  } else {
    let message = "Please add content"
    showToast(message)
  }
}

async function getBusinessHelp(){
  let data = await getRequest("get_business_help",token)
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

getBusinessHelp()
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
				<li class="breadcrumb-item active">Business Help</li>
			</ul>
			<h1 class="page-header mb-0">Business Helping Each Other: Connecting You to the Right Solutions</h1>
		</div>
	</div>

	<card>
		<ul class="nav nav-tabs nav-tabs-v2 px-4">
			<li class="nav-item me-3"><a href="#allTab" class="nav-link active px-2" data-bs-toggle="tab">Help Request</a></li>
      <li class="nav-item me-3" ><a href="#existedRequests" class="nav-link px-2" data-bs-toggle="tab">Requests</a></li>
		</ul>
		<div class="tab-content p-4">
			<div class="tab-pane fade show active" id="allTab">
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-12">
            Business Helping Each Other: Connecting You to the Right Solutions (<font style="color:red;">FREE OF CHARGE</font> )
            <br><br>
            We hope this message finds you well. we pride ourselves on not only providing exceptional services but also on our ability to connect you with the right resources to address your unique business challenges.
            <br><br>
            We understand that every organization encounters obstacles that may require specialized solutions. Our extensive network of trusted partners and industry experts is at your disposal. By leveraging these connections, we can facilitate introductions to companies that possess the specific expertise needed to resolve your issues efficiently and effectively.
            <br><br>
            Whether you need help with technology integration, marketing strategies, supply chain management, or any other business area, we can connect you with professionals who have a proven track record of success. Our goal is to ensure that you receive the best possible support, enabling you to focus on your core operations and achieve your business objectives.
            <br><br>
            Please do not hesitate to reach out to us with your requests. We are here to assist you in any way we can, ensuring that your path to success is smooth and well-supported. Let us know how we can help, and we will mobilize our network to provide the solutions you need.
          </div>
        </div>
				<div class="row" style="margin-bottom:20px;">
          <div class="col-md-6">
            <div class="row">
              <div class="col-md-8">
                <input type="text" class="form-control ps-5px" placeholder="title" v-model="title"/>
              </div>
              <div class="col-md-4">
                <input type="text" class="form-control ps-5px" placeholder="recipient email" v-model="recipient_email"/>
              </div>
            </div>
          </div>
        </div>
        <div class="row" style="margin-bottom:20px;">
          <div class="col-md-12">
            <div class="row">
              <div class="col-md-8">
                <textarea class="form-control" id="exampleFormControlTextarea1" rows="6" v-model="content" placeholder="Please write down your request"></textarea>
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
                  <th class="border-top-0 pt-0 pb-2">title</th>
                  <th class="border-top-0 pt-0 pb-2">content</th>
                  <th class="border-top-0 pt-0 pb-2">recipient email</th>
                  <th class="border-top-0 pt-0 pb-2">created time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in records">
                  <td class="align-middle">{{record.title}}</td>
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
