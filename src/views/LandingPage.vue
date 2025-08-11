<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref,onMounted,watch } from 'vue'
import { getRequest,postRequest,deleteRequest,formdataRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRoute,useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';
import { useAppOptionStore } from '@/stores/app-option';
import { postWithoutTokenRequest } from '../composables/api.js'
import datepicker from '@/assets/components/plugins/Datepicker.vue';


const router = useRouter()
const appOption = useAppOptionStore();

let notification_message = ref(null)
let page_title = ref(null)
let content = ref(null)
let sections = ref([])
let formData = ref({})
let recipient = ref(null)

onMounted(()=> {
  appOption.appSidebarHide = true;
	appOption.appHeaderHide = true;
	appOption.appContentClass = 'p-0';
})


function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

const route = useRoute()
const user_id = route.params.user
const landing_page_id = route.params.id

async function getLandingPageDetail(){
    let payload = {}
    payload['user_id'] = user_id
    const title = landing_page_id.replace(/-/g, ' ')  // "My Awesome Landing Page"
    payload['landing_page_id'] = title
	let response = await postWithoutTokenRequest("get_landing_page",payload)
	if(response['status'] == 200){
		page_title.value = response['data']['title']
        content.value = response['data']['content']
		if(response['data']['sections'].length > 0){
			sections.value = response['data']['sections']
		}
		initializeFormData()
	} else {
	    let message = "failed to get landing page"
        showToast(message)
	}
}


async function handleSubmit(){
	// if no recipient phone number, return
	if(!recipient.value){
		showToast("Please fill out recipient phone number")
		return
	}

	// Validate required fields based on .value
	for (const section of sections.value) {
		for (const field of (section.fields || [])) {
			const entry = formData.value[field.name]
			const val = entry ? entry.value : null
			if (field.required) {
				const isEmpty =
				val === undefined ||
				val === null ||
				(typeof val === 'string' && val.trim() === '') ||
				(Array.isArray(val) && val.length === 0)

				if (isEmpty) {
				showToast(`Please fill out required field: ${field.label}`)
				return
				}
			}
		}
	}
	let payload = {}
	payload['user_id'] = user_id
	const title = landing_page_id.replace(/-/g, ' ')  // "My Awesome Landing Page"
    payload['landing_page_id'] = title
	payload['form_data'] = formData.value
	payload['recipient'] = recipient.value
	let response = await postWithoutTokenRequest("submitting_form",payload)
	if(response['status'] == 200){
		router.push('/page/thank-you');
	} else {
	    let message = "failed to submit"
        showToast(message)
	}
}

getLandingPageDetail()

function initializeFormData() {
	for (const section of sections.value) {
		for (const field of (section.fields || [])) {
			let defaultValue = null
			if (field.type === 'checkbox') defaultValue = []
			else if (field.type === 'number') defaultValue = null
			else if (field.type === 'date') defaultValue = null
			else defaultValue = ''

			// Only initialize if not already present
			if (!formData.value[field.name]) {
				formData.value[field.name] = {
					label: field.label, // <-- label stored here
					value: defaultValue
				}
			}

			if (field.type === 'checkbox' && !Array.isArray(formData.value[field.name].value)) {
				formData.value[field.name].value = []
			}
		}
	}
}

</script>

<style scoped>
::v-deep(.ql-editor) {
  overflow-wrap: break-word;
  word-break: break-word;
  line-height: 1.5;
}
::v-deep(.ql-editor img) {
  max-width: 100% !important;
  height: auto !important;
  width: auto !important;
  display: block;
  margin: 0 auto;
}
::v-deep(.ql-align-center) {
  text-align: center;
}

::v-deep(.ql-align-right) {
  text-align: right;
}

::v-deep(.ql-align-justify) {
  text-align: justify;
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
	
	<div class="row gx-4" style="padding:2px;">
		<div class="col-lg-12">
			<card class="mb-4">
				<!-- <card-body class="text-body">
					<div v-html="content" width="100%"></div>
				</card-body> -->
                <card-body>
                    <div class="ql-editor" v-html="content"></div>
                </card-body>
				<hr>
				<card-body>
					<div class="row">
						<div class="col-md-12" style="text-align:center;font-size:16px;font-weight:bold;">
							Recipient information
						</div>
						<label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">phone number</label>
						<div class="col-md-12" style="text-align:center;font-size:16px;font-weight:bold;">
							<input type="number" class="form-control" placeholder="" v-model="recipient"/>
						</div>
					</div>
                   
                </card-body>
				<hr>
				<form @submit.prevent="handleSubmit">		
					<div v-for="section in sections" v-if="sections.length > 0">
						<card-body>
							<div class="col-md-12" style="text-align:center;font-size:16px;font-weight:bold;">
								{{ section.title}}
							</div>
							<div class="row" style="margin-top:20px;">
								<div class="col-md-4" v-for="field in section['fields']">
									<label class="form-label" for="exampleFormControlInput1" style="font-weight:normal;">{{ field['label']}}</label>
									<fragment v-if="field['type'] == 'text'">
										<input type="text" class="form-control" placeholder="" v-model="formData[field.name].value"/>
									</fragment>	
									<fragment v-if="field['type'] == 'textarea'">
										<textarea class="form-control" id="exampleFormControlTextarea1" rows="3" v-model="formData[field.name].value" placeholder=""></textarea>
									</fragment>
									<fragment v-if="field['type'] == 'number'">
										<input
											type="number"
											class="form-control"
											:value="formData[field.name].value ?? ''"
											@input="e => {
											const raw = e.target.value
											formData[field.name].value = raw === '' ? null : (isNaN(Number(raw)) ? null : Number(raw))
											}"
										/>
									</fragment>
									<fragment v-if="field['type'] == 'date'">
										<datepicker v-model="formData[field.name].value" @update:model-value="Date.parse(formData[field.name].value)"/>
									</fragment>
									<fragment v-if="field['type'] == 'select'">
										<v-select
											v-model="formData[field.name].value"
											:options="field.options || []"
											:reduce="opt => opt"  
											:label="typeof (field.options?.[0]) === 'object' ? 'label' : undefined"
										/>
									</fragment>
									<fragment v-if="field['type'] == 'radio'">
										<div
											class="form-check"
											v-for="(option, optIndex) in field.options"
											:key="optIndex"
										>
											<input
												class="form-check-input"
												type="radio"
												:id="`radio_${optIndex}`"
												:name="`${field.name}`"
												:value="option"
												v-model="formData[field.name].value"
											/>
											<label
												class="form-check-label"
												:for="`radio_${optIndex}`"
											>
												{{ option }}
											</label>
										</div>
									</fragment>
									<fragment v-if="field['type'] == 'checkbox'">
										<div
											class="form-check"
											v-for="(option, i) in field.options"
											:key="i"
										>
											<input
												class="form-check-input"
												type="checkbox"
												:id="`${field.name}_${i}`"
												:name="field.name"
												:value="option"
												v-model="formData[field.name].value"
											/>
											<label
												class="form-check-label"
												:for="`${field.name}_${i}`"
											>
											{{ option }}
											</label>
										</div>
									</fragment>
								</div>	
							</div>
						</card-body>
						<hr>
					</div>	
					<card-body>
						<div class="col-md-12" style="text-align:center;font-size:16px;font-weight:bold;">
							<button type="submit" class="btn btn-green mb-1 me-1">Submit</button>
						</div>
					</card-body>
				</form>
			</card>
			
		</div>
	</div>
</template>