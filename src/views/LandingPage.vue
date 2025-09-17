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

:root{
  --e-bg:#f8f7f5;           /* soft ivory */
  --e-card:#ffffff;
  --e-text:#1f2937;         /* slate-800 */
  --e-muted:#6b7280;        /* slate-500 */
  --e-gold:#CBA35C;         /* champagne gold */
  --e-ring:rgba(203,163,92,.35);
}

.page-wrap{ background: radial-gradient(1200px 600px at 50% -10%, #fff 20%, var(--e-bg) 70%); min-height:100vh; }
.container-xl{ max-width: 1100px; }

.hero{ text-align:center; padding: 48px 16px 8px; }
.hero-title{ font-weight:800; letter-spacing:.2px; color:var(--e-text); }
.hero-sub{ color:var(--e-muted); margin-top:6px; }

.elegant-card{
  background: var(--e-card);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,.06);
  overflow: hidden;
}

.section-divider{
  position: relative;
  margin: 28px 24px 12px;   /* space above/below */
}
/* draw the grey line first */
.section-divider::before{
  content: "";
  display: block;
  height: 1px;
  background: rgba(0,0,0,.08);
  width: 100%;
}

/* THEN the chip/title sits UNDER the line */
.section-divider > span{
  display: inline-block;
  margin-top: 10px;         /* moves title below the line */
  background: var(--e-card);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--e-muted);
  border: 1px solid rgba(0,0,0,.06);
}

/* Elevation ring wrapper (v-select, datepicker) */
.control-elevated{
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 14px;
  padding: 6px 10px;
  background: #fff;
  transition: box-shadow .2s, border-color .2s;
}
.control-elevated:focus-within{
  border-color: var(--e-gold);
  box-shadow: 0 0 0 6px var(--e-ring);
}

/* Floating labels, big inputs */
.form-control-xl{
  height: 54px;
  border-radius: 14px;
  padding: 14px 16px;
}
.form-floating > .form-control{
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,.12);
}
.form-floating > .form-control:focus{
  border-color: var(--e-gold);
  box-shadow: 0 0 0 6px var(--e-ring);
}
.form-label-sm{ font-weight:600; color:var(--e-text); }

/* Input group styling */
.input-group-lg .input-group-text{
  border-radius: 14px 0 0 14px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.12);
  border-right: none;
}
.input-group-lg .form-control{
  height: 54px;
  border-radius: 0 14px 14px 0;
  border-left: none;
}
.input-group .form-control:focus{
  border-color: var(--e-gold);
  box-shadow: 0 0 0 6px var(--e-ring);
}

/* v-select harmonization */
:deep(.v-select){
  --radius: 12px;
}
:deep(.v-select .vs__dropdown-toggle){
  border: none !important;
  min-height: 40px;
  padding: 6px 8px;
}
:deep(.v-select .vs__selected){
  margin-top: 4px;
}

/* Datepicker wrapper – ensure full width */
:deep(.datepicker){
  width: 100%;
}

/* Elegant pill options */
.option-pill{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,.10);
  background: #fff;
  cursor: pointer;
  user-select: none;
  transition: all .2s ease;
  font-weight: 600;
  color: var(--e-text);
}
.option-pill:hover{ transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,.06); }
.option-pill input:checked + span,
.option-pill:has(input:checked){
  border-color: var(--e-gold);
  box-shadow: 0 0 0 6px var(--e-ring);
}

/* Submit button */
.btn-elegant{
  background-image: linear-gradient(135deg, #e9d7a3, var(--e-gold));
  color: #322f22;
  border: none;
  border-radius: 999px;
  font-weight: 800;
  letter-spacing: .3px;
  box-shadow: 0 10px 24px rgba(203,163,92,.25);
  transition: transform .15s ease, box-shadow .2s ease, filter .2s;
}
.btn-elegant:hover{ transform: translateY(-2px); filter: brightness(1.02); box-shadow: 0 14px 28px rgba(203,163,92,.32); }
.btn-elegant:active{ transform: translateY(0); }

/* Quill content typographic polish */
.prose :where(h1,h2,h3){ color: var(--e-text); }
.prose :where(p,li){ color: var(--e-muted); }
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
  <!-- Toast stays the same -->

  <div class="page-wrap">
    <!-- Hero header -->
    <div class="hero">
      <h1 class="hero-title">{{ page_title || 'Reservation Form' }}</h1>
      <p class="hero-sub">Please fill in the details below</p>
    </div>

    <div class="container-xl">
      <card class="elegant-card">
        <!-- Content / intro -->
        <card-body class="pb-0">
          <div class="ql-editor prose" v-html="content"></div>
        </card-body>

        <!-- Recipient -->
        <div class="section-divider"><span>Recipient information</span></div>
        <card-body>
          <div class="row g-4 align-items-end">
            <div class="col-12 col-md-6">
              <label class="form-label form-label-sm">Phone number</label>
              <div class="input-group input-group-lg">
                <span class="input-group-text">
                  <i class="bi bi-telephone"></i>
                </span>
                <input
                  type="tel"
                  class="form-control"
                  v-model.trim="recipient"
                  inputmode="numeric"
                  pattern="[0-9+\-\s()]{6,20}"
                  placeholder="+852 6XXX XXXX"
                />
              </div>
            </div>
          </div>
        </card-body>

        <!-- Dynamic Sections -->
        <form @submit.prevent="handleSubmit">
          <div v-for="section in sections" :key="section.id || section.title">
            <div class="section-divider"><span>{{ section.title }}</span></div>

            <card-body class="pt-3">
              <div class="row g-4">
                <div class="col-12 col-md-6 col-xl-4" v-for="field in section.fields" :key="field.name">
                  <!-- text -->
                  <div v-if="field.type==='text'">
					<label class="form-label form-label-sm">{{ field.label }}</label>
                    <input
                      type="text"
                      class="form-control form-control-xl"
                      :placeholder="field.label"
                      v-model="formData[field.name].value"
                    />
                    
                  </div>

                  <!-- textarea -->
                  <div v-else-if="field.type==='textarea'">
                    <label class="form-label form-label-sm">{{ field.label }}</label>
                    <textarea class="form-control form-control-xl" rows="4"
                              v-model="formData[field.name].value" placeholder=" "></textarea>
                  </div>

                  <!-- number -->
                  <div v-else-if="field.type==='number'">
					<label class="form-label form-label-sm">{{ field.label }}</label>
                    <input
                      type="number"
                      class="form-control form-control-xl"
                      :value="formData[field.name].value ?? ''"
                      step="any"
                      :placeholder="field.label"
                      @input="e => {
                        const raw = e.target.value
                        formData[field.name].value = raw === '' ? null : (isNaN(Number(raw)) ? null : Number(raw))
                      }"
                    />
                    
                  </div>

                  <!-- date -->
                  <div v-else-if="field.type==='date'">
                    <label class="form-label form-label-sm">{{ field.label }}</label>
                    <div class="control-elevated">
                      <datepicker
                        :model-value="formData[field.name].value ? new Date(formData[field.name].value) : null"
                        @update:model-value="d => formData[field.name].value = d ? d.toISOString() : null"
                      />
                    </div>
                  </div>

                  <!-- select -->
                  <div v-else-if="field.type==='select'">
                    <label class="form-label form-label-sm">{{ field.label }}</label>
                    <div class="control-elevated">
                      <v-select
                        v-model="formData[field.name].value"
                        :options="field.options || []"
                        :reduce="opt => (typeof opt==='object' ? (opt.value ?? opt.label) : opt)"
                        :label="typeof (field.options?.[0]) === 'object' ? 'label' : undefined"
                        :clearable="true"
                      />
                    </div>
                  </div>

                  <!-- radio -->
                  <div v-else-if="field.type==='radio'">
                    <label class="form-label form-label-sm d-block mb-2">{{ field.label }}</label>
                    <div class="d-flex flex-wrap gap-2">
                      <label
                        v-for="(option, i) in field.options"
                        :key="i"
                        class="option-pill"
                      >
                        <input
                          type="radio"
                          class="visually-hidden"
                          :name="field.name"
                          :value="typeof option === 'object' ? (option.value ?? option.label) : option"
                          v-model="formData[field.name].value"
                        />
                        <span>{{ typeof option === 'object' ? (option.label ?? option.value) : option }}</span>
                      </label>
                    </div>
                  </div>

                  <!-- checkbox -->
                  <div v-else-if="field.type==='checkbox'">
                    <label class="form-label form-label-sm d-block mb-2">{{ field.label }}</label>
                    <div class="d-flex flex-wrap gap-2">
                      <label
                        v-for="(option, i) in field.options"
                        :key="i"
                        class="option-pill"
                      >
                        <input
                          type="checkbox"
                          class="visually-hidden"
                          :value="typeof option === 'object' ? (option.value ?? option.label) : option"
                          v-model="formData[field.name].value"
                        />
                        <span>{{ typeof option === 'object' ? (option.label ?? option.value) : option }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </card-body>
          </div>

          <!-- Submit -->
          <div class="section-divider"></div>
          <card-body class="text-center pb-5">
            <button type="submit" class="btn btn-elegant btn-lg px-5">
              <i class="bi bi-check2-circle me-2"></i> Submit
            </button>
          </card-body>
        </form>
      </card>
    </div>
  </div>
</template>