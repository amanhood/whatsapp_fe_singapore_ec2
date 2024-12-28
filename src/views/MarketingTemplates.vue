<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';

const userSession = useUserSessionStore();
const router = useRouter()

let templates = ref([])
let fixed_templates = ref([])
let username = ref(null)
let token = ref(null)
let fb_login_error_message = ref(null)
let selected_category = ref(null)
let selected_language = ref(null)
let categories = [
        { id:'MARKETING',title: "MARKETING" },
        { id:'UTILITY',title: "UTILITY" }
      ]
let languages = [
        { id:'zh_HK',title: "Chinese (HKG)" },
        { id:'en_US',title: "English (US)" },
        { id:'id',title: "Indonesia" },
        { id:'pt_BR',title: "Portugal" },
        { id:'es',title: "Spanish" }
      ]
let notification_message = ref(null)
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
//token = userSession.token
//username = userSession.username
//console.log(userSession.token)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

async function checkWaba(){
  let data = await postRequest("check_waba",null,token)
  whatsapp_accounts.value = data['data']['whatsapp_accounts']
  selected_waba_account.value = whatsapp_accounts.value[0]['waba_id']
  selected_phone_number_id.value = whatsapp_accounts.value[0]['phone_number_id']
  getTemplates(selected_waba_account.value,selected_phone_number_id.value)
}


async function getTemplates(waba_id,phone_number_id){
  templates.value = []
  fixed_templates.value = []
  if(whatsapp_accounts.value.length > 0){
    let payload = {}
    payload['waba_id'] = waba_id
    payload['phone_number_id'] = phone_number_id
    let data = await postRequest("get_fb_templates",payload,token)
    if(data['data']['error']){
      let error_message = data['data']['error']
      showToast(error_message['message'])
    } else {
      templates.value = data.data.data
      templates.value.forEach((item, i) => {
        item.components.forEach((sitem, i) => {
          if(sitem.type == "BUTTONS"){
            sitem.buttons.forEach((titem, i) => {
              if(titem.type == "MPM"){
                item['is_mpm'] = true
                item['can_delete'] = true
              } else {
                item['is_mpm'] = false
                if(titem.type == "FLOW"){
                  item['can_delete'] = false
                } else {
                  item['can_delete'] = true
                }
              }
            });
          } else {
            item['is_mpm'] = false
            item['can_delete'] = true
          }
        });
      });
      fixed_templates.value = templates.value
    }
  }
  console.log(templates.value)
}

async function deleteTemplate(template_id,template_name){
  let data = await deleteRequest("delete_template/?template_id="+template_id+"&template_name="+template_name+"&waba_id="+ selected_waba_account.value+"&phone_number_id="+selected_phone_number_id.value,token)
  getTemplates(selected_waba_account.value,selected_phone_number_id.value)
}



function searchTemplates(){
  templates.value = fixed_templates.value
  let templates_result = []
  if(selected_language.value == null && selected_category.value == null){
    // all
    templates_result = fixed_templates.value
  } else if (selected_category.value != null && selected_language.value == null){
    templates_result = templates.value.filter(
      d => d.category == selected_category.value.id)
  } else if (selected_language.value != null && selected_category.value == null){
    templates_result = templates.value.filter(
      d => d.language == selected_language.value.id)
  } else {
    templates_result = templates.value.filter(
      d => d.category == selected_category.value.id &
           d.language == selected_language.value.id)
  }
  templates.value = templates_result
}

function createTemplate(){
  router.push({
      path: '/page/create-marketing-template'
  });
}

function messaging(template,selected_waba_account,selected_phone_number_id){
  router.push({
      path: '/page/send-message-template',
      state: {
        template: JSON.stringify(template),
        selected_waba_account:selected_waba_account,
        selected_phone_number_id:selected_phone_number_id
         // For complex objects, consider stringifying
      }
  });
}

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

checkLogin()
checkWaba()

</script>


<template>
	<card>
		<div class="tab-content p-4" >
			<div class="tab-pane fade show active" id="allTab">
				<div class="row">
          <div class="col-xl-2">
            <div class="mb-3">
              <button type="button" class="btn btn-teal mb-1 me-1" @click="createTemplate">Create Template</button>
            </div>
          </div>
          <div class="col-xl-3">
            <div class="mb-3">
              <v-select v-model="selected_category" :options="categories" label="title" @update:modelValue="selectCategory(event)"></v-select>
            </div>
          </div>
          <div class="col-xl-3">
            <div class="mb-3">
              <v-select v-model="selected_language" :options="languages" label="title"></v-select>
            </div>
          </div>
          <div class="col-xl-2">
            <div class="mb-3">
              <button type="button" class="btn btn-primary mb-1 me-1" @click="searchTemplates">Search</button>
            </div>
          </div>
        </div>

				<!-- BEGIN table -->
				<div class="table-responsive">
					<table class="table table-hover text-nowrap">
						<thead>
							<tr>
								<th class="border-top-0 pt-0 pb-2">template name</th>
								<th class="border-top-0 pt-0 pb-2">category</th>
								<th class="border-top-0 pt-0 pb-2">langauge</th>
								<th class="border-top-0 pt-0 pb-2">status</th>
                <th class="border-top-0 pt-0 pb-2">view</th>
                <th class="border-top-0 pt-0 pb-2">delete</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="template in templates">         
                <td class="align-middle">{{template.name}}</td>
                <td class="align-middle">{{template.category}}</td>
                <td class="align-middle">{{template.language}}</td>
                <td class="align-middle">{{template.status}}</td>
                <td class="align-middle" v-if="template.can_delete == true"><button type="button" @click="messaging(template)" class="btn btn-yellow me-2">Send Message</button></td>
                <td class="align-middle" v-else></td>
                <td class="align-middle" v-if="template.can_delete == true"><button type="button" @click="deleteTemplate(template.id,template.name)" class="btn btn-danger me-2">Delete</button></td>
                <td class="align-middle" v-else></td>      
              </tr>
						</tbody>
					</table>
				</div>
				<!-- END table -->
			</div>
		</div>
	</card>


</template>
