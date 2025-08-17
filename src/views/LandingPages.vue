<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,onMounted } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';
import moment from 'moment';


const router = useRouter()
let username = ref(null)
let token = ref(null)
let role = ref(null)
let notification_message = ref(null)
let selected_landing_page_id = ref(null)
let landing_pages = ref([])
let user_id = ref(null)

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")
user_id = sessionStorage.getItem("id")


function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if (role.value != 'parent'){
        router.push('/page/login');
    } 
  }
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
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

function createLandingPage(){
    router.push('/page/create-landing-page');
}

function editLandingPage(id) {
  router.push(`/page/edit-landing-page/${id}`);
}

function getSlug(title) {
  return title.replace(/\s+/g, '-');
}

function showLandingPage(user_id,landing_page_id){
    router.push('/page/landing-page/'+user_id + '/' + landing_page_id);
}

onMounted(() => {
  checkLogin();
  getLandingPages();
});

</script>

<style>
#margin_10 {
  margin-top:10px;
  margin-bottom:10px;
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
		<div class="tab-content p-4" >
			<div class="tab-pane fade show active" id="allTab">
				<div class="row">
                    <div class="col-xl-2">
                        <div class="mb-3">
                            <button type="button" class="btn btn-teal mb-1 me-1" @click="createLandingPage">Create</button>
                        </div>
                    </div>
                </div>

				<!-- BEGIN table -->
				<div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
								<th class="border-top-0 pt-0 pb-2">Title</th>
								<th class="border-top-0 pt-0 pb-2">Show</th>
								<th class="border-top-0 pt-0 pb-2">Edit</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="landing_page in landing_pages">         
                  <td class="align-middle">{{landing_page.title }}</td>
                  <td class="align-middle"><button type="button" class="btn btn-yellow mb-1 me-1" @click="showLandingPage(user_id, getSlug(landing_page.title))">Show</button></td>
                  <td class="align-middle"><button type="button" class="btn btn-warning mb-1 me-1" @click="editLandingPage(landing_page.id)">Edit</button></td>
              </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
			</div>
		</div>
	</card>


</template>
