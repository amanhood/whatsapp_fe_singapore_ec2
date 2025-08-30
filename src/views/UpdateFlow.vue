<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref, onMounted } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import draggable from 'vuedraggable'
import 'vue-select/dist/vue-select.css';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';

const router = useRouter()

let username = ref(null)
let token = ref(null)
let role = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let flow_id = ref(null)
let user_id = ref(null)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")
user_id.value = sessionStorage.getItem("id")
let notification_message = ref(null)
let selected_flow = ref(null)
let spin_loading = ref(false)
let preview_url = ref(false)
let isEdit = ref(false)

const formComponents = ref([
  { type: 'text', label: 'Text' },
  { type: 'email', label: 'Email' },
  { type: 'textarea', label: 'Textarea' },
  { type: 'optin', label: 'OptIn' },
  { type: 'date', label: 'Date' },
  { type: 'select', label: 'Select' },
  { type: 'radio', label: 'Radio' },
  { type: 'checkbox', label: 'Checkbox' }
])

const formData = ref({})
const section = ref({'components':[]})

function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if (role.value != 'parent'){
        router.push('/page/login');
    } 
  }
}

async function get_whatsapp_flow(flow_id){
    let payload= {}
    payload['id'] = flow_id
    //let data = await postRequest("bulk_message",payload,token)
    let response = await postRequest("get_whatsapp_flow",payload,token)
    if(response.request.status == 200){
      selected_flow.value = response['data']
      selected_waba_account.value = selected_flow.value.waba_id
      selected_phone_number_id.value = selected_flow.value.phone_number_id
      hydrateBuilderFromRecord(selected_flow.value, "1")
    } else {
      notification_message.value = "Failed to get flow"
      showToast(notification_message.value)
    }
}

function onComponentDropped(event, section) {
  updateComponentOrder(section)
}

function updateComponentOrder(section) {
  section.components.forEach((component, index) => {
    component.order_index = index + 1
  })
}


function cloneComponent(component, section = null) {
  if(section){
    console.log(section.components.length)
  }
  const rand5str = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  const id = Date.now() + "_" + rand5str
  const fieldName = `${component.type}_${id}`
  const isOptionType = ['select', 'radio', 'checkbox'].includes(component.type)
  formData.value[fieldName] = ''
  return {
    ...component,
    id,
    fieldName,
    label: '',         // the question, to be entered by admin
    isEditing: true,
    options: isOptionType ? ['Option 1', 'Option 2'] : [],
    is_required: false, // ✅ default to false
    order_index: section ? section.components.length : 1    // show input field for the question
  }
}

function deleteComponent(section, id) {
  const index = section.components.findIndex(c => c.id === id)
  if (index !== -1) {
      section.components.splice(index, 1)
  }
}


function normalizeOptions(options) {
  // ["Option 1","Option 2"] -> [{id:"option-1",title:"Option 1"}, ...]
  return (options || []).map(o => {
    const title = String(o).trim();
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return { id: id || "opt", title: title || "Option" };
  });
}

function builderToFlowChildren(components){
  const fields = [...components].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  return fields.map(f => {
    const label = f.label;
    const required = !!f.is_required;
    const name = f.fieldName;

    switch (f.type) {
      case "text":
        return { "type": "TextInput", "name":name, "label":label, "required":required, "input-type": "text" };

      case "email":
        return { "type": "TextInput", "name":name, "label":label, "required":required, "input-type": "email" };
      
      case "textarea":
        return { "type": "TextArea", "name":name, "label":label, "required":required};
      
      case "date":
        return { "type": "DatePicker", "name":name, "label":label, "required":required};
      
      case "optin":
        return { "type": "OptIn", "name":name, "label":label, "required":required};
      
      case "checkbox":
        // Multi-select set; if your Flow version doesn't support Checkboxes,
        // fallback to a Dropdown with "multi": true (if available).
        return {
          "type": "CheckboxGroup",
          "name":name,
          "label":label,
          "required":required,
          "data-source": normalizeOptions(f.options),
        };
      
      case "radio":
        // Multi-select set; if your Flow version doesn't support Checkboxes,
        // fallback to a Dropdown with "multi": true (if available).
        return {
          "type": "RadioButtonsGroup",
          "name":name,
          "label":label,
          "required":required,
          "data-source": normalizeOptions(f.options),
        };
      
      case "select":
        // Multi-select set; if your Flow version doesn't support Checkboxes,
        // fallback to a Dropdown with "multi": true (if available).
        return {
          "type": "Dropdown",
          "name":name,
          "label":label,
          "required":required,
          "data-source": normalizeOptions(f.options),
        };

    }
  })
}

function buildPayloadFromFields(builderFields, extra = {}) {
  const payload = builderFields.reduce((acc, f) => {
    const name = f.fieldName || f.name;
    if (!name) return acc;
    // Keep the ${form.*} token LITERAL for WhatsApp (do NOT use backticks)
    acc[name] = '${form.' + name + '}';
    return acc;
  }, {});
  extra = {'flow_id':selected_flow.value.id,}
  return { ...payload, ...extra }; // merge any fixed keys
}

async function submit(){
  spin_loading.value = true
  let children = []
  let components = builderToFlowChildren(section.value.components)
  let footer = {
    "type": "Footer",
    "label": "Submit",
    "on-click-action": {
      "name": "complete",
      "payload": buildPayloadFromFields(section.value.components)
    }
  }
  children = [...components, footer]

  let whatsapp_payload = 
    {
      "version": "6.0",
      "routing_model": {
        [selected_flow.value.routing_model_name]:[]
      },
      "screens": [
        {
          "terminal": true,
          "id": selected_flow.value.routing_model_name,
          "title": selected_flow.value.title,
          "layout": {
            "type": "SingleColumnLayout",
            "children": [
              {
                "type": "Form",
                "name": "text_input_form",
                "children": children
              }
            ]
          }
        }
      ]
    }
  let payload = {}
  payload['selected_waba_account'] = selected_waba_account.value
  payload['selected_phone_number_id'] = selected_phone_number_id.value
  payload['whatsapp_payload'] = whatsapp_payload
  payload['components'] = section.value
  payload['flow_id'] = selected_flow.value.id
  payload['whatsapp_flow_id'] = selected_flow.value.whatsapp_flow_id
  payload['flowpages'] = selected_flow.value.flowpages
  let url = isEdit.value
    ? 'edit_whatsapp_flow'
    : 'create_whatsapp_flow';

  let response = await postRequest(url,payload,token)
  if(response.request.status == 200){
    preview_url.value = response['data']['preview_url']
    get_whatsapp_flow(flow_id.value)
  } else {
    notification_message.value = "Failed to get flow"
    showToast(notification_message.value)
  }
  spin_loading.value = false
}

function displayPreviewUrl(){
  const url = (preview_url?.value || '').trim()
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function geenratePreviewForm(){
    let payload = {}
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
    payload['whatsapp_flow_id'] = selected_flow.value.whatsapp_flow_id
    let response = await postRequest('preview_whatsapp_flow',payload,token)
    if(response.request.status == 200){
      preview_url.value = response['data']['preview']['preview_url']
      displayPreviewUrl()
  } else {
      notification_message.value = "Failed to preview flow"
      showToast(notification_message.value)
  }
}

function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
}

function flowfieldToBuilderComponent(ff, idx = 0) {
  // Keep the saved "name" as both the stable fieldName and the draggable key.
  // This ensures updates edit the same field on the backend instead of creating a new one.
  const optionTypes = ["select", "radio", "checkbox"];
  return {
    type: ff.type,                         // "text" | "email" | "textarea" | "date" | "optin" | "select" | "radio" | "checkbox"
    label: ff.label || "",
    id: ff.id,                           // stable per field
    fieldName: ff.name,                    // used when building WhatsApp payload & backend upsert
    options: optionTypes.includes(ff.type) ? [...(ff.options || [])] : [],
    is_required: !!ff.required,
    order_index: ff.order_index ?? (idx + 1),
  };
}


function hydrateBuilderFromRecord(flow,pageNumber) {
  try {
    const pages = flow?.flowpages || [];
    // pick a page — default page "1"
    const page = pages.find(p => String(p.page_number) === String(pageNumber)) || pages[0];
    const saved = (page?.flowfields || []).slice().sort((a,b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    if(saved.length > 0){
      isEdit.value = true
    }
    section.value = { components: saved.map((ff, i) => flowfieldToBuilderComponent(ff, i)) };
  } catch (e) {
    showToast("Failed to load saved fields for editing.");
    section.value = { components: [] };
  }
}

onMounted(() => {
  checkLogin()
  const route = useRoute()
  flow_id.value = route.params.id
  get_whatsapp_flow(flow_id.value)
});

</script>

<style>
.marginBottom10 {
  margin-bottom: 10px;
  /* add !important if a framework overrides it */
  /* margin-bottom: 10px !important; */
}
</style>


<template>
  <loading v-model:active="spin_loading"
  :is-full-page="true"/>
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
                      <div class="flex-fill fw-bold fs-16px">Create your whatsapp form content</div>
                  </div>
              </div>
          </div>
      </card-body>
      <hr>
      <card-body class="pb-2">
          <div class="row">
              <div class="col-md-12">
                  <div class="row" style="margin-bottom:10px;">
                      <div class="col-md-10">
                          <div class="row">
                              <div class="col-md-3">
                                  <draggable
                                      :list="formComponents"
                                      :group="{ name: 'components', pull: 'clone', put: false }"
                                      item-key="type"
                                      :clone="cloneComponent"
                                      sort="false"
                                      tag="div"                              
                                      class="d-flex"
                                      >
                                      <template #item="{ element }">
                                          <div class="bg-gray-100 p-2 rounded cursor-grab me-2">
                                          {{ element.label }}
                                          </div>
                                      </template>
                                  </draggable>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </card-body>
      <card-body class="pb-2">
        <div class="row">
            <div class="col-md-12">
                <div class="row" style="margin-bottom:10px;" v-if="selected_flow">
                    <div class="flex-fill fw-bold fs-16px">{{ selected_flow.title }}</div>
                </div>   
                <div class="row" style="margin-bottom:10px;">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="row">
                                    <draggable
                                        v-model="section.components"
                                        :group="{ name: 'components', pull: true, put: true }"
                                        :clone="(component) => cloneComponent(component, section)"
                                        item-key="id"
                                        tag="div"
                                        class="d-flex flex-column gap-3 mt-2 border p-3 rounded bg-light"
                                        @add="(event) => onComponentDropped(event, section)"
                                        @end="updateComponentOrder(section)"
                                    >
                                        <template #item="{ element,index }">
                                            <div class="p-3 bg-white border rounded shadow-sm">

                                                <!-- Editable label input (shown immediately after drop) -->
                                                <div v-if="element.type == 'text' || element.type == 'email' || element.type == 'textarea'">
                                                    <input
                                                    v-model="element.label"
                                                    class="form-control mb-2"
                                                    placeholder="Enter your question"
                                                    :maxlength="20"
                                                    @keyup.enter="element.isEditing = false"
                                                    @blur="element.isEditing = false"
                                                    />
                                                </div>

                                                <div v-else>
                                                    <input
                                                    v-model="element.label"
                                                    class="form-control mb-2"
                                                    placeholder="Enter your question"
                                                    @keyup.enter="element.isEditing = false"
                                                    @blur="element.isEditing = false"
                                                    />
                                                </div>
                                    
                                                <!-- Field preview -->
                                                <div v-if="element.type === 'text'" class="marginBottom10">
                                                    Text
                                                </div>

                                                <div v-else-if="element.type === 'textarea'" class="marginBottom10">
                                                    TextArea
                                                </div>

                                                <div v-else-if="element.type === 'date'" class="marginBottom10">
                                                    DateTime
                                                </div>

                                                <div v-else-if="element.type === 'email'" class="marginBottom10">
                                                    Email
                                                </div>

                                                <div v-else-if="element.type === 'optin'" class="marginBottom10">
                                                    Optin (e.g: tickbox for agreement)
                                                </div>

                                                <div v-else-if="['select', 'radio', 'checkbox'].includes(element.type)" class="marginBottom10">
                                                    <div v-for="(opt, i) in element.options" :key="i" class="input-group mb-1">
                                                        <input
                                                        type="text"
                                                        class="form-control"
                                                        v-model="element.options[i]"
                                                        placeholder="Option text"
                                                        />
                                                        <button class="btn btn-outline-danger" @click="element.options.splice(i, 1)">
                                                        ×
                                                        </button>
                                                    </div>
                                                    <button class="btn btn-sm btn-outline-primary" @click="element.options.push('')">
                                                        Add Option
                                                    </button>
                                                </div>

                                                <div class="form-check mb-2" style="margin-top:10px;">
                                                    <input
                                                        class="form-check-input"
                                                        type="checkbox"
                                                        v-model="element.is_required"
                                                        :id="`required_${element.id}`"
                                                    />
                                                    <label class="form-check-label" :for="`required_${element.id}`">
                                                        Required
                                                    </label>
                                                </div>


                                                <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteComponent(section,element.id)" style="margin-top:10px;">delete</button>
                                            </div>
                                        </template>
                                    </draggable>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </card-body>
    <hr>
    <card-body class="pb-2">
        <div class="row">
            <div class="col-md-3">
                <button type="button" class="btn btn-teal mb-1 me-1" @click="submit">Update flow content</button>
            </div>
            <div class="col-md-3" v-if="preview_url">
                <button type="button" class="btn btn-yellow mb-1 me-1" @click="displayPreviewUrl">Preview flow</button>
            </div>

            <div class="col-md-3" v-if="!preview_url">
                <button type="button" class="btn btn-yellow mb-1 me-1" @click="geenratePreviewForm">Preview flow</button>
            </div>
        </div>
    </card-body>
  </card>
</template>
