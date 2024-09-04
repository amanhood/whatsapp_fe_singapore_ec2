<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,watch,onMounted, onUnmounted,getCurrentInstance } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import draggable from 'vuedraggable'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';
import { responseMessage } from '../composables/response_message.js'
import readXlsxFile from 'read-excel-file'

const router = useRouter()

let spin_loading = ref(false)
let username = ref(null)
let token = ref(null)
let template = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let business_account_id = ref(null)
let input_business_account_id = ref(null)
let notification_message = ref(null)
let catalogs = ref([])
let header_text = ref(null)
let body_text = ref(null)
let body_text_message = ref(null)
let body_variables = ref([])
let products = ref([])
let sections = ref([])
let number_of_section = ref(1)
let selected_product = ref(null)
let thumbnail_product_id = ref(null)
let recipient = ref(null)
let contacts = ref([])

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
const state = history.state
template = JSON.parse(state.template)
selected_waba_account = state.selected_waba_account
selected_phone_number_id = state.selected_phone_number_id


async function get_business_account(){
	let payload = {}
	payload['waba_id'] = selected_waba_account
	payload['phone_number_id'] = selected_phone_number_id
	let data = await postRequest("get_business_account",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
			if(data['data']['business_account_id']){
				business_account_id.value = data['data']['business_account_id']
				catalogs.value = data['data']['catalogs']['data']
			}
		}
  }
}

async function addBusinessAccount(){
	let payload = {}
	payload['business_account_id'] = input_business_account_id.value
	payload['waba_id'] = selected_waba_account
	payload['phone_number_id'] = selected_phone_number_id
	let data = await postRequest("add_business_account",payload,token)
	if(data.request.status == 200){
		if(data['data']['error']){
			let message = data['data']['error']['message']
			showToast(message)
		} else {
			if(data['data']['catalogs']['error']){
				let message = data['data']['catalogs']['error']['message']
				showToast(message)
			} else {
				business_account_id.value = data['data']['business_account_id']
				catalogs.value = data['data']['catalogs']['data']
			}
		}
  }
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

watch(body_text,(newValue,oldValue)=>{
    if(body_text.value.includes(",")){
      body_variables.value = []
      body_text_message.value = null
      body_variables.value = body_text.value.split(",")
      body_text_message.value = body_variables.length + " variables are inputted"
    } else {
      if(body_text.value == ""){
        body_variables.value = []
        body_text_message.value = "Empty"
      } else {
        body_variables.value = []
        body_variables.value.push(body_text.value)
        body_text_message.value = body_text.value + " is value of variable 1"
      }
    }
})

async function selectCatalog(catalog_id){
	let payload = {}
	payload['catalog_id'] = catalog_id
	payload['waba_id'] = selected_waba_account
	payload['phone_number_id'] = selected_phone_number_id
  spin_loading.value = true
	let data = await postRequest("get_catalog_products",payload,token)
	if(data.request.status == 200){
    spin_loading.value = false
		products.value = data['data']
		if(products.length == 0){
			let message = "No products are found at this catalog"
			showToast(message)
		}
  } else {
    spin_loading.value = false
		let message = "System error"
		showToast(message)
	}

}

function addSection(){
  if(sections.value.length < 11){
    sections.value.push({
      'id':number_of_section.value,
      'title':null,
      'product_items':[]
    })
    number_of_section.value += 1
  } else {
    let message = "More than 10 sections are not allowed in Multiple Products template"
		showToast(message)
  }
}

function deleteSection(section_id){
  const index = sections.value.findIndex(item => item.id === section_id)
  //console.log(index)
  if (index !== -1) {
    sections.value.splice(index, 1)
  }
}

function handleDragStart(item) {
  selected_product.value = item
}

function handleDrop(section) {
  const item = sections.value.find(item => item.id === section.id);
  if(item){
    item.product_items.push(selected_product.value.retailer_id)
  }
  sections.value = [...sections.value];
}

function handleThumbnaiDrop(){
  thumbnail_product_id.value = selected_product.value.retailer_id
}

async function submit(){
	let payload = {}
	if(!header_text.value){
		template.components.forEach((item, i) => {
			if(item.type == 'HEADER' && item.example){
				payload['header_text'] = item.example.header_text[0]
			}
		});
	} else {
		payload['header_text'] = header_text.value
	}
	if(body_variables.value.length == 0){
		template.components.forEach((item, i) => {
			if(item.type == 'BODY' && item.example){
				payload['body_variables'] = item.example.body_text[0]
			}
		});
	} else {
		payload['body_variables'] = body_variables.value
	}
  payload['components'] = template.components
  payload['thumbnail_product_id'] = thumbnail_product_id.value
  payload['recipient'] = recipient.value
  payload['sections'] = sections.value
  payload['waba_id'] = selected_waba_account
  payload['phone_number_id'] = selected_phone_number_id
  payload['template_name'] = template.name
  if(recipient.value){
    let data = await postRequest("send_multiple_products_message",payload,token)
    if(data.request.status == 200){
      let notification_message = responseMessage(data)
      showToast(notification_message)
    } else {
      let message = "system error"
  		showToast(message)
    }
  } else {
    let message = "No recipient phone number is set"
		showToast(message)
  }
}

function uploadExcel(event) {
  let xlsxfile = event.target.files ? event.target.files[0] : null;
  readXlsxFile(xlsxfile).then((rows) => {
    contacts.value = rows
  })
}

async function bulk_send(){
	let payload = {}
	if(!header_text.value){
		template.components.forEach((item, i) => {
			if(item.type == 'HEADER' && item.example){
				payload['header_text'] = item.example.header_text[0]
			}
		});
	} else {
		payload['header_text'] = header_text.value
	}
	if(body_variables.value.length == 0){
		template.components.forEach((item, i) => {
			if(item.type == 'BODY' && item.example){
				payload['body_variables'] = item.example.body_text[0]
			}
		});
	} else {
		payload['body_variables'] = body_variables.value
	}
  payload['components'] = template.components
	payload['template_type'] = "multiple_products"
  payload['thumbnail_product_id'] = thumbnail_product_id.value
  payload['sections'] = sections.value
  payload['waba_id'] = selected_waba_account
  payload['phone_number_id'] = selected_phone_number_id
  payload['template_name'] = template.name
	payload['contacts'] = contacts.value
  if(contacts.value.length > 0 && contacts.value.length < 101){
		contacts.value.forEach((contact, i) => {
      payload['recipient'] =contact[0]
      send_to_background_task(payload,token)
      //emit('closeModal')
    });
  } else {
    let message = "No recipients or over 100 recipients provided"
		showToast(message)
  }
}

async function send_to_background_task(payload,token){
    let data = await postRequest("bulk_message_bg",payload,token)
    if(data.request.status == 200){
      let notification_message = "message will be sent to " + payload['recipient'] + " later"
      showToast(notification_message)
    } else {
      console.log(data)
    }
}

get_business_account()

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


	<div class="d-flex align-items-center mb-3">
    <loading v-model:active="spin_loading"
                 :is-full-page="true"/>
    <div>
			<ul class="breadcrumb">
				<li class="breadcrumb-item"><a href="#">PAGES</a></li>
				<li class="breadcrumb-item active">Multiple Products Message</li>
			</ul>
			<h1 class="page-header mb-0">Multiple Products Message</h1>
		</div>
	</div>

	<card>
			<fragment v-if="selected_waba_account">
				<card-body class="pb-2" v-if="!business_account_id">
						<div class="row">
							<div class="col-xl-12">
								<div class="form-group mb-3">
									<div class="flex-fill fw-bold fs-16px">At Meta Business Manager, Go to Business settings. Select Business info from the sidebar. Below your business portfolio name, you'll find your business ID number.</div>
								</div>
							</div>
						</div>
				</card-body>

				<card-body class="pb-2" v-if="!business_account_id">
						<div class="row">
							<div class="col-md-6">
								<div class="row">
									<div class="col-md-8">
										<input type="number" class="form-control ps-35px" placeholder="add business account id and get catalogs" v-model="input_business_account_id"/>
									</div>
									<div class="col-md-4">
										<button class="btn btn-default rounded-0" type="button" @click="addBusinessAccount"><span class="d-none d-md-inline">Add</span></button>
									</div>
								</div>
							</div>
						</div>
				</card-body>
			</fragment>

			<card-body class="pb-2" v-if="catalogs.length > 0">
	        <div class="row">
	          <div class="col-xl-6">
	            <div class="form-group mb-3">
	              <div class="flex-fill fw-bold fs-16px">Please select your catalog for getting products</div>
	            </div>
	            <div class="form-group mb-3" v-if="catalogs.length > 0">
	              <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="selectCatalog(catalog.id)" v-for="catalog in catalogs">{{catalog.name}}</button>
	            </div>
							<div class="form-group mb-3" v-else>
	              No product catalog, please create product catalog at Whatsapp Ecommerce -> Product Catalogs Setup
	            </div>
	          </div>
	        </div>
	    </card-body>
			<hr>
			<card-body>
        <div class="row">
          <div class="col-xl-6" v-for="component in template.components">
            <card v-if="component.type == 'HEADER' && component.format == 'TEXT'">
              <card-header class="fw-bold small">
                {{component.type}}
              </card-header>
              <card-body>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item">Content: {{component.text}}</li>
									<template v-if="component.example">
										<li class="list-group-item">Variable value: {{component.example.header_text[0]}}</li>
	                  <li class="list-group-item"><input type="text" class="form-control" placeholder="change variable" v-model="header_text"/></li>
									</template>
								</ul>
              </card-body>
            </card>
						<card v-else-if="component.type == 'BODY'">
              <card-header class="fw-bold small">
                {{component.type}}
              </card-header>
              <card-body>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item">Content: {{component.text}}</li>
									<template v-if="component.example">
	                  <li class="list-group-item">Variable value: {{component.example.body_text}}</li>
	                  <li class="list-group-item"><input type="text" class="form-control" placeholder="change variable value" v-model="body_text"/></li>
										<div v-if="body_text_message && component.type == 'BODY'">
						          {{body_text_message}}
						        </div>
									</template>
								</ul>
              </card-body>
            </card>
          </div>
        </div>
			</card-body>
      <card-body>
        <div class="row">
          <div class="col-xl-12">
            <card>
              <card-header class="fw-bold small">
                PRODUCTS
              </card-header>
              <card-body>
								<template v-if="products.length >0">
	                <div class="row" style="margin-bottom:10px;">
	                  <div class="col-xl-8">
	                    <div class="row">
	                      <div class="col-md-6">
	                        <label for="formControlRange" class="form-label">Cover Thumbnail</label>
	                        <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="Thumbnail Product Id" v-model="thumbnail_product_id"  @dragover.prevent @drop="handleThumbnaiDrop()"/>
	                      </div>
	                    </div>
	                  </div>
	                </div>
	                <hr>
								</template>
                <div class="row">
                  <div class="col-xl-8">
                    <div class="row">
                      <div class="col-md-12">
                        <button class="btn btn-default rounded-0" type="button" @click="addSection"><span class="d-none d-md-inline">Add Section</span></button>
                      </div>
                    </div>
                  </div>
                  <div class="col-xl-4" v-if="products.length > 0">
                    PRODUCTS @Catalogue
                  </div>
                </div>
              </card-body>
              <card-body>
                <div class="row">
                  <div class="col-xl-8">
                    <div class="row" v-for="section in sections" v-if="sections.length > 0" style="margin-bottom:10px;">
                      <div class="col-md-3">
                        <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="title" v-model="section.title"/>
                      </div>
                      <div class="col-md-7">
                        <textarea class="form-control" id="exampleFormControlTextarea1" rows="6" @dragover.prevent @drop="handleDrop(section)" v-model="section.product_items"></textarea>
                      </div>
                      <div class="col-md-1">
                        <button class="btn btn-default rounded-0" type="button" @click="deleteSection(section.id)"><span class="d-none d-md-inline">Delete</span></button>
                      </div>
                    </div>
                  </div>
                  <div class="col-xl-4">
                    <PerfectScrollbar>
                      <div class="list-group">
                        <draggable v-model="products" item-key="id">
                          <template #item="{element}">
                            <a href="#" class="list-group-item list-group-item-action" @dragstart="handleDragStart(element)">{{element.name}}<br>(id: {{element.retailer_id}})</a>
                           </template>
                        </draggable>
                      </div>
                    </PerfectScrollbar>
                  </div>
                </div>
              </card-body>
            </card>
          </div>
        </div>
			</card-body>
      <card-body v-if="products.length > 0">
        <card>
          <card-header class="fw-bold small">
            RECEIVER PHONE NUMEBR & PREVIEW
          </card-header>
          <card-body>
            <div class="row">
              <div class="col-xl-8">
                <div class="row">
                  <div class="col-md-6">
                    <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="Receiver Phone Number" v-model="recipient"/>
                  </div>
                  <div class="col-md-6">
                    <button class="btn btn-default rounded-0" type="button" @click="submit"><span class="d-none d-md-inline">Submit</span></button>
                  </div>
                </div>
              </div>
            </div>
          </card-body>
        </card>
			</card-body>
			<card-body v-if="products.length > 0">
				<card>
          <card-header class="fw-bold small">
            BULK SEND
          </card-header>
          <card-body>
            <div class="row">
              <div class="col-xl-8">
                <div class="row">
                  <div class="col-md-6">
                    <input type="file" class="form-control" id="defaultFile" @change="uploadExcel" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"/>
                  </div>
                  <div class="col-md-6">
                    <button class="btn btn-default rounded-0" type="button" @click="bulk_send"><span class="d-none d-md-inline">Bulk Send</span></button>
                  </div>
                </div>
              </div>
            </div>
          </card-body>
        </card>
		  </card-body>
	</card>

</template>
